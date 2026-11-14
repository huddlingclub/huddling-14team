import { Suspense } from 'react';
import { Loading } from '@/components/feedback/States';
import { GroupsScreen } from '@/screens/GroupsScreen';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <GroupsScreen />
    </Suspense>
  );
}
