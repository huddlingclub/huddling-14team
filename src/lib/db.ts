import "server-only";
import { Pool, type PoolClient } from "pg";

let pool: Pool | undefined;

export function db() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
    // Neon 주소의 sslmode=require는 지금 pg에서 verify-full과 같게 동작한다 — 경고 없이 그 뜻을 그대로 적어 둔다
    const connectionString = process.env.DATABASE_URL.replace(/sslmode=(require|prefer|verify-ca)\b/, 'sslmode=verify-full');
    pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000 });
  }
  return pool;
}

export async function transaction<T>(run: (client: PoolClient) => Promise<T>) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
