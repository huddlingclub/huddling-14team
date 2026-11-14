import type { MetadataRoute } from 'next';

// 홈 화면에 추가했을 때의 앱 이름·아이콘·색 (안드로이드 크롬 · iOS 사파리)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '허들워킹 · 허들링클럽 밋업 네트워킹',
    short_name: '허들워킹',
    description: '공통점으로 사람을 찾고 QR로 바로 친구가 되는 허들링클럽 밋업 네트워킹',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0f0b29',
    theme_color: '#0f0b29',
    lang: 'ko',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
