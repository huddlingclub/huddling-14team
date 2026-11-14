// 그룹 탭 — 내 친구를 태그별로 (친구가 아닌 참여자는 내보내지 않는다)
import { friendGroups } from '@/lib/domain';
import { handle, ok, viewerNetwork } from '@/lib/http';

export async function GET() {
  return handle(async () => {
    const { net, me } = await viewerNetwork();
    return ok(friendGroups(net, me));
  });
}
