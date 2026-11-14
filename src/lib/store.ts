// 저장소 — DB가 정해지면 이 파일만 교체한다 (WORK_SPLIT.md 7장 "DB · 백엔드 선택").
// 지금은 로컬 JSON 파일(.data/db.json). Vercel에서는 /tmp라 인스턴스마다 따로 저장되고
// 재시작하면 사라진다 → 배포 전에 실제 DB로 바꿔야 한다.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DB } from './types';

const DIR =
  process.env.DATA_DIR ?? (process.env.VERCEL ? '/tmp/hdl-data' : path.join(process.cwd(), '.data'));
const FILE = path.join(DIR, 'db.json');

const empty = (): DB => ({ participants: [], accounts: [], sessions: [], relations: [] });

async function load(): Promise<DB> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return { ...empty(), ...(JSON.parse(raw) as Partial<DB>) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return empty();
    throw e;
  }
}

async function save(db: DB) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

// 같은 프로세스 안에서는 읽기·쓰기를 한 줄로 세워 동시 요청에도 관계가 한 건만 남게 한다.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

export function read<T>(fn: (db: DB) => T): Promise<T> {
  return serial(async () => fn(await load()));
}

/** fn이 예외를 던지면 저장하지 않는다 (한 트랜잭션처럼 동작) */
export function write<T>(fn: (db: DB) => T): Promise<T> {
  return serial(async () => {
    const db = await load();
    const result = fn(db);
    await save(db);
    return result;
  });
}
