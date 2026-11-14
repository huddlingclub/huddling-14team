// 계정 · 세션 (교체 예정: 로그인/가입은 다른 작업으로 바뀔 수 있음 — getSession() 모양만 유지)
// 비밀번호는 scrypt 해시로만 저장하고, 평문은 저장·로그하지 않는다.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { read } from './store';

export const SESSION_COOKIE = 'hdl_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  return { salt, passwordHash };
}

export function verifyPassword(password: string, salt: string, passwordHash: string) {
  const a = scryptSync(password, salt, 64);
  const b = Buffer.from(passwordHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const newToken = () => randomBytes(32).toString('base64url');

/** 로그인한 참여자. 없거나 세션이 끊겼으면 null */
export async function getSession(): Promise<{ participantId: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return read((db) => {
    const s = db.sessions.find((x) => x.token === token);
    if (!s || !db.participants.some((p) => p.id === s.participantId)) return null;
    return { participantId: s.participantId };
  });
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
