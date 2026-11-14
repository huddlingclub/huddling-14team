import type { NextConfig } from 'next';

// CANONICAL_HOST(예: huddling.link)를 넣으면 예전 임시 주소 · www로 들어온 요청을 대표 주소로 보낸다.
// 로그인(쿠키)은 주소마다 따로라서, QR로 열린 화면과 로그인한 화면의 주소를 하나로 맞추기 위해서다.
const canonical = process.env.CANONICAL_HOST;

const nextConfig: NextConfig = {
  async redirects() {
    if (!canonical) return [];
    return ['huddling-14team.vercel.app', `www.${canonical}`].map((from) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: from }],
      destination: `https://${canonical}/:path*`,
      permanent: false,
    }));
  },
};

export default nextConfig;
