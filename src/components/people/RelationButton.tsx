'use client';
// Friend Button — 관계 4상태(RelationView)와 1:1. 홈·추천·그룹·프로필 어디서든 같은 상태 = 같은 버튼
// none=친구 요청 · received=수락 (primary 그라데이션) / sent=요청 보냄(누를 수 없음) / friend=친구(상태 표시)
import { Check, Clock, UserCheck, UserPlus, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { iconProps } from '@/components/ui';
import { api } from '@/lib/client';
import type { RelationView } from '@/lib/types';

const PRIMARY =
  'bg-[linear-gradient(90deg,var(--color-primary-start),var(--color-primary-end))] text-[color:var(--color-on-primary)]';

const VIEW: Record<RelationView, { label: string; Icon: LucideIcon; box: string; icon: string }> = {
  none: { label: '친구 요청', Icon: UserPlus, box: PRIMARY, icon: '' },
  received: { label: '수락', Icon: Check, box: PRIMARY, icon: '' },
  sent: {
    label: '요청 보냄',
    Icon: Clock,
    box: 'bg-[var(--color-neutral)] text-[color:var(--color-text-secondary)]',
    icon: 'text-[color:var(--color-icon-secondary)]',
  },
  friend: {
    label: '친구',
    Icon: UserCheck,
    box: 'text-[color:var(--color-text-success)]',
    icon: 'text-[color:var(--color-icon-success)]',
  },
};

const DONE: Record<RelationView, string> = {
  none: '',
  sent: '친구 요청을 보냈어요',
  received: '상대가 먼저 요청을 보냈어요. 수락해 주세요',
  friend: '친구가 됐어요',
};

export function RelationButton({
  personId,
  relation,
  onChange,
  block = false,
}: {
  personId: string;
  relation: RelationView;
  onChange: (next: RelationView) => void;
  block?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const actionable = relation === 'none' || relation === 'received';
  const { label, Icon, box, icon } = VIEW[relation];

  async function act() {
    if (!actionable || busy) return;
    setBusy(true);
    const r =
      relation === 'received'
        ? await api<{ relation: RelationView }>(`/api/relations/${personId}/accept`, { method: 'POST' })
        : await api<{ relation: RelationView }>('/api/relations', { method: 'POST', body: { toId: personId } });
    setBusy(false);
    if (!r.ok) {
      toast(r.error, 'error'); // 실패하면 상태를 바꾸지 않는다
      return;
    }
    toast(DONE[r.data.relation]);
    onChange(r.data.relation);
  }

  const cls = `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-element)] px-3 ${
    block ? 't-label-strong h-10 w-full' : 't-label h-8'
  } ${box}`;
  const inner = (
    <>
      <Icon size={16} {...iconProps} className={icon} />
      {label}
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
      data-relation={relation}
      className={`${cls} ${busy ? 'opacity-70' : ''}`}
    >
      {inner}
    </button>
  );
}
