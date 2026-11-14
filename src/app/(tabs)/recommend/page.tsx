import { Suspense } from 'react';
import { Loading } from '@/components/feedback/States';
import { RecommendScreen } from '@/screens/RecommendScreen';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <RecommendScreen />
    </Suspense>
  );
}
