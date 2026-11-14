BEGIN;

-- ERD.md FRIEND_RELATION — 두 사람 사이 관계는 한 건만 둔다.
-- 참여자 ID를 정렬해 (a, b)로 저장하고, 요청자는 둘 중 한 명이어야 한다.
CREATE TABLE friend_relation (
  participant_a_id uuid NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  participant_b_id uuid NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  PRIMARY KEY (participant_a_id, participant_b_id),
  CHECK (participant_a_id < participant_b_id),
  CHECK (requester_id IN (participant_a_id, participant_b_id))
);
CREATE INDEX friend_relation_by_b ON friend_relation (participant_b_id);

-- 밋업 조 1~15조 (2회차 사전세션 자료의 조장 명단 기준). 근무 지역은 실제 값으로 채운다.
INSERT INTO tag (category, label)
  SELECT 'team', n || '조' FROM generate_series(1, 15) AS n
  ON CONFLICT (category, label) DO NOTHING;

COMMIT;
