// PG-201 홈 — 내 프로필 · 받은 요청 · 내 태그별 그룹 · 내 친구를 한 번에
import { homeData } from '@/lib/domain';
import { handle, ok, viewerNetwork } from '@/lib/http';

export async function GET() {
  return handle(async () => {
    const { net, me } = await viewerNetwork();
    return ok(homeData(net, me));
  });
}
