'use client';
// PG-201 홈 — 내 프로필 → 받은 친구 요청 → 내 태그별 그룹 → 내 친구 (화면정의서 02)
import { ChevronRight, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Avatar, Card, Chip, Content, iconProps, Section, TopBar } from '@/components/ui';
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
          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={data.me.displayName} seed={data.me.id} size={48} />
              <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                <p className="t-h3 truncate">{data.me.displayName}</p>
                {data.me.cohort && <p className="t-support text-[color:var(--color-text-secondary)]">{data.me.cohort}</p>}
              </div>
              <Link
                href="/qr"
                className="t-label inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--radius-element)] bg-[var(--color-neutral)] px-3"
              >
                <QrCode size={16} {...iconProps} />내 QR
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.me.tags
                .filter((t) => !t.startsWith('cohort:'))
                .map((t) => (
                  <Chip key={t}>{tagLabel(t)}</Chip>
                ))}
              {data.me.customTags.map((t) => (
                <Chip key={`c:${t}`}>{t}</Chip>
              ))}
            </div>
          </Card>

          {data.received.length > 0 && (
            <Section title={`받은 친구 요청 ${data.received.length}`}>
              <PersonList people={data.received} onChanged={refresh} />
            </Section>
          )}

          <h2 className="t-label-strong mt-1 text-[color:var(--color-text-secondary)]">내 태그별 그룹</h2>
          {data.groups.map((g) => (
            <Card key={g.key}>
              <Link href={`/groups/${encodeURIComponent(g.key)}`} className="flex h-5 items-center justify-between gap-2">
                <span className="t-label-strong">
                  {g.categoryLabel} · {g.label}
                </span>
                <span className="t-support flex items-center gap-1 text-[color:var(--color-text-secondary)]">
                  {g.others}명
                  <ChevronRight size={16} {...iconProps} className="text-[color:var(--color-icon-secondary)]" />
                </span>
              </Link>
              {g.members.length === 0 ? (
                <Empty>아직 같은 그룹의 다른 참여자가 없어요</Empty>
              ) : (
                <PersonList people={g.members} onChanged={refresh} />
              )}
              {g.others > g.members.length && (
                <Link
                  href={`/groups/${encodeURIComponent(g.key)}`}
                  className="t-label flex h-8 items-center justify-center rounded-[var(--radius-element)] bg-[var(--color-neutral)]"
                >
                  {g.others}명 모두 보기
                </Link>
              )}
            </Card>
          ))}

          <Section title={`내 친구 ${data.friends.length}`}>
            {data.friends.length === 0 ? <Empty>아직 친구가 없어요</Empty> : <PersonList people={data.friends} />}
          </Section>
        </Content>
      )}
    </>
  );
}
