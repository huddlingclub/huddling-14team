'use client';
// 공통 UI — 디자인을 합칠 때 이 폴더만 교체한다 (WORK_SPLIT.md DEV-00)
import { useRouter } from 'next/navigation';

export function TopBar({ title, back = false }: { title: string; back?: boolean }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-4">
      {back && (
        <button type="button" onClick={() => router.back()} aria-label="뒤로" className="-ml-2 h-11 w-11 text-xl">
          ‹
        </button>
      )}
      <h1 className="truncate text-lg font-bold">{title}</h1>
    </header>
  );
}

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
    <section className="px-4 py-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Chip({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'overlap' }) {
  const cls =
    tone === 'overlap' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700';
  return <span className={`inline-flex h-7 items-center rounded-full border px-3 text-xs ${cls}`}>{children}</span>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600"
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const cls =
    variant === 'primary'
      ? 'bg-gray-900 text-white disabled:bg-gray-300'
      : 'border border-gray-300 bg-white text-gray-900 disabled:text-gray-400';
  return <button {...props} className={`h-12 w-full rounded-lg text-base font-semibold ${cls} ${className}`} />;
}
