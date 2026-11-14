import { db } from '@/lib/db';
import { handle, ok, requireUser } from '@/lib/http';

// 하단 탭 '홈' 배지 — 아직 수락하지 않은 받은 친구 요청 수
export function GET() {
  return handle(async () => {
    const uid = await requireUser();
    const { rows } = await db().query<{ n: number }>(
      `SELECT count(*)::int AS n FROM friend_relation
       WHERE accepted_at IS NULL AND requester_id <> $1 AND (participant_a_id = $1 OR participant_b_id = $1)`,
      [uid],
    );
    return ok({ received: rows[0].n });
  });
}
