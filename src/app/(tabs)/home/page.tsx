import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { HomeScreen } from '@/screens/HomeScreen';

// PG-201 홈 — 내 관계
export default async function Home() {
  if (!(await getSession())) redirect('/login');
  return <HomeScreen />;
}
