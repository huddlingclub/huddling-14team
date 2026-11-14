import { Suspense } from 'react';
import { DemoLogin } from '@/screens/demo/DemoLogin';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DemoLogin />
    </Suspense>
  );
}
