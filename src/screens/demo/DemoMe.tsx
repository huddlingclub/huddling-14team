'use client';
// [데모 전용] PG-501 마이페이지 — 실제 서비스에서는 src/app/(tabs)/me (계정 담당 구현)를 쓴다
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorRetry, Loading } from '@/components/feedback/States';
import { useToast } from '@/components/feedback/Toast';
import { Button, TopBar } from '@/components/ui';
import { api, useApi } from '@/lib/client';
import type { SelfProfile } from '@/lib/types';
import { DemoProfileForm, type ProfileValue } from './DemoProfileForm';

function Form({ me }: { me: SelfProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState<ProfileValue>({ displayName: me.displayName, tags: me.tags, customTags: me.customTags });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api('/api/me', { method: 'PATCH', body: value });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast('저장했어요');
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <form onSubmit={save} className="flex flex-1 flex-col bg-[var(--color-background-surface)]">
      <div className="px-4 py-5">
        <DemoProfileForm value={value} onChange={setValue} />
      </div>
      <div className="sticky bottom-[60px] mt-auto space-y-2 bg-[var(--color-background-surface)] px-4 py-3 shadow-[inset_0_1px_0_var(--color-border)]">
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? '저장 중…' : '저장'}
        </Button>
        <Button type="button" variant="secondary" onClick={logout}>
          로그아웃
        </Button>
      </div>
    </form>
  );
}

export function DemoMe() {
  const { data, error, reload } = useApi<{ me: SelfProfile }>('/api/me');
  return (
    <>
      <TopBar title="마이페이지" />
      {data ? <Form me={data.me} /> : error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading />}
    </>
  );
}
