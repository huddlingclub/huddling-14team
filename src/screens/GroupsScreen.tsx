'use client';
// PG-401 그룹 리스트 — 기수 · 직무 · 조 · 지역별 전체 그룹, 내가 안 속한 그룹도 열람
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import { CATEGORIES } from '@/lib/tags';
import type { GroupSummary } from '@/lib/types';

export function GroupsScreen() {
  const { data, error, reload } = useApi<{ groups: GroupSummary[] }>('/api/groups');
  return (
    <>
      <TopBar title="그룹" />
      {!data ? (
        error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading />
      ) : data.groups.length === 0 ? (
        <Section title="이번 밋업 그룹">
          <Empty>아직 등록한 참여자가 없어요</Empty>
        </Section>
      ) : (
        CATEGORIES.map((c) => {
          const list = data.groups.filter((g) => g.category === c.key);
          if (list.length === 0) return null;
          return (
            <Section key={c.key} title={c.label}>
              <ul className="flex flex-wrap gap-2">
                {list.map((g) => (
                  <li key={g.key}>
                    <Link
                      href={`/groups/${encodeURIComponent(g.key)}`}
                      aria-label={`${g.label} ${g.count}명${g.mine ? ' · 내 그룹' : ''}`}
                      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm ${
                        g.mine ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {g.label}
                      <span className={g.mine ? 'text-gray-300' : 'text-gray-500'}>{g.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          );
        })
      )}
    </>
  );
}
