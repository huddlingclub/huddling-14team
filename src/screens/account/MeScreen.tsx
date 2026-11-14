'use client';
// [교체 예정] PG-501 마이페이지 — 온보딩과 같은 입력 규칙으로 수정 · 로그아웃
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { useMe } from '@/components/RequireAuth';
import { Button, TopBar } from '@/components/ui';
import { api } from '@/lib/client';
import type { SelfProfile } from '@/lib/types';
import { ProfileForm, type ProfileValue } from './ProfileForm';

export function MeScreen() {
  const { me, refresh } = useMe();
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState<ProfileValue>({
    displayName: me.displayName,
    tags: me.tags,
    customTags: me.customTags,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api<{ me: SelfProfile }>('/api/me', { method: 'PATCH', body: value });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast('저장했어요');
    refresh();
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <>
      <TopBar title="마이페이지" />
      <form onSubmit={save} className="flex flex-1 flex-col">
        <div className="px-4 py-5">
          <ProfileForm value={value} onChange={setValue} />
        </div>
        <div className="sticky bottom-14 mt-auto space-y-2 border-t border-gray-100 bg-white px-4 py-3">
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
    </>
  );
}
