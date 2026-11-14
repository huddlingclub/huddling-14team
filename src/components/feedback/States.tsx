// 로딩 · 빈 상태 · 불러오기 실패(PG-902) · 잘못된 QR(PG-903)
import { CircleAlert } from 'lucide-react';
import Link from 'next/link';
import { iconProps } from '@/components/ui';

export function Loading({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <p role="status" className="t-body px-4 py-12 text-center text-[color:var(--color-text-secondary)]">
      {label}
    </p>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="t-body text-[color:var(--color-text-secondary)]">{children}</p>;
}

/** PG-902 — 완료로 표시하지 않고 같은 자리에서 다시 시도 */
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="m-4 flex flex-col gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-surface)] p-4"
    >
      <p className="t-body flex items-center gap-2">
        <CircleAlert size={18} {...iconProps} className="shrink-0 text-[color:var(--color-status-error)]" />
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="t-label-strong h-11 w-full rounded-[var(--radius-element)] border border-[color:var(--color-border-emphasized)]"
      >
        다시 시도
      </button>
    </div>
  );
}

/** PG-903 — 이번 밋업 밖 링크 · 삭제된 프로필 */
export function ProfileNotFound() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <p className="t-h3">없는 프로필이에요</p>
      <p className="t-body text-[color:var(--color-text-secondary)]">이번 밋업의 QR이 아니거나 삭제된 프로필일 수 있어요.</p>
      <Link
        href="/home"
        className="t-label-strong mt-4 inline-flex h-11 items-center rounded-[var(--radius-element)] bg-[var(--color-accent)] px-5 text-[color:var(--color-on-accent)]"
      >
        홈으로
      </Link>
    </div>
  );
}
