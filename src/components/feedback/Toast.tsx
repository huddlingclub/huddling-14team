'use client';
// MD-901 토스트 — 요청 보냄 · 수락 · 저장 결과
import { createContext, useCallback, useContext, useState } from 'react';

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
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-44 z-50 mx-auto flex max-w-[480px] flex-col items-center gap-2 px-4"
      >
        {items.map((i) => (
          <div
            key={i.id}
            role="status"
            className={`rounded-lg px-4 py-3 text-sm text-white shadow ${i.kind === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}
          >
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
