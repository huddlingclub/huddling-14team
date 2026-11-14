// 로그인 상단 키 비주얼 (07 PG-101, 높이 320)
import { Logo } from '@/components/ui';

export function KeyVisual({ size = 'large' }: { size?: 'large' | 'compact' }) {
  const large = size === 'large';
  return (
    <div className={`relative flex shrink-0 flex-col items-start justify-between overflow-hidden ${large ? 'h-[320px] px-4 py-5' : 'h-[196px] p-5'}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- 시안과 같은 크기·위치로 잘라 보여주는 배경 사진 */}
        <img
          src="/auth/key-visual.png"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
          className={`absolute max-w-none ${large ? 'right-[-11px] top-[-100px] h-[447px] w-[750px]' : 'left-[-295px] top-[-148px] h-[377px] w-[670px]'}`}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: large
              ? 'linear-gradient(to bottom, rgba(15,11,41,0.1), rgba(15,11,41,0.25) 55%, #0f0b29)'
              : 'linear-gradient(180deg, rgba(15,11,41,0) 60%, #0f0b29 100%), linear-gradient(90deg, rgba(15,11,41,0.95) 0%, rgba(15,11,41,0.35) 55%, rgba(15,11,41,0) 100%)',
          }}
        />
      </div>
      <div className="relative">
        <Logo />
      </div>
      <div className="relative flex flex-col whitespace-nowrap text-white">
        <p className="t-h2">HuddlingClub</p>
        <p className="t-h2">2nd Meetup</p>
        <p className="t-support opacity-80">2026. 11. 14. Sat 09:00~18:00</p>
      </div>
    </div>
  );
}
