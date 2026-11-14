BEGIN;

-- 선택지 표시 순서 (시안 05 온보딩 순서). 값이 같으면 짧은 라벨 → 가나다 순
ALTER TABLE tag ADD COLUMN IF NOT EXISTS sort integer NOT NULL DEFAULT 50;
UPDATE tag SET sort = CASE label
  WHEN '디자이너' THEN 1 WHEN '기획자' THEN 2 WHEN '마케터' THEN 3 WHEN '개발자' THEN 4
  ELSE sort END
WHERE category = 'role';

-- 근무 지역 선택지 (시안 05: 강남 · 판교 · 서초 · 여의도 · 성수 · 기타)
INSERT INTO tag (category, label) VALUES
  ('region', '서초'), ('region', '여의도'), ('region', '성수'), ('region', '기타')
  ON CONFLICT (category, label) DO NOTHING;
UPDATE tag SET sort = CASE label
  WHEN '강남' THEN 1 WHEN '판교' THEN 2 WHEN '서초' THEN 3 WHEN '여의도' THEN 4 WHEN '성수' THEN 5 WHEN '기타' THEN 99
  ELSE sort END
WHERE category = 'region';

-- 밋업 조는 한 사람당 하나 (화면정의서 · 시안: 드롭다운 1개)
CREATE UNIQUE INDEX IF NOT EXISTS participant_one_team ON participant_tag (participant_id)
  WHERE category = 'team';

-- 프로필 사진. 로그인한 참여자에게만 보이도록 DB에 두고 /api/photos/:id 로 내려준다
CREATE TABLE IF NOT EXISTS participant_photo (
  participant_id uuid PRIMARY KEY REFERENCES participant(id) ON DELETE CASCADE,
  mime text NOT NULL CHECK (mime IN ('image/jpeg', 'image/webp', 'image/png')),
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 300000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 밋업 참여자 명단 (디스코드 조별 스레드에서 읽은 이름 · 기수 · 조).
-- 가입·프로필 수정 때 이름과 기수가 같으면 조를 미리 채우는 데만 쓰고, 화면 목록에는 직접 보이지 않는다.
-- 실명 명단이라 저장소(Git)에는 넣지 않고 DB에만 넣는다.
CREATE TABLE IF NOT EXISTS meetup_roster (
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 40),
  cohort text CHECK (cohort IN ('1기', '2기', '3기')),
  team text NOT NULL,
  source text NOT NULL DEFAULT 'discord',
  PRIMARY KEY (display_name, team)
);

COMMIT;
