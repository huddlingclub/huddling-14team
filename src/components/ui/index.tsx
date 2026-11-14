'use client';
// 공통 UI — Figma "07 디자인 · 전체 화면 (Dark · Purple)" 기준 (App Bar · Card · Section Header · Chip · Avatar · Button · Text Field · Menu Row).
// 색·모서리는 globals.css 토큰(var(--…))만 쓴다. 선·테두리·아이콘 획은 정수 px (UI_PIXEL).
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** 아이콘 획은 크기와 상관없이 2px로 고정 (소수 두께 방지) */
export const iconProps = { strokeWidth: 2, absoluteStrokeWidth: true, 'aria-hidden': true } as const;

/** 글자 폭으로 길이가 정해지는 칩·버튼의 폭을 정수 px로 올린다 — 한 줄에 이어 붙는 테두리가 소수 px에 걸리지 않게 (UI_PIXEL).
 *  글꼴이 다 받아진 뒤 한 번 더 잰다 */
export function snapWidth(el: HTMLElement | null) {
  if (!el) return;
  const apply = () => {
    el.style.width = '';
    const w = el.getBoundingClientRect().width;
    if (w > 0) el.style.width = `${Math.ceil(w - 0.01)}px`;
  };
  apply();
  if (typeof document !== 'undefined' && document.fonts) void document.fonts.ready.then(apply);
}

/** 가운데 정렬 대신 쓰는 정수 가운데 맞춤 — 폭을 정수로 올리고 왼쪽 여백을 정수로 내린다 (UI_PIXEL).
 *  부모가 가운데 정렬하지 않게(self-start · justify-start) 두고 ref로 붙인다. 부모 폭이 바뀌면 다시 잰다 */
export function centerSnap(el: HTMLElement | null) {
  if (!el) return;
  const parent = el.parentElement;
  if (!parent) return;
  const apply = () => {
    el.style.width = '';
    el.style.marginLeft = '';
    const cs = getComputedStyle(parent);
    const inner = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const w = Math.ceil(el.getBoundingClientRect().width - 0.01);
    if (w <= 0) return;
    el.style.width = `${w}px`;
    el.style.marginLeft = `${Math.max(0, Math.floor((inner - w) / 2))}px`;
  };
  apply();
  if (document.fonts) void document.fonts.ready.then(apply);
  const ro = new ResizeObserver(apply);
  ro.observe(parent);
  return () => ro.disconnect();
}

/** 로고 (HuddlingClub) — 원본 337×44 */
export function Logo({ height = 15 }: { height?: 12 | 15 }) {
  const width = height === 12 ? 92 : 115;
  // eslint-disable-next-line @next/next/no-img-element -- 작은 정적 로고
  return <img src="/auth/logo.png" alt="HuddlingClub" width={width} height={height} style={{ width, height }} />;
}

