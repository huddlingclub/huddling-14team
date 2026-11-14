import { readJson } from '@/lib/account-http';
import { db } from '@/lib/db';
import { handle, HttpError, ok, requireUser } from '@/lib/http';

// 프로필 사진 — 브라우저에서 정사각 384px JPEG로 줄여 data URL로 보낸다(보통 30~60KB). 300KB를 넘으면 거절
const MAX_BYTES = 300_000;
const DATA_URL = /^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/=]+)$/;

export function POST(request: Request) {
  return handle(async () => {
    const uid = await requireUser();
    const input = await readJson(request);
    const match = typeof input?.dataUrl === 'string' ? DATA_URL.exec(input.dataUrl) : null;
    if (!match) throw new HttpError(400, '사진 파일을 확인해 주세요.');
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new HttpError(413, '사진이 너무 커요. 다른 사진을 골라 주세요.');
    const { rows } = await db().query<{ v: string }>(
      `INSERT INTO participant_photo (participant_id, mime, data, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (participant_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
       RETURNING floor(extract(epoch FROM updated_at))::bigint::text AS v`,
      [uid, match[1], bytes],
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
