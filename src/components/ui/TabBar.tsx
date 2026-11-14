'use client';
// Tab Bar — 1depth 하단 4탭(홈 · 추천 · 그룹 · 마이). 하위 화면(그룹 상세 · 타인 프로필 · 내 QR)에는 없다
import { CircleUser, House, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { iconProps } from '@/components/ui';

const TABS = [
  { href: '/home', label: '홈', Icon: House },
  { href: '/recommend', label: '추천', Icon: Sparkles },
  { href: '/groups', label: '그룹', Icon: Users },
  { href: '/me', label: '마이', Icon: CircleUser },
];

export function TabBar() {
  const pathname = usePathname();
  if (!TABS.some((t) => t.href === pathname)) return null;
  return (
    <nav
      aria-label="하단 탭"
      className="sticky bottom-0 z-10 shrink-0 bg-[var(--color-background-surface)] pb-[env(safe-area-inset-bottom)] shadow-[inset_0_1px_0_var(--color-border)]"
    >
      {/* 탭 폭을 80으로 고정하고 사이를 띄워, 22px 아이콘이 정수 px 위치에 놓이게 한다 */}
      <ul className="flex justify-between px-2 py-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-[52px] w-20 flex-col items-center justify-center gap-1 ${
                  active ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-secondary)]'
                }`}
              >
                <Icon size={22} {...iconProps} className={active ? '' : 'text-[color:var(--color-icon-secondary)]'} />
                <span className="t-support-strong">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
