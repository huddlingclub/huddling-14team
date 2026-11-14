'use client';
// MD-901 토스트 — 요청 보냄 · 수락 · 저장 결과. 하단 탭 위 16px에 뜬다 (위치는 globals.css .toast-region)
import { Check } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';
import { iconProps } from '@/components/ui';

type Kind = 'ok' | 'error';
type Show = (message: string, kind?: Kind) => void;

const ToastContext = createContext<Show>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string; kind: Kind }[]>([]);
  const show = useCallback<Show>((message, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, message, kind }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2400);
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
              role="status"
              className="t-label flex items-center gap-2 rounded-[var(--radius-element)] border border-[color:var(--color-border-emphasized)] bg-[var(--color-background-popover)] px-4 py-3 text-[color:var(--color-text-primary)] shadow-[0_8px_12px_var(--color-shadow)]"
            >
              {i.kind === 'error' ? (
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--color-status-error)]" />
              ) : (
                <Check size={18} {...iconProps} className="shrink-0 text-[color:var(--color-text-success)]" />
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
