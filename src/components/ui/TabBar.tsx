'use client';
// Tab Bar (07) — 1depth 하단 4탭(홈 · 추천 · 그룹 · 마이). 하위 화면(그룹 상세 · 타인 프로필 · 내 QR · 프로필 수정 · QR 스캔)에는 없다.
// 좌 8 · 우 7 여백 → 375에서 탭 4칸 × 90. 다른 폭에서도 칸 폭을 정수로 내려 아이콘이 0.5px에 걸리지 않게 한다
import { CircleUser, House, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { iconProps } from '@/components/ui';
import { api } from '@/lib/client';

const TABS = [
  { href: '/home', label: '홈', Icon: House },
  { href: '/recommend', label: '추천', Icon: Sparkles },
  { href: '/groups', label: '그룹', Icon: Users },
  { href: '/me', label: '마이', Icon: CircleUser },
];

export function TabBar() {
  const pathname = usePathname();
  const onTab = TABS.some((t) => t.href === pathname);
  // 받은 친구 요청 수 — 탭을 옮길 때마다 다시 센다 (실시간 아님, PRD "다음 조회 시")
  const [badge, setBadge] = useState(0);
  useEffect(() => {
    if (!onTab) return;
    let alive = true;
    api<{ received: number }>('/api/relations/count').then((r) => alive && r.ok && setBadge(r.data.received));
    return () => {
      alive = false;
    };
  }, [pathname, onTab]);
  if (!onTab) return null;
  return (
    <nav
      aria-label="하단 탭"
      className="tab-bar sticky bottom-0 z-10 mt-px shrink-0 bg-[var(--color-background-surface)] pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--color-border)]"
    >
      <ul className="flex py-1 pl-2 pr-[7px]">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="w-[round(down,calc((100vw-15px)/4),1px)] max-w-[90px]">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-[52px] flex-col items-center justify-center gap-1 ${
                  active ? 'text-[color:var(--color-text-primary)]' : 'text-[color:var(--color-text-secondary)]'
                }`}
              >
                <Icon size={22} {...iconProps} />
                <span className="t-support-strong">{label}</span>
                {href === '/home' && badge > 0 && (
                  <span className="absolute left-[calc(50%+6px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-status-error)] px-1 text-[10px] font-semibold leading-none text-[color:var(--color-on-accent)]">
                    <span className="sr-only">받은 친구 요청 </span>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
