import { redirect } from 'next/navigation';
import { DEMO } from '@/lib/demo';
import { getSession } from '@/lib/session';
import { GroupsScreen } from '@/screens/GroupsScreen';

// PG-401 그룹 리스트
export default async function Groups() {
  if (!DEMO && !(await getSession())) redirect('/login');
  return <GroupsScreen />;
}
