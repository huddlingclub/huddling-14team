import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ScanScreen } from '@/screens/ScanScreen';

export const metadata: Metadata = { title: 'QR 스캔' };

// PG-603 QR 스캔 — 상대 QR을 앱 안에서 읽는다
export default async function Scan() {
  if (!(await getSession())) redirect('/login');
  return <ScanScreen />;
}
