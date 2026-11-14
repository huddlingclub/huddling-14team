'use client';
// PG-602 내 QR — 브랜드 QR 카드. QR에는 이번 밋업 프로필 링크(/p/<참여자 ID>)만 담는다
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { ErrorRetry, Loading } from '@/components/feedback/States';
import { TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import { DEMO } from '@/lib/demo';
import type { SelfProfile, TagId } from '@/lib/types';

interface QrOwner {
  id: string;
  displayName: string;
  tags?: TagId[];
  customTags?: string[];
}

export function QrScreen({ me }: { me: QrOwner }) {
  const [qr, setQr] = useState<string | null>(null);
  // 데모 모드에는 서버가 없어서, 상대 기기가 내 프로필을 볼 수 있게 링크에 이름·태그를 함께 담는다
  const shared =
    DEMO && me.tags ? `?d=${encodeURIComponent(JSON.stringify({ n: me.displayName, t: me.tags, c: me.customTags ?? [] }))}` : '';

  useEffect(() => {
    const url = `${window.location.origin}/p/${me.id}${shared}`;
    // 어떤 크기에서도 또렷하도록 벡터(SVG)로 만든다. 색은 브랜드 남색
    QRCode.toString(url, { type: 'svg', margin: 0, color: { dark: '#1b2b4a', light: '#ffffff' } }).then((svg) =>
      setQr(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`),
    );
  }, [me.id, shared]);

  return (
    <>
      <TopBar title="내 QR" back />
      <div className="flex flex-col items-center gap-6 px-4 py-6 text-center">
        {/* Brand QR Card — 블루 → 남색 → 민트. QR 영역은 스캔 인식을 위해 항상 흰 배경 */}
        <div
          className="flex h-[420px] w-[300px] max-w-full flex-col items-center justify-center gap-4 rounded-[var(--radius-container)] p-4"
          style={{
            backgroundImage:
              'linear-gradient(133.6deg, var(--brand-blue) 14.286%, var(--brand-navy) 53.571%, var(--brand-mint) 85.714%)',
          }}
        >
          <div className="flex size-[200px] items-center justify-center overflow-hidden rounded-[var(--radius-element)] bg-white">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL이라 next/image 최적화 대상이 아님
              <img src={qr} alt={`${me.displayName} 프로필 QR 코드`} width={176} height={176} />
            ) : (
              <span className="t-support text-[color:var(--color-text-secondary)]">QR 만드는 중…</span>
            )}
          </div>
          <p className="t-h2 text-white">{me.displayName}</p>
          <p className="t-support text-white opacity-80">Experience. Share. Grow.</p>
        </div>
        <p className="t-body text-[color:var(--color-text-secondary)]">
          상대가 휴대폰 기본 카메라로 스캔하면
          <br />내 프로필이 열려요.
        </p>
      </div>
    </>
  );
}

/** 데모 모드: 브라우저에 저장된 내 프로필로 QR을 만든다 */
export function DemoQr() {
  const { data, error, reload } = useApi<{ me: SelfProfile }>('/api/me');
  if (data) return <QrScreen me={data.me} />;
  return (
    <>
      <TopBar title="내 QR" back />
      {error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading />}
    </>
  );
}
