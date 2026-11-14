'use client';
// [데모 전용] PG-102 온보딩(가입) — 계정 만들기 + 내 프로필. QR로 들어왔으면 저장 후 스캔한 상대 프로필로 돌아간다
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, TopBar } from '@/components/ui';
import { api, safeNext } from '@/lib/client';
import { DemoProfileForm, emptyProfile, type ProfileValue } from './DemoProfileForm';

export function DemoSignup() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const fromQr = next.startsWith('/p/');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [profile, setProfile] = useState<ProfileValue>(emptyProfile);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api('/api/auth/signup', { method: 'POST', body: { loginId, password, passwordConfirm, ...profile } });
    setBusy(false);
    if (r.ok) router.replace(next);
    else setError(r.error); // 실패하면 입력을 그대로 두고 다시 시도
  }

  const input = 'mt-1 h-12 w-full rounded-lg border border-gray-300 px-3 text-base';
  return (
    <>
      <TopBar title="가입하기" />
      <form onSubmit={submit} className="flex flex-1 flex-col">
        <section className="space-y-4 px-4 py-5">
          <h2 className="text-base font-bold">계정 만들기</h2>
          <label className="block">
            <span className="text-sm font-semibold">아이디 *</span>
            <input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" autoCapitalize="none" className={input} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">비밀번호 *</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={input} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">비밀번호 확인 *</span>
            <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} autoComplete="new-password" className={input} />
          </label>
        </section>

        <section className="space-y-4 border-t border-gray-100 px-4 py-5">
          <h2 className="text-base font-bold">내 프로필</h2>
          <DemoProfileForm value={profile} onChange={setProfile} />
        </section>

        <div className="sticky bottom-0 mt-auto space-y-2 border-t border-gray-100 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">이번 밋업 등록 참여자에게 이름과 태그가 보여요</p>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? '저장 중…' : fromQr ? '저장하고 상대 프로필 보기' : '저장하고 시작하기'}
          </Button>
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="flex h-11 items-center justify-center text-sm text-gray-600">
            이미 계정이 있어요 · 로그인
          </Link>
        </div>
      </form>
    </>
  );
}
