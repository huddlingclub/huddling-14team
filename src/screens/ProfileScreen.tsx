'use client';
// PG-601 타인 프로필 — 홈 · 추천 · 그룹 · QR이 모두 도착하는 공통 화면. 하위 화면이라 하단 탭 대신 하단 CTA
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorRetry, Loading, ProfileNotFound } from '@/components/feedback/States';
import { RelationButton } from '@/components/people/RelationButton';
import { Avatar, Card, Chip, Content, Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { ProfileView, RelationView } from '@/lib/types';

function Body({ profile }: { profile: ProfileView }) {
  const [relation, setRelation] = useState<RelationView>(profile.relation);
  const matched = new Set(profile.overlap);
  return (
    <>
      <Content>
        <Card className="items-center text-center">
          <Avatar name={profile.displayName} seed={profile.id} size={96} />
          <div className="flex flex-col gap-[2px]">
            <p className="t-h2">{profile.displayName}</p>
            {profile.cohort && <p className="t-body text-[color:var(--color-text-secondary)]">{profile.cohort}</p>}
          </div>
        </Card>

        <Section title="나와 겹치는 태그">
          {profile.overlap.length === 0 ? (
            <p className="t-body text-[color:var(--color-text-secondary)]">
              겹치는 태그가 없어요. QR이나 요청으로 연결할 수 있어요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.overlap.map((t) => (
                <Chip key={t} tone="overlap">
                  {t}
                </Chip>
              ))}
            </div>
          )}
        </Section>

        <Section title="태그">
          <dl className="flex flex-col gap-3">
            {profile.tagGroups.map((g) => (
              <div key={g.category} className="flex items-start gap-3">
                <dt className="t-support w-16 shrink-0 pt-1 text-[color:var(--color-text-secondary)]">{g.categoryLabel}</dt>
                <dd className="flex flex-wrap gap-2">
                  {g.labels.map((l) => (
                    <Chip key={l} tone={matched.has(l) ? 'overlap' : 'default'}>
                      {l}
                    </Chip>
                  ))}
                </dd>
              </div>
            ))}
            {profile.customTags.length > 0 && (
              <div className="flex items-start gap-3">
                <dt className="t-support w-16 shrink-0 pt-1 text-[color:var(--color-text-secondary)]">기타</dt>
                <dd className="flex flex-wrap gap-2">
                  {profile.customTags.map((l) => (
                    <Chip key={l} tone={matched.has(l) ? 'overlap' : 'default'}>
                      {l}
                    </Chip>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Section>
      </Content>

      <div className="bottom-cta sticky bottom-0 mt-auto flex flex-col gap-2 bg-[var(--color-background-surface)] p-4 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[inset_0_1px_0_var(--color-border)]">
        <RelationButton block personId={profile.id} relation={relation} onChange={setRelation} />
        {relation !== 'friend' && (
          <p className="t-support text-center text-[color:var(--color-text-secondary)]">상대가 수락해야 친구가 돼요</p>
        )}
      </div>
    </>
  );
}

export function ProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, status, reload } = useApi<{ profile: ProfileView }>(`/api/profiles/${encodeURIComponent(id)}`);
  const isMe = data?.profile.isMe ?? false;

  // 자기 QR을 스캔하면 마이페이지로
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
