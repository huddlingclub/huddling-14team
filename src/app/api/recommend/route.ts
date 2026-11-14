// PG-301 친구추천 — 본인·친구 제외, 공통점 많은 순, 한 사람당 한 건
import { recommend } from '@/lib/domain';
import { handle, ok, viewerNetwork } from '@/lib/http';

export async function GET() {
  return handle(async () => {
    const { net, me } = await viewerNetwork();
    return ok({ items: recommend(net, me) });
  });
}
