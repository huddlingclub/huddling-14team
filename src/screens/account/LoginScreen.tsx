'use client';
// [교체 예정] PG-101 로그인 — 아이디 · 비밀번호
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, TopBar } from '@/components/ui';
import { api, safeNext } from '@/lib/client';

export function LoginScreen() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api('/api/auth/login', { method: 'POST', body: { loginId, password } });
    setBusy(false);
    if (r.ok) router.replace(next);
    else setError(r.error);
  }

  return (
    <>
      <TopBar title="로그인" />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4 py-6">
        <p className="text-xl font-bold">허들링 네트워킹</p>
        <label className="block">
          <span className="text-sm font-semibold">아이디</span>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            className="mt-1 h-12 w-full rounded-lg border border-gray-300 px-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 h-12 w-full rounded-lg border border-gray-300 px-3 text-base"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy || !loginId || !password}>
          {busy ? '로그인 중…' : '로그인'}
        </Button>
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="flex h-12 items-center justify-center rounded-lg border border-gray-300 text-base font-semibold"
        >
          처음이에요 · 가입하기
        </Link>
      </form>
    </>
  );
}
