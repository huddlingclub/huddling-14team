// 로딩 · 빈 상태 · 저장 실패(PG-902) · 잘못된 QR(PG-903)
import Link from 'next/link';

export function Loading({ label = '불러오는 중…' }: { label?: string }) {
  return <p className="t-body px-4 py-12 text-center text-[color:var(--color-text-secondary)]">{label}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="t-body text-[color:var(--color-text-secondary)]">{children}</p>;
}

/** PG-902 — 완료로 표시하지 않고 같은 자리에서 다시 시도 */
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="m-4 flex flex-col gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] p-4"
    >
      <p className="t-body flex items-center gap-2">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--color-status-error)]" />
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="t-label-strong h-10 w-full rounded-[var(--radius-element)] bg-[var(--color-neutral)]"
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
        className="t-label-strong mt-4 inline-flex h-10 items-center rounded-[var(--radius-element)] bg-[var(--color-accent)] px-5 text-[color:var(--color-on-primary)]"
      >
        홈으로
      </Link>
    </div>
  );
}
