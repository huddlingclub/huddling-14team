'use client';
// PG-601 타인 프로필 (07) — 상단 카드(아바타 96 · 이름 · 기수·직무·조) → 태그(겹치면 민트) → 하단 CTA(친구 버튼 + 안내)
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorRetry, Loading, ProfileNotFound } from '@/components/feedback/States';
import { RelationButton } from '@/components/people/RelationButton';
import { Avatar, BottomCta, Card, centerSnap, Chip, Content, Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { ProfileView, RelationView } from '@/lib/types';

const NOTE: Record<RelationView, string> = {
  none: '상대가 수락해야 친구가 돼요',
  sent: '상대가 수락하면 친구가 돼요',
  received: '상대가 먼저 친구 요청을 보냈어요',
  friend: '서로 친구예요. 홈의 내 친구에서 다시 볼 수 있어요',
};

function Body({ profile }: { profile: ProfileView }) {
  const [relation, setRelation] = useState<RelationView>(profile.relation);
  const matched = new Set(profile.overlap);
  const labels = [...profile.tagGroups.flatMap((g) => g.labels), ...profile.customTags];
  return (
    <>
      <Content>
        <Card className="items-center gap-2 p-6 text-center">
          <div ref={centerSnap} className="self-start">
            <Avatar name={profile.displayName} seed={profile.id} photo={profile.photo} size={96} />
          </div>
          <p className="t-h2">{profile.displayName}</p>
          {profile.meta && <p className="t-support text-[color:var(--color-text-secondary)]">{profile.meta}</p>}
        </Card>

        <Section title="태그" trailing={profile.overlap.length ? '초록 = 나와 겹치는 태그' : '나와 겹치는 태그는 없어요'}>
          <div className="flex flex-wrap gap-2">
            {labels.map((l) => (
              <Chip key={l} tone={matched.has(l) ? 'matched' : 'default'}>
                {l}
              </Chip>
            ))}
          </div>
        </Section>
      </Content>

      <BottomCta>
        <RelationButton block personId={profile.id} personName={profile.displayName} relation={relation} onChange={setRelation} />
        <p className="t-support text-center text-[color:var(--color-text-secondary)]">{NOTE[relation]}</p>
      </BottomCta>
    </>
  );
}

export function ProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, status, reload } = useApi<{ profile: ProfileView }>(`/api/profiles/${encodeURIComponent(id)}`);
  const isMe = data?.profile.isMe ?? false;

  // 자기 QR을 스캔하면 마이로
  useEffect(() => {
    if (isMe) router.replace('/me');
  }, [isMe, router]);

  return (
    <>
      <TopBar title="프로필" back />
      {status === 404 ? (
        <ProfileNotFound />
      ) : !data || isMe ? (
        error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading />
      ) : (
        <Body key={`${data.profile.id}:${data.profile.relation}`} profile={data.profile} />
      )}
    </>
  );
}
