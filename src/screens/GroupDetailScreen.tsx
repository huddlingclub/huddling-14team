'use client';
// PG-402 그룹 상세 (07) — 그룹 이름 + 참여자 카드. 사람을 누르면 타인 프로필
import { useParams } from 'next/navigation';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Card, Content, Section, TopBar } from '@/components/ui';
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
            <Card>
              <p className="t-label-strong">없는 그룹이에요</p>
              <Empty>이번 밋업의 그룹이 아니거나 참여자가 모두 나갔어요.</Empty>
            </Card>
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
      <TopBar title={data.group.label} back />
      <Content>
        <Section
          title={`${data.group.categoryLabel} · ${data.group.label}`}
          trailing={data.group.mine ? `내 그룹 · ${data.group.count}명` : `${data.group.count}명`}
        >
          {data.members.length === 0 ? (
            <Card>
              <Empty>아직 이 그룹에 참여자가 없어요</Empty>
            </Card>
          ) : (
            <PersonList people={data.members} onChanged={() => reload()} />
          )}
        </Section>
        {!data.group.mine && (
          <p className="t-support text-[color:var(--color-text-secondary)]">
            내가 속하지 않은 그룹이에요. 공통 태그가 없어도 친구 요청을 보낼 수 있어요.
          </p>
        )}
      </Content>
    </>
  );
}
