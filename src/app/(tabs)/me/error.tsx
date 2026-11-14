'use client';

import { ErrorRetry } from '@/components/feedback/States';
import { TopBar } from '@/components/ui';

export default function MyPageError({ reset }: { reset: () => void }) {
  return (
    <>
      <TopBar title="마이" />
      <ErrorRetry message="프로필을 불러오지 못했어요." onRetry={reset} />
    </>
  );
}
