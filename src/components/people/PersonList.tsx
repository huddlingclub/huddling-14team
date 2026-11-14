'use client';
// 사람 행 — 아바타 40 · 이름 · 겹치는 태그(없으면 기수) + 친구 버튼. 행을 누르면 타인 프로필(PG-601)
import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import type { PersonRow as Person, RelationView } from '@/lib/types';
import { RelationButton } from './RelationButton';

function Row({ person, onChanged }: { person: Person; onChanged?: (id: string, next: RelationView) => void }) {
  const [relation, setRelation] = useState(person.relation);
  const sub = person.overlap.length > 0 ? `겹치는 태그 · ${person.overlap.join(', ')}` : (person.cohort ?? '');
  return (
    <li className="flex items-center gap-3">
      <Link href={`/p/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={person.displayName} seed={person.id} />
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="t-label-strong truncate">
            {person.displayName}
            {person.isMe && ' (나)'}
          </span>
          {sub && <span className="t-support truncate text-[color:var(--color-text-secondary)]">{sub}</span>}
        </span>
      </Link>
      {!person.isMe && (
        <RelationButton
          personId={person.id}
          relation={relation}
          onChange={(next) => {
            setRelation(next);
            onChanged?.(person.id, next);
          }}
        />
      )}
    </li>
  );
}

export function PersonList({
  people,
  onChanged,
}: {
  people: Person[];
  onChanged?: (id: string, next: RelationView) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {people.map((p) => (
        <Row key={`${p.id}:${p.relation}`} person={p} onChanged={onChanged} />
      ))}
    </ul>
  );
}
