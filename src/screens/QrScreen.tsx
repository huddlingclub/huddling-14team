'use client';
// PG-602 내 QR (07) — 브랜드 QR 카드(블루 → 남색 → 민트, 300×420). QR 영역은 스캔이 잘 되게 항상 흰 바탕.
// QR은 계정마다 자동으로 만들어진다: 이번 밋업 프로필 주소(/p/<계정 ID>)만 담는다
import { ScanLine } from 'lucide-react';
import Link from 'next/link';
import { QrCode } from '@/components/qr/QrCode';
import { BottomCta, centerSnap, iconProps, TopBar } from '@/components/ui';

export function QrScreen({ me }: { me: { id: string; displayName: string; photo: string | null } }) {
  return (
    <>
      <TopBar title="내 QR" back />
      <div className="flex flex-1 flex-col justify-center gap-4 p-4">
        <div
          ref={centerSnap}
          className="flex h-[420px] w-[300px] max-w-full flex-col items-center justify-center gap-4 self-start rounded-[var(--radius-container)] p-4"
          style={{
            backgroundImage:
              'linear-gradient(133.6deg, var(--brand-blue) 14.286%, var(--brand-navy) 53.571%, var(--brand-mint) 85.714%)',
          }}
        >
          <QrCode id={me.id} name={me.displayName} size={200} />
          <p className="t-h2 text-white">{me.displayName}</p>
          <p className="t-support text-white opacity-80">Experience. Share. Grow.</p>
        </div>
        <p className="t-support text-center text-[color:var(--color-text-secondary)]">
          상대가 휴대폰 기본 카메라로 스캔하면
          <br />내 프로필이 열려요. 잘 안 읽히면 화면 밝기를 올려 주세요
        </p>
      </div>
      <BottomCta>
        <Link
          href="/scan"
          className="t-label-strong flex h-10 w-full items-center rounded-[var(--radius-element)] bg-[var(--color-neutral)] px-3"
        >
          <span ref={centerSnap} className="flex items-center gap-2">
            <ScanLine size={16} {...iconProps} className="shrink-0" />
            상대 QR 스캔하기
          </span>
        </Link>
      </BottomCta>
    </>
  );
}
