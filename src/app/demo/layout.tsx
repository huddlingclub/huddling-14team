import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { DEMO } from '@/lib/demo';

// 데모 모드 전용 계정 화면(/login · /signup이 여기로 연결됨 — next.config.ts)
export default function DemoLayout({ children }: { children: ReactNode }) {
  if (!DEMO) notFound();
  return <div className="light-screen mx-auto flex min-h-dvh w-full max-w-[32rem] flex-col">{children}</div>;
}
