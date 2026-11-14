import { Suspense } from 'react';
import { Loading } from '@/components/feedback/States';
import { RequireAuth } from '@/components/RequireAuth';
import { TabBar } from '@/components/ui/TabBar';

// 로그인한 사람만 들어오는 영역 — 하단 탭 4개 (홈 · 추천 · 그룹 · 마이)
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <RequireAuth>
        <main className="flex flex-1 flex-col">{children}</main>
        <TabBar />
      </RequireAuth>
    </Suspense>
  );
}
