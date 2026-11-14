import "server-only";
import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import type { Profile, ProfileInput, Tag } from "@/lib/profile-input";

export async function getTagOptions() {
  return (await db().query<Tag>("SELECT id, category, label FROM tag ORDER BY length(label), label")).rows;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { rows } = await db().query<Profile>(
    `SELECT p.id AS "userId", p.display_name AS "displayName",
      jsonb_build_object(
        'cohort', COALESCE(t.tags -> 'cohort', '[]'::jsonb),
        'role', COALESCE(t.tags -> 'role', '[]'::jsonb),
        'team', COALESCE(t.tags -> 'team', '[]'::jsonb),
        'region', COALESCE(t.tags -> 'region', '[]'::jsonb)
      ) AS tags,
      COALESCE(c.tags, '[]'::jsonb) AS "customTags"
    FROM participant p
    LEFT JOIN LATERAL (
      SELECT jsonb_object_agg(category, ids) AS tags FROM (
        SELECT category, jsonb_agg(tag_id ORDER BY tag_id) AS ids
        FROM participant_tag WHERE participant_id = p.id GROUP BY category
      ) grouped
    ) t ON true
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(label ORDER BY label) AS tags
      FROM participant_custom_tag WHERE participant_id = p.id
    ) c ON true
    WHERE p.id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function saveProfile(client: PoolClient, userId: string, profile: ProfileInput) {
  await client.query("UPDATE participant SET display_name = $2 WHERE id = $1", [userId, profile.displayName]);
  const tagIds = Object.values(profile.tags).flat();
  await client.query(
    "DELETE FROM participant_tag WHERE participant_id = $1 AND NOT (tag_id = ANY($2::uuid[]))",
    [userId, tagIds],
  );
  await client.query(
    `INSERT INTO participant_tag (participant_id, tag_id, category)
      SELECT $1, id, category FROM tag WHERE id = ANY($2::uuid[])
      ON CONFLICT (participant_id, tag_id) DO NOTHING`,
    [userId, tagIds],
  );
  await client.query(
    "DELETE FROM participant_custom_tag WHERE participant_id = $1 AND NOT (label = ANY($2::text[]))",
    [userId, profile.customTags],
  );
  await client.query(
    `INSERT INTO participant_custom_tag (participant_id, label)
      SELECT $1, value FROM unnest($2::text[]) AS items(value)
      ON CONFLICT (participant_id, label) DO NOTHING`,
    [userId, profile.customTags],
  );
}
