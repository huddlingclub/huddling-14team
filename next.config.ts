import type { NextConfig } from 'next';

// CANONICAL_HOST(예: huddling.link)를 넣으면 예전 임시 주소 · www로 들어온 요청을 대표 주소로 보낸다.
// 로그인(쿠키)은 주소마다 따로라서, QR로 열린 화면과 로그인한 화면의 주소를 하나로 맞추기 위해서다.
const canonical = process.env.CANONICAL_HOST;

// 모든 응답에 붙이는 보안 머리말
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' }, // 다른 사이트가 이 화면을 액자(iframe)에 넣어 누르게 하는 것을 막는다
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, // 밖으로 나갈 때 프로필 주소(/p/…)를 넘기지 않는다
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' }, // 카메라는 QR 스캔에만
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
