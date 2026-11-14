// PG-402 그룹 상세 — key 예: team:14조 (URL 인코딩된 값)
import { getParticipant, groupMembers, groupSummary } from '@/lib/domain';
import { HttpError, handle, ok, requireUser } from '@/lib/http';
import { read } from '@/lib/store';
import { isValidTag } from '@/lib/tags';

function decode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  return handle(async () => {
    const uid = await requireUser();
    const key = decode((await ctx.params).key);
    if (!isValidTag(key)) throw new HttpError(404, '없는 그룹이에요');
    const data = await read((db) => {
      const me = getParticipant(db, uid);
      if (!me) throw new HttpError(401, '로그인이 필요해요');
      return { group: groupSummary(db, me, key), members: groupMembers(db, me, key) };
    });
    return ok(data);
  });
}
