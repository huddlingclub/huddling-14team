'use client';
// PG-501 마이 (07) — 내 프로필 카드(태그 칩) + 메뉴: 내 QR 보기 · 상대 QR 스캔하기 · 프로필 수정 · 로그아웃
import { CircleUser, LogOut, QrCode, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { Avatar, Card, Chip, Content, MenuRow, TopBar } from '@/components/ui';
import { api } from '@/lib/client';
import { tagLabel } from '@/lib/tags';
import type { TagId } from '@/lib/types';

export function MyScreen({
  me,
}: {
  me: { id: string; displayName: string; username: string; photo: string | null; tags: TagId[]; customTags: string[] };
}) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    const r = await api('/api/auth/logout', { method: 'POST', body: {} });
    if (r.ok) {
      router.replace('/login');
      router.refresh();
    } else {
      setBusy(false);
      toast(r.error, 'error');
    }
  }

  return (
    <>
      <TopBar title="마이" />
      <Content>
        <Card className="gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={me.displayName} seed={me.id} photo={me.photo} size={48} />
            <div className="flex min-w-0 flex-col">
              <p className="t-label-strong truncate">{me.displayName}</p>
              <p className="t-support truncate text-[color:var(--color-text-secondary)]">@{me.username}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-support text-[color:var(--color-text-secondary)]">내 태그</p>
            <div className="flex flex-wrap gap-2">
              {me.tags.map((t) => (
                <Chip key={t} tone="selected">
                  {tagLabel(t)}
                </Chip>
              ))}
              {me.customTags.map((t) => (
                <Chip key={`c:${t}`}>{t}</Chip>
              ))}
            </div>
          </div>
        </Card>

        <nav
          aria-label="마이 메뉴"
          className="flex flex-col rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] px-4 py-1"
        >
          <MenuRow Icon={QrCode} label="내 QR 보기" href="/qr" />
          <MenuRow Icon={ScanLine} label="상대 QR 스캔하기" href="/scan" />
          <MenuRow Icon={CircleUser} label="프로필 수정" href="/me/edit" />
          <MenuRow Icon={LogOut} label={busy ? '로그아웃 중…' : '로그아웃'} onClick={logout} disabled={busy} danger />
        </nav>
      </Content>
    </>
  );
}
