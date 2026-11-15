import type { ReactNode } from 'react';
import { PRETENDARD_CSS, PRETENDARD_CSS_INTEGRITY } from '@/lib/fonts';

// 로그인 · 등록 화면 틀 (하단 탭 없음)
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      <link rel="stylesheet" href={PRETENDARD_CSS} integrity={PRETENDARD_CSS_INTEGRITY} crossOrigin="anonymous" precedence="default" />
      {children}
    </div>
  );
}
