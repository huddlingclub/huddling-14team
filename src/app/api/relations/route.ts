// 친구 관계 — 목록 조회 · 친구 요청 (ERD.md "친구 상태와 쓰기 규칙")
import { db } from '@/lib/db';
import { relationLists, relationView } from '@/lib/domain';
import { HttpError, assertSameOrigin, handle, ok, participantId, requireUser, viewerNetwork } from '@/lib/http';

export async function GET() {
  return handle(async () => {
    const { net, me } = await viewerNetwork();
    return ok(relationLists(net, me));
  });
}

/**
 * 요청. 두 사람 사이 기록은 한 건만 유지한다(복합 기본 키).
 * 이미 기록이 있으면(반대 방향 대기 포함) 바꾸지 않고 현재 상태를 돌려준다.
 */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const uid = await requireUser();
    const body: unknown = await request.json().catch(() => null);
    const toId = participantId((body as { toId?: unknown } | null)?.toId, '없는 프로필이에요.');
    if (toId === uid) throw new HttpError(400, '나에게는 요청할 수 없어요.');
    try {
      await db().query(
        `INSERT INTO friend_relation (participant_a_id, participant_b_id, requester_id)
         VALUES (LEAST($1::uuid, $2::uuid), GREATEST($1::uuid, $2::uuid), $1::uuid)
         ON CONFLICT (participant_a_id, participant_b_id) DO NOTHING`,
        [uid, toId],
      );
    } catch (error) {
      // 23503 = 없는 참여자(외래 키)
      if ((error as { code?: string }).code === '23503') throw new HttpError(404, '없는 프로필이에요.');
      throw error;
    }
    const { rows } = await db().query<{ requesterId: string; acceptedAt: Date | null }>(
      `SELECT requester_id AS "requesterId", accepted_at AS "acceptedAt" FROM friend_relation
       WHERE participant_a_id = LEAST($1::uuid, $2::uuid) AND participant_b_id = GREATEST($1::uuid, $2::uuid)`,
      [uid, toId],
    );
    return ok({ relation: relationView(rows[0], uid) });
  });
}
