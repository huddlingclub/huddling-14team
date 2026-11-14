'use client';
// PG-101 로그인 — Figma "Design/로그인"(81:2910). 이번 결정으로 이메일 대신 아이디·비밀번호로 로그인한다
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { KeyVisual } from '@/components/auth/KeyVisual';
import { Button, iconProps, TextField } from '@/components/ui';
import { api } from '@/lib/client';

export function LoginScreen({ next }: { next: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const fromQr = next.startsWith('/p/');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!username.trim()) {
      setError('아이디를 입력해 주세요.');
      return idRef.current?.focus();
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      return pwRef.current?.focus();
    }
    setBusy(true);
    setError(null);
    const r = await api('/api/auth/login', { method: 'POST', body: { username: username.trim().toLowerCase(), password } });
    if (r.ok) {
      window.location.assign(next); // 세션 쿠키를 새로 읽도록 전체 이동
      return;
    }
    setBusy(false);
    setError(r.error);
    pwRef.current?.select();
  }

  return (
    <>
      <KeyVisual />
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-6">
        <div className="flex flex-col gap-[6px]">
          <h1 className="t-h2">아이디로 로그인</h1>
          <p className="t-support text-[color:var(--color-text-secondary)]">
            {fromQr ? '로그인하면 QR로 연 프로필로 바로 이어져요' : '밋업 등록 때 만든 아이디로 들어와 주세요'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <TextField
            ref={idRef}
            id="login-username"
            label="아이디"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="영문·숫자 아이디"
          />
          <div className="relative">
            <TextField
              ref={pwRef}
              id="login-password"
              label="비밀번호"
              required
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              enterKeyHint="go"
              error={error}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={show}
              className="absolute right-0 top-7 flex size-11 items-center justify-center text-[color:var(--color-text-secondary)]"
            >
              {show ? <EyeOff size={20} {...iconProps} /> : <Eye size={20} {...iconProps} />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </Button>

        <p className="t-support flex items-center justify-center gap-[6px] text-[color:var(--color-text-secondary)]">
          처음이신가요?
          <Link
            href={next === '/home' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
            className="t-support-strong inline-flex min-h-11 items-center text-[color:var(--color-text-primary)] underline [text-underline-position:from-font]"
          >
            등록하기
          </Link>
        </p>
      </form>
    </>
  );
}
