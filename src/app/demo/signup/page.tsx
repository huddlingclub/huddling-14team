import { Suspense } from 'react';
import { DemoSignup } from '@/screens/demo/DemoSignup';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DemoSignup />
    </Suspense>
  );
}
