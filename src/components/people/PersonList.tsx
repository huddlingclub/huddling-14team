'use client';
// 사람 행 — 이름 · 기수 · 나와 겹치는 태그 + 관계 버튼. 행을 누르면 타인 프로필(PG-601)
import Link from 'next/link';
import { useState } from 'react';
import { Avatar, Chip } from '@/components/ui';
import type { PersonRow as Person, RelationView } from '@/lib/types';
import { RelationButton } from './RelationButton';

function Row({ person, onChanged }: { person: Person; onChanged?: (id: string, next: RelationView) => void }) {
  const [relation, setRelation] = useState(person.relation);
  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={`/p/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={person.displayName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {person.displayName}
            {person.cohort && <span className="ml-1 font-normal text-gray-500">{person.cohort}</span>}
            {person.isMe && <span className="ml-1 font-normal text-gray-500">(나)</span>}
          </p>
          {person.overlap.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {person.overlap.map((t) => (
                <Chip key={t} tone="overlap">
                  {t}
                </Chip>
              ))}
            </div>
          )}
        </div>
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
    <ul className="divide-y divide-gray-100">
      {people.map((p) => (
        <Row key={`${p.id}:${p.relation}`} person={p} onChanged={onChanged} />
      ))}
    </ul>
  );
}
