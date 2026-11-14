'use client';
// PG-401 그룹 — 내 친구를 태그별로 모아 보는 화면. 태그 칩(1기 · 디자이너 · 14조 · 강남 …)이 곧 분류다.
// 친구가 아닌 참여자는 여기 나오지 않는다(새 사람은 추천 · QR로 만난다). 칩을 누르면 그 태그를 가진 친구만 남는다.
// 레퍼런스(UI bowl): 칩 필터(전체 + 항목별 개수) 바로 아래 목록. 고른 칩은 주소(?tag=)에 남겨 프로필에서 돌아와도 그대로다
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Empty, ErrorRetry, Loading } from '@/components/feedback/States';
import { PersonList } from '@/components/people/PersonList';
import { Card, Chip, inlineButton, Section, TopBar } from '@/components/ui';
import { useApi } from '@/lib/client';
import type { FriendGroups } from '@/lib/types';

export function GroupsScreen() {
  const { data, error, reload } = useApi<FriendGroups>('/api/friends');
  return (
    <>
      <TopBar title="그룹" />
      {!data ? error ? <ErrorRetry message={error} onRetry={reload} /> : <Loading /> : <Browser data={data} />}
    </>
  );
}

function Browser({ data }: { data: FriendGroups }) {
  const params = useSearchParams();
  // null = 전체
  const [tag, setTag] = useState<string | null>(() => {
    const fromUrl = params.get('tag');
    return data.tags.some((t) => t.key === fromUrl) ? fromUrl : null;
  });
  const chipsRef = useRef<HTMLUListElement>(null);
  const current = data.tags.find((t) => t.key === tag) ?? null;
  const people = current ? data.friends.filter((f) => f.tags.includes(current.key)) : data.friends;

  function pick(next: string | null) {
    setTag(next);
    window.history.replaceState(null, '', next ? `/groups?tag=${encodeURIComponent(next)}` : '/groups');
  }

  // 고른 칩이 가려져 있으면 보이게 옮긴다
  useEffect(() => {
    chipsRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [tag]);

  if (data.friends.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <p className="t-label-strong">아직 친구가 없어요</p>
          <Empty>친구가 생기면 1기 · 디자이너 · 14조처럼 태그별로 모아 볼 수 있어요.</Empty>
          <div className="flex gap-2">
            {/* 왼쪽 폭을 정수 px로 내려 두 버튼 경계가 0.5px에 걸리지 않게 한다 */}
            <Link href="/recommend" className={`${inlineButton} w-[round(down,calc((100%-8px)/2),1px)]`}>
              추천 보기
            </Link>
            <Link href="/scan" className={`${inlineButton} flex-1`}>
              QR 스캔
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul ref={chipsRef} aria-label="태그로 친구 모아 보기" className="flex w-max gap-2">
          <li className="flex">
            <Chip as="button" tone={tag === null ? 'selected' : 'default'} count={data.friends.length} onClick={() => pick(null)}>
              전체
            </Chip>
          </li>
          {data.tags.map((t) => (
            <li key={t.key} className="flex">
              <Chip
                as="button"
                tone={t.key === tag ? 'selected' : t.mine ? 'matched' : 'default'}
                count={t.count}
                onClick={() => pick(t.key)}
                aria-label={`${t.label} 친구 ${t.count}명${t.mine ? ' · 내 태그' : ''}`}
              >
                {t.label}
              </Chip>
            </li>
          ))}
        </ul>
      </div>
      <p className="t-support text-[color:var(--color-text-secondary)]">초록은 나와 같은 태그, 숫자는 그 태그의 내 친구 수예요</p>

      <Section title={current ? `${current.label} 친구` : '내 친구'} trailing={`${people.length}명`}>
        <PersonList key={tag ?? 'all'} people={people} />
      </Section>
    </div>
  );
}
