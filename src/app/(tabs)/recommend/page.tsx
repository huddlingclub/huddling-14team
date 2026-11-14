import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { RecommendScreen } from '@/screens/RecommendScreen';

// PG-301 친구추천
export default async function Recommend() {
  if (!(await getSession())) redirect('/login');
  return <RecommendScreen />;
}
