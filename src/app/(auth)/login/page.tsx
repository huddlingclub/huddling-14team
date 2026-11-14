import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { destination } from '@/lib/profile-input';
import { getSession } from '@/lib/session';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export const metadata: Metadata = { title: '로그인' };

// PG-101 로그인. ?next=/p/<참여자 ID> 로 들어오면(QR) 로그인 뒤 그 프로필로 간다
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = destination((await searchParams).next);
  if (await getSession()) redirect(next);
  return <LoginScreen next={next} />;
}
