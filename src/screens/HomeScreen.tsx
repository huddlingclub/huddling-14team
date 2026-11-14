'use client';
// PG-201 홈 — 내 프로필 → 받은 친구 요청 → 내 태그별 그룹 → 내 친구 (화면정의서 02)
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Chip, Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import { tagLabel } from '@/lib/tags';
import type { HomeData } from '@/lib/types';

export function HomeScreen() {
  const { data, error, reload } = useApi<HomeData>('/api/home');
  const refresh = () => reload();
  return (
    <>
      <TopBar title="홈" />
      {!data ? (
        error ? <ErrorRetry message={error} onRetry={refresh} /> : <Loading />
      ) : (
        <>
          <Section
            title="내 프로필"
            action={
              <Link href="/qr" className="inline-flex h-9 items-center rounded-lg bg-gray-900 px-3 text-sm font-semibold text-white">
                내 QR
              </Link>
            }
          >
            <p className="text-lg font-bold">
              {data.me.displayName}
              {data.me.cohort && <span className="ml-2 text-sm font-normal text-gray-500">{data.me.cohort}</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {data.me.tags
                .filter((t) => !t.startsWith('cohort:'))
                .map((t) => (
                  <Chip key={t}>{tagLabel(t)}</Chip>
                ))}
              {data.me.customTags.map((t) => (
                <Chip key={`c:${t}`}>{t}</Chip>
              ))}
            </div>
          </Section>

          {data.received.length > 0 && (
            <Section title={`받은 친구 요청 ${data.received.length}`}>
              <PersonList people={data.received} onChanged={refresh} />
            </Section>
          )}

          <Section title="내 태그별 그룹">
            <div className="space-y-3">
              {data.groups.map((g) => (
                <div key={g.key} className="rounded-lg border border-gray-200 px-3 pt-3">
                  <Link href={`/groups/${encodeURIComponent(g.key)}`} className="flex h-9 items-center justify-between">
                    <span className="text-sm font-bold">
                      {g.categoryLabel} · {g.label}
                    </span>
                    <span className="text-sm text-gray-500">{g.others}명 ›</span>
                  </Link>
                  {g.members.length === 0 ? (
                    <div className="pb-3">
                      <Empty>아직 같은 그룹의 다른 참여자가 없어요</Empty>
                    </div>
                  ) : (
                    <PersonList people={g.members} onChanged={refresh} />
                  )}
                  {g.others > g.members.length && (
                    <Link
                      href={`/groups/${encodeURIComponent(g.key)}`}
                      className="flex h-11 items-center justify-center border-t border-gray-100 text-sm text-gray-600"
                    >
                      {g.others}명 모두 보기
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title={`내 친구 ${data.friends.length}`}>
            {data.friends.length === 0 ? <Empty>아직 친구가 없어요</Empty> : <PersonList people={data.friends} />}
          </Section>
        </>
      )}
    </>
  );
}
