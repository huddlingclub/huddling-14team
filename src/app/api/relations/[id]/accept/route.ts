// 수락 — [id] = 나에게 요청을 보낸 사람. 받은 사람만 수락할 수 있고, 다시 눌러도 그대로
import { findRelation, getParticipant } from '@/lib/domain';
import { HttpError, handle, ok, requireUser } from '@/lib/http';
import { write } from '@/lib/store';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const uid = await requireUser();
    const { id } = await ctx.params;
    await write((db) => {
      if (!getParticipant(db, uid)) throw new HttpError(401, '로그인이 필요해요');
      const rel = findRelation(db, uid, id);
      if (!rel) throw new HttpError(404, '받은 요청이 없어요');
      if (rel.acceptedAt) return; // 이미 친구 — 수락 시각 유지
      if (rel.requesterId === uid) throw new HttpError(409, '내가 보낸 요청은 상대가 수락해야 해요');
      rel.acceptedAt = new Date().toISOString();
    });
    return ok({ relation: 'friend' });
  });
}
