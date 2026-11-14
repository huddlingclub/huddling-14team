'use client';
// PG-201 홈 (07) — 내 프로필 → 받은 친구 요청 → 내 태그별 그룹(칩) → 내 친구
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Avatar, Card, Chip, Content, inlineButton, Section, TopBar } from '@/components/ui';
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
        <Content>
          <Card className="flex-row items-center gap-3">
            <Link href="/me" aria-label="마이페이지" className="shrink-0">
              <Avatar name={data.me.displayName} seed={data.me.id} photo={data.me.photo} size={48} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="t-label-strong truncate">{data.me.displayName}</p>
              <p className="t-support truncate text-[color:var(--color-text-secondary)]">
                {[...data.me.tags.map(tagLabel), ...data.me.customTags].join(' · ')}
              </p>
            </div>
            <Link href="/qr" className={`${inlineButton} w-20`}>
              내 QR
            </Link>
          </Card>

          {data.received.length > 0 && (
            <Section title="받은 친구 요청" trailing={`${data.received.length}명`}>
              <PersonList people={data.received} onChanged={refresh} />
            </Section>
          )}

          <Section title="내 태그별 그룹" trailing="태그를 누르면 참여자가 열려요">
            <ul className="flex flex-wrap gap-2">
              {data.groups.map((g) => (
                <li key={g.key} className="flex">
                  <Link
                    href={`/groups/${encodeURIComponent(g.key)}`}
                    aria-label={`${g.categoryLabel} ${g.label} 그룹 ${g.others + 1}명`}
                    className="inline-flex rounded-full"
                  >
                    <Chip tone="selected" count={g.others + 1}>
                      {g.label}
                    </Chip>
                  </Link>
                </li>
              ))}
            </ul>
            {data.groups.every((g) => g.others === 0) && (
              <Empty>아직 같은 그룹의 다른 참여자가 없어요. 사람들이 등록하면 여기에 모여요.</Empty>
            )}
          </Section>

          <Section title="내 친구" trailing={`${data.friends.length}명`}>
            {data.friends.length === 0 ? (
              <Card>
                <Empty>아직 친구가 없어요. 추천 탭에서 공통점 있는 사람에게 요청해 보세요.</Empty>
              </Card>
            ) : (
              <PersonList people={data.friends} />
            )}
          </Section>
        </Content>
      )}
    </>
  );
}
