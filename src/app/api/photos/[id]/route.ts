import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

// 프로필 사진 — 이번 밋업에 로그인한 참여자에게만 보여 준다 (시안: "사진은 이번 밋업 등록자에게만 보여요")
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!(await getSession())) return new Response(null, { status: 401 });
    if (!UUID.test(id)) return new Response(null, { status: 404 });
    const { rows } = await db().query<{ mime: string; data: Buffer }>(
      'SELECT mime, data FROM participant_photo WHERE participant_id = $1',
      [id],
    );
    if (!rows[0]) return new Response(null, { status: 404 });
    // 주소에 ?v=(바뀐 시각)이 붙어 있어 사진을 바꾸면 주소도 바뀐다 → 길게 캐시해도 된다(본인 기기에만)
    return new Response(new Uint8Array(rows[0].data), {
      headers: {
        'Content-Type': rows[0].mime,
        'Cache-Control': 'private, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff', // 사진으로만 다루고, 내용을 보고 다른 형식으로 추측하지 않게
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
