'use client';
// PG-301 친구추천 — 공통점 많은 순, 한 사람당 한 행. 없으면 그룹 리스트로 안내
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { RecommendItem } from '@/lib/types';

export function RecommendScreen() {
  const { data, error, reload } = useApi<{ items: RecommendItem[] }>('/api/recommend');
  return (
    <>
      <TopBar title="친구추천" />
      {!data ? (
        error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading />
      ) : (
        <Section title="나와 공통점이 있는 사람">
          {data.items.length === 0 ? (
            <div className="space-y-3">
              <Empty>아직 나와 공통점이 있는 사람이 없어요.</Empty>
              <Link href="/groups" className="flex h-11 items-center justify-center rounded-lg border border-gray-300 text-sm font-semibold">
                그룹 둘러보기
              </Link>
            </div>
          ) : (
            <PersonList people={data.items} />
          )}
        </Section>
      )}
    </>
  );
}
