import { Suspense } from 'react';
import { Loading } from '@/components/feedback/States';
import { ProfileScreen } from '@/screens/ProfileScreen';

// /p/[id] — 타인 프로필 · QR 링크가 도착하는 주소
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfileScreen />
    </Suspense>
  );
}
