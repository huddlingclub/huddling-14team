'use client';
// MD-901 알림(토스트) — 요청 보냄 · 수락 · 저장 결과. 하단 탭(또는 하단 버튼) 위에 뜬다 (위치는 globals.css .toast-region)
// 같은 문구가 겹쳐 쌓이지 않게 하고, 오류는 조금 더 오래(4초) 보여 준다. 화면낭독기는 aria-live로 읽는다
import { Check, CircleAlert } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';
import { iconProps } from '@/components/ui';

type Kind = 'ok' | 'error';
type Show = (message: string, kind?: Kind) => void;

const ToastContext = createContext<Show>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string; kind: Kind }[]>([]);
  const show = useCallback<Show>((message, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.filter((i) => i.message !== message), { id, message, kind }].slice(-3));
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'error' ? 4000 : 2400);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* 화면 틀 안에서 아래쪽에 붙는 높이 0 영역 — 알림은 그 위로 쌓인다 */}
      <div aria-live="polite" className="toast-region pointer-events-none sticky z-50 h-0">
        <div className="absolute inset-x-4 bottom-0 flex flex-col gap-2">
          {items.map((i) => (
            <div
              key={i.id}
              role={i.kind === 'error' ? 'alert' : 'status'}
              className="t-label flex items-center gap-2 rounded-[var(--radius-element)] border border-[color:var(--color-border-emphasized)] bg-[var(--color-background-popover)] px-4 py-3 text-[color:var(--color-text-primary)] shadow-[0_8px_16px_var(--color-shadow)]"
            >
              {i.kind === 'error' ? (
                <CircleAlert size={18} {...iconProps} className="shrink-0 text-[color:var(--color-status-error)]" />
              ) : (
                <Check size={18} {...iconProps} className="shrink-0 text-[color:var(--color-status-success)]" />
              )}
              <span className="min-w-0 flex-1">{i.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
