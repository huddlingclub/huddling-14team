'use client';
// PG-301 친구추천 — 공통점 많은 순, 한 사람당 한 행. 없으면 그룹 리스트로 안내
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Card, Content, TopBar } from '@/components/ui';
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
        <Content>
          <div className="flex flex-col gap-[2px]">
            <h2 className="t-h3">나와 공통점이 있는 사람</h2>
            <p className="t-support text-[color:var(--color-text-secondary)]">요청을 보내고 수락되면 친구가 돼요.</p>
          </div>
          <Card>
            {data.items.length === 0 ? (
              <>
                <Empty>아직 나와 공통점이 있는 사람이 없어요.</Empty>
                <Link
                  href="/groups"
                  className="t-label-strong flex h-10 items-center justify-center rounded-[var(--radius-element)] bg-[var(--color-neutral)]"
                >
                  그룹 둘러보기
                </Link>
              </>
            ) : (
              <PersonList people={data.items} />
            )}
          </Card>
        </Content>
      )}
    </>
  );
}
