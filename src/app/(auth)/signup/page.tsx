import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { destination, type Tag } from '@/lib/profile-input';
import { getTagOptions } from '@/lib/profiles';
import { getSession } from '@/lib/session';
import { SignupScreen } from '@/screens/auth/SignupScreen';

export const metadata: Metadata = { title: '등록하기' };

// PG-102 등록 (아이디·비밀번호 + 프로필)
export default async function Signup({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = destination((await searchParams).next);
  if (await getSession()) redirect(next);
  let options: Tag[] = [];
  try {
    options = await getTagOptions();
  } catch {
    // 선택지를 못 불러오면 아래 안내로
  }
  if (!options.some((t) => t.category === 'cohort')) {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="t-h3">등록 화면을 불러오지 못했어요</p>
        <p className="t-body text-[color:var(--color-text-secondary)]">잠시 뒤 다시 시도해 주세요.</p>
        <Link
          href={next === '/home' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
          prefetch={false}
          className="t-label-strong inline-flex h-11 items-center rounded-[var(--radius-element)] bg-[var(--color-accent)] px-5 text-[color:var(--color-on-accent)]"
        >
          다시 시도
        </Link>
      </div>
    );
  }
  // 명함 읽기는 Vercel AI Gateway를 쓴다. 결제 수단 등록 뒤 OCR_ENABLED=1로 켠다 (README)
  return <SignupScreen next={next} options={options} ocr={process.env.OCR_ENABLED === '1'} />;
}
