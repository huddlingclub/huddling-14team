'use client';
// PG-603 QR 스캔 (Figma 00 전체 흐름 D · 06 "QR 스캔 · 카메라") — 앱 안에서 상대 QR을 읽어 바로 프로필로 간다.
// 휴대폰 기본 카메라는 다른 브라우저로 열려 로그인이 풀릴 수 있어서, 같은 화면 안에서 읽는 길을 함께 둔다.
import jsQR from 'jsqr';
import { CameraOff, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { iconProps, TopBar } from '@/components/ui';
import { KNOWN_HOSTS } from '@/lib/site';

const PROFILE = /^\/p\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/?$/i;

type Status = 'starting' | 'scanning' | 'denied' | 'unsupported' | 'wrong';

export function ScanScreen() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>('starting');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let done = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    function handle(text: string) {
      try {
        const url = new URL(text, window.location.origin);
        const m = PROFILE.exec(url.pathname);
        if (m && (url.origin === window.location.origin || KNOWN_HOSTS.includes(url.hostname))) {
          done = true;
          navigator.vibrate?.(30);
          router.replace(`/p/${m[1].toLowerCase()}`);
          return;
        }
      } catch {
        // 주소가 아닌 QR
      }
      setStatus('wrong');
    }

    function tick() {
      const video = videoRef.current;
      if (done || !video || !ctx) return;
      if (video.readyState >= 2 && video.videoWidth) {
        // 가운데 정사각 영역만 줄여서 읽는다 (빠르고, 화면의 안내 사각형과 맞는다)
        const side = Math.min(video.videoWidth, video.videoHeight);
        const size = Math.min(640, side);
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, size, size);
        const img = ctx.getImageData(0, 0, size, size);
        const code = jsQR(img.data, size, size, { inversionAttempts: 'dontInvert' });
        if (code?.data) handle(code.data);
      }
      if (!done) timer = setTimeout(tick, 180);
    }

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch {
        return setStatus('denied');
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      setStatus('scanning');
      tick();
    })();

    return () => {
      done = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  const blocked = status === 'denied' || status === 'unsupported';
  return (
    <>
      <TopBar title="QR 스캔" back />
      <div className="flex flex-1 flex-col items-center gap-5 px-4 py-6 text-center">
        <div className="relative ml-[round(down,calc((100%-280px)/2),1px)] size-[280px] shrink-0 self-start overflow-hidden rounded-[var(--radius-container)] bg-black">
          <video ref={videoRef} muted playsInline className="size-full object-cover" aria-label="카메라 화면" />
          {/* 인식 안내 사각형 */}
          <div aria-hidden className="pointer-events-none absolute inset-6 rounded-[var(--radius-element)] border-2 border-[color:var(--color-accent)]" />
          {blocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-background-surface)] px-6">
              <CameraOff size={28} {...iconProps} />
              <p className="t-label">{status === 'denied' ? '카메라를 쓸 수 없어요' : '이 브라우저는 카메라를 지원하지 않아요'}</p>
            </div>
          )}
        </div>
        <p role="status" className="t-h3 flex items-center gap-2">
          {status === 'scanning' && <ScanLine size={20} {...iconProps} className="animate-pulse text-[color:var(--color-accent)]" />}
          {status === 'starting' && '카메라를 켜는 중…'}
          {status === 'scanning' && '상대의 QR을 사각형 안에 맞춰 주세요'}
          {status === 'wrong' && '이번 밋업 프로필 QR이 아니에요'}
          {status === 'denied' && '카메라 권한을 허용해 주세요'}
          {status === 'unsupported' && '휴대폰 기본 카메라로 찍어 주세요'}
        </p>
        <p className="t-body text-[color:var(--color-text-secondary)]">
          {blocked
            ? '브라우저 주소창의 설정에서 카메라를 허용하거나, 휴대폰 기본 카메라로 상대 QR을 찍어도 돼요.'
            : '읽히면 상대 프로필이 바로 열려요. 거기서 친구 요청이나 수락을 눌러 주세요.'}
        </p>
      </div>
    </>
  );
}
