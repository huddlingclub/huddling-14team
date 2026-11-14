'use client';
// 관계 버튼 4상태 — 친구 요청 · 요청 보냄 · 수락 · 친구 (홈·추천·그룹·프로필 공통)
import { useState } from 'react';
import { useToast } from '@/components/feedback/Toast';
import { api } from '@/lib/client';
import type { RelationView } from '@/lib/types';

const LABEL: Record<RelationView, string> = {
  none: '친구 요청',
  sent: '요청 보냄',
  received: '수락',
  friend: '친구',
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

  const tone = actionable ? 'bg-gray-900 text-white' : 'border border-gray-300 bg-white text-gray-500';
  return (
    <button
      type="button"
      onClick={act}
      disabled={!actionable || busy}
      aria-busy={busy}
      data-relation={relation}
      className={`shrink-0 rounded-lg text-sm font-semibold ${block ? 'h-12 w-full text-base' : 'h-9 px-3'} ${tone}`}
    >
      {busy ? '처리 중…' : LABEL[relation]}
    </button>
  );
}
