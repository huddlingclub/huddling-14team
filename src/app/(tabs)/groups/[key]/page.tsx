import { Suspense } from 'react';
import { Loading } from '@/components/feedback/States';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <GroupDetailScreen />
    </Suspense>
  );
}
