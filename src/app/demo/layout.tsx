import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { DEMO } from '@/lib/demo';
import { PRETENDARD_CSS } from '@/lib/fonts';

// 데모 모드 전용 계정 화면(/login · /signup이 여기로 연결됨 — next.config.ts)
export default function DemoLayout({ children }: { children: ReactNode }) {
  if (!DEMO) notFound();
  return (
    <div className="light-screen app-frame is-surface">
      <link rel="stylesheet" href={PRETENDARD_CSS} precedence="default" />
      {children}
    </div>
  );
}
