import { Suspense } from 'react';
import { Loading } from '@/components/feedback/States';
import { QrScreen } from '@/screens/QrScreen';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <QrScreen />
    </Suspense>
  );
}
