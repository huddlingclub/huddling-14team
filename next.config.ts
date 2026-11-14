import type { NextConfig } from 'next';

// 데모 모드(NEXT_PUBLIC_DEMO=1): DB 없이 화면 흐름만 보여준다.
// 계정 화면(/login · /signup · /me)을 서버 호출이 없는 데모 화면(src/screens/demo)으로 바꿔 연결한다.
// 값을 주지 않으면 아래 규칙은 비어 있고, 실제 계정·DB 구현이 그대로 동작한다.
const demo = process.env.NEXT_PUBLIC_DEMO === '1';

const nextConfig: NextConfig = {
  async redirects() {
    return demo ? [{ source: '/', destination: '/login', permanent: false }] : [];
  },
  async rewrites() {
    return {
      beforeFiles: demo
        ? [
            { source: '/login', destination: '/demo/login' },
            { source: '/signup', destination: '/demo/signup' },
            { source: '/me', destination: '/demo/me' },
          ]
        : [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
