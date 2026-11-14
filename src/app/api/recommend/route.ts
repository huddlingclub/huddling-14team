// PG-301 친구추천 — 본인·친구 제외, 공통점 많은 순, 한 사람당 한 건
import { getParticipant, recommend } from '@/lib/domain';
import { HttpError, handle, ok, requireUser } from '@/lib/http';
import { read } from '@/lib/store';

export async function GET() {
  return handle(async () => {
    const uid = await requireUser();
    const items = await read((db) => {
      const me = getParticipant(db, uid);
      if (!me) throw new HttpError(401, '로그인이 필요해요');
      return recommend(db, me);
    });
    return ok({ items });
  });
}
