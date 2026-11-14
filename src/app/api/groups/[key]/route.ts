// PG-402 그룹 상세 — key 예: team:14조 (URL 인코딩된 값)
import { groupMembers, groupSummary } from '@/lib/domain';
import { HttpError, handle, ok, viewerNetwork } from '@/lib/http';

function decode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function GET(_request: Request, ctx: { params: Promise<{ key: string }> }) {
  return handle(async () => {
    const key = decode((await ctx.params).key);
    const { net, me } = await viewerNetwork();
    const group = groupSummary(net, me, key);
    if (!group) throw new HttpError(404, '없는 그룹이에요.');
    return ok({ group, members: groupMembers(net, me, group.key) });
  });
}
