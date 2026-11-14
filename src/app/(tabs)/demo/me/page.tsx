import { notFound } from 'next/navigation';
import { DEMO } from '@/lib/demo';
import { DemoMe } from '@/screens/demo/DemoMe';

// 데모 모드 전용 마이페이지(/me가 여기로 연결됨 — next.config.ts)
export default function Page() {
  if (!DEMO) notFound();
  return <DemoMe />;
}
