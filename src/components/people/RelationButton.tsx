'use client';
// Friend Button — 관계 4상태(RelationView)와 1:1. 홈·추천·그룹·프로필 어디서든 같은 상태 = 같은 버튼
// none=친구 요청 · received=수락 (연보라) / sent=요청 보냄(누를 수 없음) / friend=친구(상태 표시)
import { Check, Clock, UserCheck, UserPlus, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { centerSnap, iconProps } from '@/components/ui';
import { api } from '@/lib/client';
import type { RelationView } from '@/lib/types';

const PRIMARY = 'bg-[var(--color-accent)] text-[color:var(--color-on-accent)]';
// 07 Friend Button: none · received = 연보라 / sent = neutral(보조 글자) / friend = 바탕 없음 + 초록

const VIEW: Record<RelationView, { label: string; Icon: LucideIcon; box: string }> = {
  none: { label: '친구 요청', Icon: UserPlus, box: PRIMARY },
  received: { label: '수락', Icon: Check, box: PRIMARY },
  sent: {
    label: '요청 보냄',
    Icon: Clock,
    box: 'bg-[var(--color-neutral)] text-[color:var(--color-text-secondary)]',
  },
  friend: { label: '친구', Icon: UserCheck, box: 'text-[color:var(--color-status-success)]' },
};

export function RelationButton({
  personId,
  personName,
  relation,
  onChange,
  block = false,
}: {
  personId: string;
  personName: string;
  relation: RelationView;
  onChange: (next: RelationView) => void;
  block?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const actionable = relation === 'none' || relation === 'received';
  const { label, Icon, box } = VIEW[relation];

  async function act() {
    if (!actionable || busy) return;
    setBusy(true);
    const r =
      relation === 'received'
        ? await api<{ relation: RelationView }>(`/api/relations/${personId}/accept`, { method: 'POST' })
        : await api<{ relation: RelationView }>('/api/relations', { method: 'POST', body: { toId: personId } });
    setBusy(false);
    if (!r.ok) {
      toast(r.error, 'error'); // 실패하면 상태를 바꾸지 않는다 (PRD §4)
      return;
    }
    const next = r.data.relation;
    toast(
      next === 'friend'
        ? `${personName} 님과 친구가 됐어요`
        : next === 'sent'
          ? `${personName} 님에게 친구 요청을 보냈어요`
          : `${personName} 님이 먼저 요청을 보냈어요. 수락해 주세요`,
    );
    onChange(next);
  }

  // Inline(32): 글자 칸을 고정해 16px 아이콘이 정수 px에 놓이게 한다.
  //   다섯 글자(친구 요청 · 요청 보냄) = 폭 100 · 글자 칸 52 / 두 글자(수락 · 친구) = 폭 72 · 글자 칸 24 → 양옆 13px
  // Block(40, 하단 CTA): 글자 칸 최소 53(07 지시) + 정수 가운데 맞춤
  const short = label.length <= 2;
  const cls = `inline-flex shrink-0 items-center justify-center gap-[6px] whitespace-nowrap rounded-[var(--radius-element)] ${
    block ? 't-label-strong h-10 w-full justify-start px-3' : `t-label h-8 ${short ? 'w-[72px]' : 'w-[100px]'}`
  } ${box}`;
  const inner = block ? (
    <span ref={centerSnap} className="flex items-center gap-[6px]">
      <Icon size={16} {...iconProps} className="shrink-0" />
      <span className={short ? '' : 'min-w-[53px]'}>{label}</span>
    </span>
  ) : (
    <>
      <Icon size={16} {...iconProps} />
      <span className={`text-center ${short ? 'w-6' : 'w-[52px]'}`}>{label}</span>
    </>
  );

  // 요청 보냄 · 친구는 버튼이 아니라 상태 표시
  if (!actionable) {
    return (
      <span data-relation={relation} className={cls}>
        {inner}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={act}
      disabled={busy}
      aria-busy={busy}
      aria-label={`${personName} 님에게 ${label}`}
      data-relation={relation}
      className={`${cls} ${busy ? 'opacity-70' : ''}`}
    >
      {inner}
    </button>
  );
}
