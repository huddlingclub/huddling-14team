'use client';
// PG-301 친구추천 (07) — 사람마다 카드: 사람 행 + 겹치는 태그(민트 칩). 공통점 많은 순. 없으면 그룹 리스트로 안내
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonRowItem } from '@/components/people/PersonList';
import { Button, Card, Chip, Content, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { RecommendItem } from '@/lib/types';

export function RecommendScreen() {
  const { data, error, reload } = useApi<{ items: RecommendItem[] }>('/api/recommend');
  return (
    <>
      <TopBar title="추천" />
      {!data ? (
        error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading />
      ) : (
        <Content>
          <div className="flex flex-col gap-1">
            <h2 className="t-h2">나와 공통점이 있는 사람</h2>
            <p className="t-support text-[color:var(--color-text-secondary)]">겹치는 태그가 많은 순서로 보여줘요</p>
          </div>
          {data.items.length === 0 ? (
            <Card>
              <Empty>아직 나와 공통점이 있는 사람이 없어요. 다른 그룹도 둘러보세요.</Empty>
              <Link href="/groups" className="block">
                <Button type="button" variant="secondary" tabIndex={-1}>
                  그룹 둘러보기
                </Button>
              </Link>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.items.map((p) => (
                <li key={`${p.id}:${p.relation}`}>
                  <Card>
                    <PersonRowItem person={p} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="t-support text-[color:var(--color-text-secondary)]">겹치는 태그</span>
                      {p.overlap.map((t) => (
                        <Chip key={t} tone="matched">
                          {t}
                        </Chip>
                      ))}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Content>
      )}
    </>
  );
}
