'use client';
// 하단 탭 4개 — 홈 · 추천 · 그룹 · 마이
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home', label: '홈' },
  { href: '/recommend', label: '추천' },
  { href: '/groups', label: '그룹' },
  { href: '/me', label: '마이' },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="하단 탭" className="sticky bottom-0 z-10 grid grid-cols-4 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={`flex h-14 items-center justify-center text-sm ${active ? 'font-bold text-gray-900' : 'text-gray-500'}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
