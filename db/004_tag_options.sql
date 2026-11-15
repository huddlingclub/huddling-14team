BEGIN;

-- 선택지 추가 (2026-11-15). 여러 번 실행해도 결과가 같다.

-- 1) 기수 칸에 '운영진' · '퍼스트펭귄'
-- 기수는 아니지만 한 사람이 하나만 고르는 같은 칸에 둔다 — 운영진이면 기수 대신 운영진을 고른다.
-- 디스코드 명단(meetup_roster)의 기수와는 맞추지 않으므로, 이 둘을 고르면 조를 미리 채우지 않는다.
INSERT INTO tag (category, label) VALUES
  ('cohort', '운영진'), ('cohort', '퍼스트펭귄')
  ON CONFLICT (category, label) DO NOTHING;

-- 표시 순서: 1기 · 2기 · 3기 · 운영진 · 퍼스트펭귄
UPDATE tag SET sort = CASE label
  WHEN '1기' THEN 1 WHEN '2기' THEN 2 WHEN '3기' THEN 3 WHEN '운영진' THEN 4 WHEN '퍼스트펭귄' THEN 5
  ELSE sort END
WHERE category = 'cohort';

-- 2) 직무 칸에 '기타' — 근무 지역의 '기타'처럼 맨 뒤
INSERT INTO tag (category, label, sort) VALUES ('role', '기타', 99)
  ON CONFLICT (category, label) DO UPDATE SET sort = 99;

COMMIT;
