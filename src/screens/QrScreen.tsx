'use client';
// PG-602 내 QR — 이번 밋업 프로필 링크(/p/<참여자 ID>)만 담는다. 휴대폰 기본 카메라로 읽힘
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
  const [qr, setQr] = useState<{ src: string; url: string } | null>(null);
  // 데모 모드에는 서버가 없어서, 상대 기기가 내 프로필을 볼 수 있게 링크에 이름·태그를 함께 담는다
  const shared =
    DEMO && me.tags ? `?d=${encodeURIComponent(JSON.stringify({ n: me.displayName, t: me.tags, c: me.customTags ?? [] }))}` : '';

  useEffect(() => {
    const url = `${window.location.origin}/p/${me.id}${shared}`;
    QRCode.toDataURL(url, { width: 480, margin: 1 }).then((src) => setQr({ src, url }));
  }, [me.id, shared]);

  return (
    <>
      <TopBar title="내 QR" back />
      <div className="flex flex-1 flex-col items-center px-4 py-8 text-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL이라 next/image 최적화 대상이 아님
          <img src={qr.src} alt={`${me.displayName} 프로필 QR 코드`} width={240} height={240} className="rounded-lg border border-gray-200" />
        ) : (
          <Loading label="QR 만드는 중…" />
        )}
        <p className="mt-4 text-xl font-bold">{me.displayName}</p>
        <p className="mt-2 text-sm text-gray-500">
          상대가 휴대폰 기본 카메라로 스캔하면
          <br />내 프로필이 열려요
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
