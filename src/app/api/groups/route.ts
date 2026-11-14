// PG-401 그룹 리스트 — 이번 밋업의 전체 그룹 (0명 그룹 제외)
import { groupsOf } from '@/lib/domain';
import { handle, ok, viewerNetwork } from '@/lib/http';

export async function GET() {
  return handle(async () => {
    const { net, me } = await viewerNetwork();
    return ok({ groups: groupsOf(net, me) });
  });
}
