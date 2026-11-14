// PG-601 타인 프로필 (QR 링크 /p/[id]와 같은 데이터)
import { getParticipant, profileView } from '@/lib/domain';
import { HttpError, handle, ok, requireUser } from '@/lib/http';
import { read } from '@/lib/store';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const uid = await requireUser();
    const { id } = await ctx.params;
    const profile = await read((db) => {
      const me = getParticipant(db, uid);
      if (!me) throw new HttpError(401, '로그인이 필요해요');
      const p = getParticipant(db, id);
      if (!p) throw new HttpError(404, '없는 프로필이에요');
      return profileView(db, me, p);
    });
    return ok({ profile });
  });
}
