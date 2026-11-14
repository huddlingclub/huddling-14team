// 수락 — [id] = 나에게 요청을 보낸 사람. 받은 사람만 수락할 수 있고, 다시 눌러도 그대로
import { db } from '@/lib/db';
import { HttpError, assertSameOrigin, handle, ok, participantId, requireUser } from '@/lib/http';

const PAIR =
  'participant_a_id = LEAST($1::uuid, $2::uuid) AND participant_b_id = GREATEST($1::uuid, $2::uuid)';

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    assertSameOrigin(request);
    const uid = await requireUser();
    const fromId = participantId((await ctx.params).id, '받은 요청이 없어요.');
    const updated = await db().query(
      `UPDATE friend_relation SET accepted_at = now()
       WHERE ${PAIR} AND requester_id = $2::uuid AND accepted_at IS NULL`,
      [uid, fromId],
    );
    if (!updated.rowCount) {
      const { rows } = await db().query<{ acceptedAt: Date | null }>(
        `SELECT accepted_at AS "acceptedAt" FROM friend_relation WHERE ${PAIR}`,
        [uid, fromId],
      );
      if (!rows[0]) throw new HttpError(404, '받은 요청이 없어요.');
      // 기록은 있는데 아직 대기 중 = 내가 보낸 요청
      if (!rows[0].acceptedAt) throw new HttpError(409, '내가 보낸 요청은 상대가 수락해야 해요.');
    }
    return ok({ relation: 'friend' });
  });
}
