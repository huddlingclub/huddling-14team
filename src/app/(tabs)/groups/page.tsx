import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { GroupsScreen } from '@/screens/GroupsScreen';

export const metadata: Metadata = { title: '그룹' };

// PG-401 그룹 — 태그별로 사람 보기
export default async function Groups() {
  if (!(await getSession())) redirect('/login');
  return (
    <Suspense fallback={null}>
      <GroupsScreen />
    </Suspense>
  );
}
