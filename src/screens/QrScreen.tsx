'use client';
// PG-602 내 QR — 이번 밋업 프로필 링크(/p/[id])만 담는다. 휴대폰 기본 카메라로 읽힘
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Loading } from '@/components/feedback/States';
import { useMe } from '@/components/RequireAuth';
import { TopBar } from '@/components/ui';

export function QrScreen() {
  const { me } = useMe();
  const [qr, setQr] = useState<{ src: string; url: string } | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/p/${me.id}`;
    QRCode.toDataURL(url, { width: 480, margin: 1 }).then((src) => setQr({ src, url }));
  }, [me.id]);

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
        {qr && <p className="mt-4 break-all text-xs text-gray-400">{qr.url}</p>}
      </div>
    </>
  );
}
