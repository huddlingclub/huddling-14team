// 로딩 · 빈 상태 · 저장 실패(PG-902) · 잘못된 QR(PG-903)
import Link from 'next/link';

export function Loading({ label = '불러오는 중…' }: { label?: string }) {
  return <p className="px-4 py-12 text-center text-sm text-gray-500">{label}</p>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-500">{children}</p>;
}

/** PG-902 — 완료로 표시하지 않고 같은 자리에서 다시 시도 */
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 h-11 w-full rounded-lg border border-red-300 bg-white text-sm font-semibold text-red-700"
      >
        다시 시도
      </button>
    </div>
  );
}

/** PG-903 — 이번 밋업 밖 링크 · 삭제된 프로필 */
export function ProfileNotFound() {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-base font-semibold">없는 프로필이에요</p>
      <p className="mt-2 text-sm text-gray-500">이번 밋업의 QR이 아니거나 삭제된 프로필일 수 있어요.</p>
      <Link href="/home" className="mt-6 inline-flex h-11 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white">
        홈으로
      </Link>
    </div>
  );
}
