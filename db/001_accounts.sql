BEGIN;

CREATE TABLE participant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 40)
);

CREATE TABLE account (
  participant_id uuid PRIMARY KEY REFERENCES participant(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,24}$'),
  password_hash text NOT NULL
);

CREATE TABLE account_session (
  token_hash text PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX account_session_expiry ON account_session (expires_at);

CREATE TABLE account_attempt (
  scope text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL
);

CREATE TABLE tag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('cohort', 'role', 'team', 'region')),
  label text NOT NULL CHECK (btrim(label) <> ''),
  UNIQUE (category, label),
  UNIQUE (id, category)
);

CREATE TABLE participant_tag (
  participant_id uuid REFERENCES participant(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL,
  category text NOT NULL,
  PRIMARY KEY (participant_id, tag_id),
  FOREIGN KEY (tag_id, category) REFERENCES tag (id, category)
);
CREATE UNIQUE INDEX participant_one_cohort ON participant_tag (participant_id)
  WHERE category = 'cohort';
CREATE INDEX participant_tag_by_tag ON participant_tag (tag_id, participant_id);

CREATE TABLE participant_custom_tag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participant(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 40),
  UNIQUE (participant_id, label)
);

-- Initial options. Update this catalog with the final meetup options before launch.
INSERT INTO tag (category, label) VALUES
  ('cohort', '1기'), ('cohort', '2기'), ('cohort', '3기'),
  ('role', '디자이너'), ('role', '기획자'), ('role', '마케터'), ('role', '개발자'),
  ('team', '3조'), ('team', '14조'),
  ('region', '강남'), ('region', '판교');

COMMIT;
