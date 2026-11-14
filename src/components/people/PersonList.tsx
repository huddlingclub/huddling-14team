'use client';
// Person Row (07) — 아바타 40 · 이름(14 SemiBold) · 보조 줄 "기수 · 직무" + Friend Button Inline. 행을 누르면 타인 프로필(PG-601)
import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import type { PersonRow as Person, RelationView } from '@/lib/types';
import { RelationButton } from './RelationButton';

export function PersonRowItem({
  person,
  onChanged,
}: {
  person: Person;
  onChanged?: (id: string, next: RelationView) => void;
}) {
  const [relation, setRelation] = useState(person.relation);
  return (
    <div className="flex h-10 items-center gap-3">
      <Link href={person.isMe ? '/me' : `/p/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={person.displayName} seed={person.id} photo={person.photo} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="t-label-strong truncate">
            {person.displayName}
            {person.isMe && <span className="text-[color:var(--color-text-secondary)]"> (나)</span>}
          </span>
          {person.meta && <span className="t-support truncate text-[color:var(--color-text-secondary)]">{person.meta}</span>}
        </span>
      </Link>
      {!person.isMe && (
        <RelationButton
          personId={person.id}
          personName={person.displayName}
          relation={relation}
          onChange={(next) => {
            setRelation(next);
            onChanged?.(person.id, next);
          }}
        />
      )}
    </div>
  );
}

/** 카드 하나 안에 사람 행을 쌓는다 (받은 요청 · 그룹 참여자 · 내 친구) */
export function PersonList({
  people,
  onChanged,
}: {
  people: Person[];
  onChanged?: (id: string, next: RelationView) => void;
}) {
  return (
    <ul className="flex flex-col gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] p-4">
      {people.map((p) => (
        <li key={`${p.id}:${p.relation}`}>
          <PersonRowItem person={p} onChanged={onChanged} />
        </li>
      ))}
    </ul>
  );
}
