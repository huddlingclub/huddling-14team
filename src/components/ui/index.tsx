'use client';
// 공통 UI — Figma "04 공통 UI" 기준. 색·모서리 값은 globals.css의 토큰(var(--…))을 쓴다.
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

/** 아이콘 획은 크기와 상관없이 2px로 고정한다 (시안 기준 · 소수 두께 방지) */
export const iconProps = { strokeWidth: 2, absoluteStrokeWidth: true, 'aria-hidden': true } as const;

/** App Bar — Root(제목만) · Sub(뒤로가기 + 제목). 구분선은 안쪽 그림자로 그려 높이 52를 유지한다 */
export function TopBar({ title, back = false }: { title: string; back?: boolean }) {
  const router = useRouter();
  const goBack = () => (window.history.length > 1 ? router.back() : router.push('/home'));
  return (
    <header
      className={`sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-1 bg-[var(--color-background-surface)] shadow-[inset_0_-1px_0_var(--color-border)] ${back ? 'pl-2 pr-4' : 'px-4'}`}
    >
      {back && (
        <button
          type="button"
          onClick={goBack}
          aria-label="뒤로"
          className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-element)]"
        >
          <ChevronLeft size={20} {...iconProps} />
        </button>
      )}
      <h1 className="t-h3 min-w-0 flex-1 truncate">{title}</h1>
    </header>
  );
}

/** 스크롤되는 콘텐츠 영역 — 바깥 여백 16 · 카드 사이 12 */
export function Content({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-3 p-4 ${className}`}>{children}</div>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

/** 제목이 있는 카드 */
export function Section({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] p-4">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <h2 className="t-label-strong text-[color:var(--color-text-secondary)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Chip — default=선택 전 · selected=내가 고른 태그 · overlap=나와 겹치는 태그 · count=그룹 인원 */
export function Chip({
  children,
  tone = 'default',
  count,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'selected' | 'overlap';
  count?: number;
}) {
  const cls =
    tone === 'overlap'
      ? 'bg-[var(--color-highlight-muted)] text-[color:var(--color-on-highlight-muted)]'
      : tone === 'selected'
        ? 'bg-[var(--color-primary-start)] text-[color:var(--color-on-primary)]'
        : 'border border-[color:var(--color-border-emphasized)] bg-[var(--color-background-surface)] text-[color:var(--color-text-primary)]';
  return (
    <span className={`t-label inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 ${cls}`}>
      {children}
      {count !== undefined && (
        <span className={`t-support ${tone === 'default' ? 'text-[color:var(--color-text-secondary)]' : ''}`}>{count}</span>
      )}
    </span>
  );
}

/** Avatar — 사진이 없으면 허들링 마스코트. seed(참여자 ID)로 둘 중 하나를 고정 배정한다 */
export function Avatar({ name, seed, size = 40 }: { name: string; seed?: string; size?: 32 | 40 | 48 | 96 }) {
  let sum = 0;
  for (const ch of seed ?? name) sum += ch.codePointAt(0) ?? 0;
  const src = sum % 2 === 0 ? '/avatars/penguin-black.jpg' : '/avatars/penguin-gray.jpg';
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 96px 정적 이미지라 최적화 대상이 아님
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-[var(--color-accent-muted)] object-cover"
    />
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const cls =
    variant === 'primary'
      ? 'bg-[var(--color-accent)] text-[color:var(--color-on-primary)]'
      : 'bg-[var(--color-neutral)] text-[color:var(--color-text-primary)]';
  return (
    <button
      {...props}
      className={`t-label-strong h-10 w-full rounded-[var(--radius-element)] disabled:opacity-50 ${cls} ${className}`}
    />
  );
}
