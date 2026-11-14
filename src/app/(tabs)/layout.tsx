import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/feedback/Toast';
import { TabBar } from '@/components/ui/TabBar';
import { PRETENDARD_CSS } from '@/lib/fonts';

// 1depth 화면 틀 — 앱바 + 스크롤 콘텐츠 + 하단 4탭. 하위 화면에서는 탭이 빠진다. 로그인 확인은 각 페이지가 한다
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tabs-shell app-frame">
      <link rel="stylesheet" href={PRETENDARD_CSS} precedence="default" />
      <ToastProvider>
        <div className="tabs-body flex flex-1 flex-col">{children}</div>
        <TabBar />
      </ToastProvider>
    </div>
  );
}
