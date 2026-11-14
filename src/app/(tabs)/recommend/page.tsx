import { redirect } from 'next/navigation';
import { DEMO } from '@/lib/demo';
import { getSession } from '@/lib/session';
import { RecommendScreen } from '@/screens/RecommendScreen';

// PG-301 친구추천
export default async function Recommend() {
  if (!DEMO && !(await getSession())) redirect('/login');
  return <RecommendScreen />;
}
