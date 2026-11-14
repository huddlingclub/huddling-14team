// PG-401 그룹 리스트 — 이번 밋업의 전체 그룹 (0명 그룹 제외)
import { getParticipant, groupsOf } from '@/lib/domain';
import { HttpError, handle, ok, requireUser } from '@/lib/http';
import { read } from '@/lib/store';

export async function GET() {
  return handle(async () => {
    const uid = await requireUser();
    const groups = await read((db) => {
      const me = getParticipant(db, uid);
      if (!me) throw new HttpError(401, '로그인이 필요해요');
      return groupsOf(db, me);
    });
    return ok({ groups });
  });
}