/** App Bar — 높이 52(+ 아래 1px 선은 레이아웃 밖). Root=제목만 · Sub=뒤로가기(32 · 아이콘 20) + 제목 */
export function TopBar({ title, back = false }: { title: string; back?: boolean | string }) {
  const router = useRouter();
  const goBack = () => {
    if (typeof back === 'string') return router.push(back);
    if (window.history.length > 1) router.back();
    else router.push('/home');
  };
  return (
    <header
      className={`sticky top-0 z-10 mb-px flex h-[52px] shrink-0 items-center gap-1 bg-[var(--color-background-surface)] shadow-[0_1px_0_var(--color-border)] ${back ? 'pl-2 pr-4' : 'px-4'}`}
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

/** 스크롤되는 콘텐츠 영역 — 바깥 여백 16 · 묶음 사이 24 */
export function Content({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-6 p-4 ${className}`}>{children}</div>;
}

/** Card — 반경 12 · 안쪽 16 · 안 간격 12 */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

/** Section Header — 왼쪽 제목(14 SemiBold) · 오른쪽 보조 정보(12). 아래 내용과 8 간격 */
export function Section({
  title,
  trailing,
  children,
}: {
  title: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <h2 className="t-label-strong">{title}</h2>
        {trailing !== undefined && <span className="t-support text-[color:var(--color-text-secondary)]">{trailing}</span>}
      </div>
      {children}
    </section>
  );
}

/** Chip — 알약형(높이 28). default=선택 전 · selected=내가 고른/내 태그(연보라) · matched=나와 겹치는 태그(민트). count=그룹 인원 */
export type ChipTone = 'default' | 'selected' | 'matched';
const chipTone: Record<ChipTone, string> = {
  default: 'border border-[color:var(--color-border-emphasized)] bg-[var(--color-background-surface)] text-[color:var(--color-text-primary)]',
  selected: 'bg-[var(--color-accent)] text-[color:var(--color-on-accent)]',
  matched: 'bg-[var(--color-highlight-muted)] text-[color:var(--color-on-highlight-muted)]',
};

export function Chip({
  children,
  tone = 'default',
  count,
  as = 'span',
  ...props
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  count?: number;
  as?: 'span' | 'button';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `t-label inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-3 ${chipTone[tone]}`;
  const inner = (
    <>
      {children}
      {count !== undefined && (
        <span className={`t-support ${tone === 'default' ? 'text-[color:var(--color-text-secondary)]' : ''}`}>{count}</span>
      )}
    </>
  );
  if (as === 'button') {
    return (
      <button ref={snapWidth} type="button" aria-pressed={tone === 'selected'} {...props} className={cls}>
        {inner}
      </button>
    );
  }
  return (
    <span ref={snapWidth} className={cls}>
      {inner}
    </span>
  );
}

/** Avatar — 사진이 있으면 원형으로, 없으면 허들링 마스코트(참여자 ID로 둘 중 하나 고정). 바탕 accent-muted */
export function Avatar({
  name,
  seed,
  photo,
  size = 40,
}: {
  name: string;
  seed?: string;
  photo?: string | null;
  size?: 28 | 32 | 40 | 48 | 96;
}) {
  let sum = 0;
  for (const ch of seed ?? name) sum += ch.codePointAt(0) ?? 0;
  const src = photo || (sum % 2 === 0 ? '/avatars/penguin-black.jpg' : '/avatars/penguin-gray.jpg');
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 작은 아바타라 최적화 대상이 아님
    <img
      src={src}
      alt={photo ? `${name} 프로필 사진` : ''}
      width={size}
      height={size}
      decoding="async"
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-[var(--color-accent-muted)] object-cover"
    />
  );
}

/** Button — Block 40(하단 CTA) · primary=연보라 · secondary=neutral */
export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const cls =
    variant === 'primary'
      ? 'bg-[var(--color-accent)] text-[color:var(--color-on-accent)]'
      : 'bg-[var(--color-neutral)] text-[color:var(--color-text-primary)]';
  return (
    <button
      {...props}
      className={`t-label-strong flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-element)] px-3 disabled:opacity-50 ${cls} ${className}`}
    />
  );
}

/** Inline 버튼(32) 모양 — 링크·버튼에 같이 쓴다 */
export const inlineButton =
  't-label inline-flex h-8 shrink-0 items-center justify-center gap-[6px] rounded-[var(--radius-element)] bg-[var(--color-neutral)] px-3 text-[color:var(--color-text-primary)]';

/** 하단 CTA 영역 — 화면 아래 고정, 안쪽 16 · 간격 8 */
export function BottomCta({ children }: { children: React.ReactNode }) {
  return (
    <div className="bottom-cta sticky bottom-0 mt-auto flex flex-col gap-2 bg-[var(--color-background-surface)] p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}

/** Menu Row — 아이콘 24 + 라벨 + 화살표(높이 48). danger=로그아웃처럼 되돌리기 어려운 동작 */
export function MenuRow({
  Icon,
  label,
  href,
  onClick,
  danger = false,
  disabled = false,
}: {
  Icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const cls = `flex h-12 w-full items-center gap-3 text-left ${danger ? 'text-[color:var(--color-status-error)]' : ''}`;
  const inner = (
    <>
      <Icon size={24} {...iconProps} className="shrink-0" />
      <span className="t-label min-w-0 flex-1">{label}</span>
      {!danger && <ChevronRight size={24} {...iconProps} className="shrink-0 text-[color:var(--color-text-secondary)]" />}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

/** 입력칸 라벨 줄 — 필수면 빨간 * */
export function FieldLabel({ children, required = false, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="t-label flex gap-1">
      {children}
      {required && (
        <span aria-hidden className="text-[color:var(--color-status-error)]">
          *
        </span>
      )}
    </label>
  );
}

/** Text Field — 라벨 + 입력칸(44) + 도움말. 입력 중 연보라 2px · 오류 빨강 · 바꿀 수 없는 값은 흐리게.
 *  글자는 16px(아이폰에서 누를 때 화면 확대 방지) */
export function TextField({
  id,
  label,
  required,
  hint,
  error,
  ...props
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string | null;
} & React.ComponentProps<'input'>) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
        className={`h-11 w-full rounded-[var(--radius-element)] border px-3 text-[16px] leading-5 text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-disabled)] focus:border-[color:var(--color-accent)] focus:shadow-[inset_0_0_0_1px_var(--color-accent)] disabled:border-[color:var(--color-border)] disabled:bg-[var(--color-neutral)] disabled:text-[color:var(--color-text-disabled)] ${
          error
            ? 'border-[color:var(--color-status-error)] bg-[var(--color-background-card)]'
            : 'border-[color:var(--color-border-emphasized)] bg-[var(--color-background-card)]'
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="t-support text-[color:var(--color-status-error)]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="t-support text-[color:var(--color-text-secondary)]">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
