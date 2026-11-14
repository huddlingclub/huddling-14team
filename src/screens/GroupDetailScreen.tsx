'use client';
// PG-402 그룹 상세 — 해당 그룹 참여자. 사람을 누르면 타인 프로필
import { useParams } from 'next/navigation';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Content, Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { GroupSummary, PersonRow } from '@/lib/types';

function decode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function GroupDetailScreen() {
  const params = useParams<{ key: string }>();
  const key = decode(params.key);
  const { data, error, status, reload } = useApi<{ group: GroupSummary; members: PersonRow[] }>(
    `/api/groups/${encodeURIComponent(key)}`,
  );
  if (!data)
    return (
      <>
        <TopBar title="그룹" back />
        {status === 404 ? (
          <Content>
            <Section title="없는 그룹이에요">
              <Empty>이번 밋업의 그룹이 아니에요.</Empty>
            </Section>
          </Content>
        ) : error ? (
          <ErrorRetry message={error} onRetry={reload} />
        ) : (
          <Loading />
        )}
      </>
    );
  return (
    <>
      <TopBar title={`${data.group.categoryLabel} · ${data.group.label}`} back />
      <Content>
        <Section title={`참여자 ${data.group.count}`}>
          {data.members.length === 0 ? (
            <Empty>아직 이 그룹에 참여자가 없어요</Empty>
          ) : (
            <PersonList people={data.members} onChanged={() => reload()} />
          )}
        </Section>
      </Content>
    </>
  );
}
