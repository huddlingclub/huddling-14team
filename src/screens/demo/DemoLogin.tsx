'use client';
// [데모 전용] PG-101 로그인 — 실제 서비스에서는 src/app/(auth)/login (계정 담당 구현)을 쓴다
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, TopBar } from '@/components/ui';
import { api, safeNext } from '@/lib/client';

export function DemoLogin() {
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

  const input = 'mt-1 h-12 w-full rounded-lg border border-gray-300 px-3 text-base';
  return (
    <>
      <TopBar title="로그인" />
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4 py-6">
        <div>
          <p className="text-sm font-semibold text-gray-500">허들링클럽 2회차 오프라인 밋업</p>
          <p className="mt-1 text-2xl font-bold">허들링 네트워킹</p>
          <p className="mt-2 text-sm text-gray-500">공통점으로 말을 걸고, QR로 바로 연결해요.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold">아이디</span>
          <input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" autoCapitalize="none" className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">비밀번호</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={input} />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </Button>
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="flex h-12 items-center justify-center rounded-lg border border-gray-300 text-base font-semibold"
        >
          처음이에요 · 가입하기
        </Link>
        <p className="mt-auto text-center text-xs text-gray-400">데모 화면이에요. 아무 아이디·비밀번호나 넣으면 샘플 데이터로 들어가요.</p>
      </form>
    </>
  );
}
