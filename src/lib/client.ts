'use client';
// 화면 → API 호출. 실패해도 예외 대신 { ok: false }로 돌려 화면이 상태를 유지하게 한다 (PG-902)
import { useCallback, useEffect, useState } from 'react';
import { DEMO, demoApi } from './demo';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<ApiResult<T>> {
  if (DEMO) {
    // 데모 모드: 서버 대신 브라우저 안의 샘플 데이터로 응답한다
    const r = await demoApi(path, init);
    if (r.status < 400) return { ok: true, data: r.data as T };
    return { ok: false, status: r.status, error: (r.data as { message: string }).message };
  }
  try {
    const res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (res.ok) return { ok: true, data: json as T };
    return { ok: false, status: res.status, error: json?.message ?? '요청을 처리하지 못했어요. 다시 시도해 주세요.' };
  } catch {
    return { ok: false, status: 0, error: '연결을 확인한 뒤 다시 시도해 주세요.' };
  }
}

/** 로그인이 끊겼으면 로그인 화면으로. QR로 연 프로필(/p/…)은 로그인 뒤 돌아온다 */
export function goLogin() {
  const here = window.location.pathname + (DEMO ? window.location.search : '');
  window.location.assign(here.startsWith('/p/') ? `/login?next=${encodeURIComponent(here)}` : '/login');
}

/** 로그인 뒤 돌아갈 경로. 외부 주소로 튀지 않게 내부 경로만 허용 */
export function safeNext(next: string | null | undefined, fallback = '/home') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}

interface LoadState<T> {
  data: T | null;
  error: string | null;
  status: number;
  loading: boolean;
}

/** 화면 진입 시점에 조회 (실시간 갱신 아님 — 화면정의서 02 "갱신 시점") */
export function useApi<T>(path: string) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: null, status: 0, loading: true });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    api<T>(path).then((r) => {
      if (!alive) return;
      if (!r.ok && r.status === 401) return goLogin();
      setState(
        r.ok
          ? { data: r.data, error: null, status: 200, loading: false }
          : { data: null, error: r.error, status: r.status, loading: false },
      );
    });
    return () => {
      alive = false;
    };
  }, [path, nonce]);
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setNonce((n) => n + 1);
  }, []);
  return { ...state, reload };
}
