'use client';
// 로그인 확인 — 세션이 없으면 /login?next=현재경로 (QR로 들어온 사람도 가입 후 돌아오게)
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { ErrorRetry, Loading } from '@/components/feedback/States';
import { api } from '@/lib/client';
import type { SelfProfile } from '@/lib/types';

const MeContext = createContext<{ me: SelfProfile; refresh: () => void } | null>(null);

export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error('useMe는 RequireAuth 안에서만 쓸 수 있어요');
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<SelfProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    api<{ me: SelfProfile }>('/api/me').then((r) => {
      if (!alive) return;
      if (r.ok) setMe(r.data.me);
      else if (r.status === 401) {
        const here = window.location.pathname + window.location.search;
        router.replace(`/login?next=${encodeURIComponent(here)}`);
      } else setError(r.error);
    });
    return () => {
      alive = false;
    };
  }, [nonce, router]);

  if (error)
    return (
      <ErrorRetry
        message={error}
        onRetry={() => {
          setError(null);
          setNonce((n) => n + 1);
        }}
      />
    );
  if (!me) return <Loading />;
  return <MeContext.Provider value={{ me, refresh: () => setNonce((n) => n + 1) }}>{children}</MeContext.Provider>;
}
