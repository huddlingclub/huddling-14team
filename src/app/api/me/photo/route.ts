import { readJson, requesterAddress } from '@/lib/account-http';
import { db } from '@/lib/db';
import { assertRate, handle, HttpError, ok, requireUser } from '@/lib/http';

// 프로필 사진 — 브라우저에서 정사각 384px JPEG로 줄여 data URL로 보낸다(보통 30~60KB). 300KB를 넘으면 거절.
// 화면이 JPEG만 보내므로 서버도 JPEG만 받고, 파일 머리말을 직접 읽어 진짜 JPEG인지 · 가로세로가 큰지 확인한다.
// (용량은 작은데 펼치면 수만 px인 사진을 올려 다른 참여자 휴대폰을 멈추게 하는 것을 막는다)
const MAX_BYTES = 300_000;
const MAX_SIDE = 1024;
const DATA_URL = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;

/** JPEG 머리말에서 가로 · 세로를 읽는다. JPEG가 아니거나 크기 정보가 없으면 null */
function jpegSize(b: Buffer) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1; // 채움 바이트
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2; // 길이가 없는 표식
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return null; // 크기 정보 없이 그림 데이터가 시작됨
    const length = b.readUInt16BE(i + 2);
    if (length < 2) return null;
    const frame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (frame) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

export function POST(request: Request) {
  return handle(async () => {
    const uid = await requireUser();
    const input = await readJson(request);
    const match = typeof input?.dataUrl === 'string' ? DATA_URL.exec(input.dataUrl) : null;
    if (!match) throw new HttpError(400, '사진 파일을 확인해 주세요.');
    const bytes = Buffer.from(match[1], 'base64');
    if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new HttpError(413, '사진이 너무 커요. 다른 사진을 골라 주세요.');
    const size = jpegSize(bytes);
    if (!size || !size.width || !size.height || size.width > MAX_SIDE || size.height > MAX_SIDE) {
      throw new HttpError(400, '사진 파일을 확인해 주세요.');
    }
    // 한 사람 1분 10번, 같은 곳(와이파이) 1분 120번 — 사진을 계속 바꿔 올려 저장 공간을 채우지 못하게
    await assertRate(`photo:${uid}`, 10);
    await assertRate(`photo:address:${requesterAddress(request)}`, 120);
    const { rows } = await db().query<{ v: string }>(
      `INSERT INTO participant_photo (participant_id, mime, data, updated_at) VALUES ($1, 'image/jpeg', $2, now())
       ON CONFLICT (participant_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
       RETURNING floor(extract(epoch FROM updated_at))::bigint::text AS v`,
      [uid, bytes],
    );
    return ok({ photo: `/api/photos/${uid}?v=${rows[0].v}` });
  });
}

export function DELETE(request: Request) {
  return handle(async () => {
    const uid = await requireUser();
    const site = request.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin') throw new HttpError(403, '잘못된 요청이에요.');
    await db().query('DELETE FROM participant_photo WHERE participant_id = $1', [uid]);
    return ok({ photo: null });
  });
}
