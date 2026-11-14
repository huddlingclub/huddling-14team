// PG-201 홈 — 내 프로필 · 받은 요청 · 내 태그별 그룹 · 내 친구를 한 번에
import { getParticipant, homeData } from '@/lib/domain';
import { HttpError, handle, ok, requireUser } from '@/lib/http';
import { read } from '@/lib/store';

export async function GET() {
  return handle(async () => {
    const uid = await requireUser();
    const data = await read((db) => {
      const me = getParticipant(db, uid);
      if (!me) throw new HttpError(401, '로그인이 필요해요');
      return homeData(db, me);
    });
    return ok(data);
  });
}
