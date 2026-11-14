import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen';

// PG-402 그룹 상세
export default async function GroupDetail() {
  if (!(await getSession())) redirect('/login');
  return <GroupDetailScreen />;
}
