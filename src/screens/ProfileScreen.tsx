'use client';
// PG-601 타인 프로필 — 홈 · 추천 · 그룹 · QR이 모두 도착하는 공통 화면
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ErrorRetry, Loading, ProfileNotFound } from '@/components/feedback/States';
import { RelationButton } from '@/components/people/RelationButton';
import { Avatar, Chip, Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { ProfileView, RelationView } from '@/lib/types';

function Body({ profile }: { profile: ProfileView }) {
  const [relation, setRelation] = useState<RelationView>(profile.relation);
  return (
    <>
      <div className="flex flex-col items-center px-4 pb-2 pt-6">
        <Avatar name={profile.displayName} size={72} />
        <p className="mt-3 text-xl font-bold">{profile.displayName}</p>
        {profile.cohort && <p className="text-sm text-gray-500">{profile.cohort}</p>}
      </div>

      <Section title="나와 겹치는 태그">
        {profile.overlap.length === 0 ? (
          <p className="text-sm text-gray-500">겹치는 태그가 없어요. QR이나 요청으로 연결할 수 있어요.</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {profile.overlap.map((t) => (
              <Chip key={t} tone="overlap">
                {t}
              </Chip>
            ))}
          </div>
        )}
      </Section>

      <Section title="태그">
        <dl className="space-y-2">
          {profile.tagGroups.map((g) => (
            <div key={g.category} className="flex gap-3">
              <dt className="w-24 shrink-0 text-sm text-gray-500">{g.categoryLabel}</dt>
              <dd className="flex flex-wrap gap-1">
                {g.labels.map((l) => (
                  <Chip key={l}>{l}</Chip>
                ))}
              </dd>
            </div>
          ))}
          {profile.customTags.length > 0 && (
            <div className="flex gap-3">
              <dt className="w-24 shrink-0 text-sm text-gray-500">기타</dt>
              <dd className="flex flex-wrap gap-1">
                {profile.customTags.map((l) => (
                  <Chip key={l}>{l}</Chip>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      <div className="sticky bottom-14 mt-auto border-t border-gray-100 bg-white px-4 py-3">
        <RelationButton block personId={profile.id} relation={relation} onChange={setRelation} />
        {relation !== 'friend' && <p className="mt-2 text-center text-xs text-gray-500">상대가 수락해야 친구가 돼요</p>}
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
