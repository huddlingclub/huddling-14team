import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/feedback/Toast';
import { TabBar } from '@/components/ui/TabBar';

// 하단 탭 4개(홈 · 추천 · 그룹 · 마이)가 붙는 영역. 로그인 확인은 각 페이지가 한다
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="tabs-shell mx-auto flex min-h-dvh w-full max-w-[32rem] flex-col">
        <div className="tabs-body flex flex-1 flex-col">{children}</div>
        <TabBar />
      </div>
    </ToastProvider>
  );
}
