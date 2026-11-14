'use client';
// PG-401 그룹 리스트 — 기수 · 직무 · 조 · 지역별 전체 그룹, 내가 안 속한 그룹도 열람
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { Chip, Content, Section, TopBar } from '@/components/ui';
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
      ) : (
        <Content>
          {data.groups.length === 0 && (
            <Section title="이번 밋업 그룹">
              <Empty>아직 등록한 참여자가 없어요</Empty>
            </Section>
          )}
          {CATEGORIES.map((c) => {
            const list = data.groups.filter((g) => g.category === c.key);
            if (list.length === 0) return null;
            return (
              <Section key={c.key} title={c.label}>
                <ul className="flex flex-wrap gap-2">
                  {list.map((g) => (
                    <li key={g.key} className="flex">
                      <Link
                        href={`/groups/${encodeURIComponent(g.key)}`}
                        aria-label={`${g.label} ${g.count}명${g.mine ? ' · 내 그룹' : ''}`}
                        className="inline-flex"
                      >
                        <Chip tone={g.mine ? 'selected' : 'default'} count={g.count}>
                          {g.label}
                        </Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })}
        </Content>
      )}
    </>
  );
}
