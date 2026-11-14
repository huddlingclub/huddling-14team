'use client';
// 개인 QR — 흰 바탕(224) 안에 남색 모듈(200). 어두운 화면에서도 스캔되도록 흰 바탕을 유지한다 (Figma 81:2501)
// 담는 값은 이번 밋업 프로필 주소(/p/<참여자 ID>)뿐이다
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { SITE_URL } from '@/lib/site';

export function QrCode({ id, name, size = 200 }: { id: string; name: string; size?: 200 | 224 }) {
  const [src, setSrc] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  useEffect(() => {
    // 계정마다 하나씩: 대표 주소(없으면 지금 접속한 주소) + /p/<계정 ID>
    const link = `${SITE_URL || window.location.origin}/p/${id}`;
    QRCode.toString(link, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#140f33', light: '#ffffff' } }).then((svg) => {
      setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
      setUrl(link);
    });
  }, [id]);
  const inner = size - 24;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[var(--radius-element)] bg-white"
      style={{ width: size, height: size }}
      data-qr-url={url}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL이라 next/image 최적화 대상이 아님
        <img src={src} alt={`${name} 프로필로 연결되는 QR 코드`} width={inner} height={inner} />
      ) : (
        <span className="t-support text-[#5b5680]">QR 만드는 중…</span>
      )}
    </div>
  );
}
