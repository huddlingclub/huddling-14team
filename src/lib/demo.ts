// 데모 모드(NEXT_PUBLIC_DEMO=1) — DB·서버 없이 브라우저 안에서만 동작하는 샘플 데이터.
// 화면 구성과 흐름을 보여주기 위한 것이라, 입력한 내용은 이 기기에만 저장되고 다른 기기와 공유되지 않는다.
import {
  findRelation,
  getParticipant,
  groupMembers,
  groupSummary,
  groupsOf,
  homeData,
  profileView,
  recommend,
  relationLists,
  relationView,
  selfProfile,
} from './domain';
import { CATEGORIES, keyOf } from './tags';
import type { CatalogTag, Category, Network, Participant, Relation, TagId } from './types';

export const DEMO = process.env.NEXT_PUBLIC_DEMO === '1';

const OPTIONS: Record<Category, string[]> = {
  cohort: ['1기', '2기', '3기'],
  role: ['디자이너', '기획자', '마케터', '개발자'],
  team: Array.from({ length: 15 }, (_, i) => `${i + 1}조`),
  region: ['강남', '판교', '성수', '여의도', '마포', '종로'],
};

export interface CategoryDef {
  key: Category;
  label: string;
  /** false = 정확히 1개 (기수) */
  multi: boolean;
  required: boolean;
  options: string[];
}

export const DEMO_CATEGORIES: CategoryDef[] = CATEGORIES.map((c) => ({
  ...c,
  multi: c.key !== 'cohort',
  required: c.key === 'cohort',
  options: OPTIONS[c.key],
}));

const CATALOG: CatalogTag[] = DEMO_CATEGORIES.flatMap((c) =>
  c.options.map((label) => ({ id: keyOf(c.key, label), category: c.key, label, key: keyOf(c.key, label) })),
);
const RANK = new Map(CATALOG.map((t, i) => [t.key, i] as const));

const person = (n: number, displayName: string, tags: TagId[], customTags: string[] = []): Participant => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  displayName,
  tags,
  customTags,
});

// 샘플 참여자 (가상의 이름)
const SAMPLE: Participant[] = [
  person(1, '김민지', ['cohort:2기', 'role:기획자', 'team:14조', 'region:강남'], ['러닝']),
  person(2, '박준호', ['cohort:3기', 'role:개발자', 'team:3조', 'region:판교']),
  person(3, '이서연', ['cohort:1기', 'role:디자이너', 'team:14조', 'region:성수'], ['전시']),
  person(4, '정하늘', ['cohort:1기', 'role:기획자', 'team:7조', 'region:강남']),
  person(5, '최도윤', ['cohort:2기', 'role:마케터', 'team:14조', 'region:여의도'], ['러닝']),
  person(6, '한지우', ['cohort:1기', 'role:디자이너', 'team:2조', 'region:판교']),
  person(7, '윤가은', ['cohort:3기', 'role:기획자', 'team:9조', 'region:마포']),
  person(8, '장민석', ['cohort:1기', 'role:개발자', 'team:14조', 'region:강남']),
  person(9, '송예린', ['cohort:2기', 'role:디자이너', 'team:5조', 'region:종로']),
  person(10, '강태오', ['cohort:3기', 'role:마케터', 'team:11조', 'region:성수']),
];

const DEFAULT_TAGS: TagId[] = ['cohort:1기', 'role:기획자', 'team:14조', 'region:강남'];

type DemoRelation = Relation & { requestedAt: number };
interface DemoState {
  me: Participant | null;
  loggedIn: boolean;
  /** QR로 받아 온 다른 기기의 프로필 */
  extra: Participant[];
  relations: DemoRelation[];
}

const KEY = 'hdl-demo-v1';
/** 데모: 내가 보낸 요청은 이 시간이 지나면 상대가 수락한 것으로 보여준다 */
const AUTO_ACCEPT_MS = 4000;

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<DemoState>;
      return { me: s.me ?? null, loggedIn: Boolean(s.loggedIn), extra: s.extra ?? [], relations: s.relations ?? [] };
    }
  } catch {
    // 저장소를 못 쓰는 환경이면 빈 상태로 시작
  }
  return { me: null, loggedIn: false, extra: [], relations: [] };
}

function save(state: DemoState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 실패는 무시 (데모)
  }
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `00000000-0000-4000-9000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;
}

type ProfileInput = { displayName: string; tags: TagId[]; customTags: string[] };

function signIn(state: DemoState, profile: ProfileInput) {
  const first = !state.me;
  const id = state.me?.id ?? newId();
  state.me = { id, ...profile };
  state.loggedIn = true;
  // 처음 들어오면 받은 친구 요청이 한 건 있는 상태로 시작한다
  if (first) {
    state.relations.push({ a: SAMPLE[2].id, b: id, requesterId: SAMPLE[2].id, acceptedAt: null, requestedAt: Date.now() });
  }
}

function readProfile(body: Record<string, unknown>): ProfileInput | string {
  const displayName = String(body.displayName ?? '').trim();
  if (!displayName) return '이름을 입력해 주세요.';
  const picked = (Array.isArray(body.tags) ? body.tags.map(String) : []).filter((t) => RANK.has(t as TagId));
  const tags = [...new Set(picked)] as TagId[];
  if (tags.filter((t) => t.startsWith('cohort:')).length !== 1) return '기수를 하나 선택해 주세요.';
  const custom = (Array.isArray(body.customTags) ? body.customTags : []).map((s) => String(s).trim()).filter(Boolean);
  return { displayName, tags, customTags: [...new Set(custom)] };
}

/** QR 링크(?d=…)에 담긴 상대 프로필. 데모에서는 서버가 없어 링크로 전달한다 */
function readShared(id: string): Participant | null {
  try {
    const d = new URLSearchParams(window.location.search).get('d');
    if (!d) return null;
    const v = JSON.parse(d) as { n?: unknown; t?: unknown; c?: unknown };
    const displayName = String(v.n ?? '').trim().slice(0, 30);
    if (!displayName) return null;
    const tags = (Array.isArray(v.t) ? v.t.map(String) : []).filter((t) => RANK.has(t as TagId)) as TagId[];
    const customTags = (Array.isArray(v.c) ? v.c.map((s) => String(s).slice(0, 20)) : []).slice(0, 10);
    return { id, displayName, tags, customTags };
  } catch {
    return null;
  }
}

function network(state: DemoState): Network {
  const now = Date.now();
  for (const r of state.relations) {
    if (state.me && r.requesterId === state.me.id && !r.acceptedAt && now - r.requestedAt > AUTO_ACCEPT_MS) {
      r.acceptedAt = new Date(now).toISOString();
    }
  }
  return {
    participants: [...(state.me ? [state.me] : []), ...SAMPLE, ...state.extra],
    relations: state.relations,
    catalog: CATALOG,
    rank: RANK,
  };
}

/** 실제 API(/api/…)와 같은 경로·응답 모양을 브라우저 안에서 흉내 낸다 */
export async function demoApi(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ status: number; data: unknown }> {
  const method = init?.method ?? 'GET';
  const body = (init?.body && typeof init.body === 'object' ? init.body : {}) as Record<string, unknown>;
  const state = load();
  const fail = (status: number, message: string) => ({ status, data: { message } });
  const done = (data: unknown, status = 200) => {
    save(state);
    return { status, data };
  };

  if (path === '/api/auth/signup' && method === 'POST') {
    const password = String(body.password ?? '');
    if (!String(body.loginId ?? '').trim() || !password) return fail(400, '아이디와 비밀번호를 입력해 주세요.');
    if (String(body.passwordConfirm ?? password) !== password) return fail(400, '비밀번호가 서로 달라요.');
    const profile = readProfile(body);
    if (typeof profile === 'string') return fail(400, profile);
    signIn(state, profile);
    return done({ id: state.me?.id }, 201);
  }
  if (path === '/api/auth/login' && method === 'POST') {
    const loginId = String(body.loginId ?? '').trim();
    if (!loginId || !body.password) return fail(400, '아이디와 비밀번호를 입력해 주세요.');
    if (state.me) state.loggedIn = true;
    else signIn(state, { displayName: loginId, tags: DEFAULT_TAGS, customTags: ['러닝'] });
    return done({ id: state.me?.id });
  }
  if (path === '/api/auth/logout') {
    state.loggedIn = false;
    return done({ ok: true });
  }

  const me = state.me;
  if (!me || !state.loggedIn) return fail(401, '로그인해 주세요.');
  const net = network(state);

  if (path === '/api/me') {
    if (method !== 'PATCH') return done({ me: selfProfile(net, me) });
    const profile = readProfile(body);
    if (typeof profile === 'string') return fail(400, profile);
    state.me = { ...me, ...profile };
    return done({ me: selfProfile(network(state), state.me) });
  }
  if (path === '/api/home') return done(homeData(net, me));
  if (path === '/api/recommend') return done({ items: recommend(net, me) });
  if (path === '/api/groups') return done({ groups: groupsOf(net, me) });

  const group = /^\/api\/groups\/(.+)$/.exec(path);
  if (group) {
    const summary = groupSummary(net, me, decodeURIComponent(group[1]));
    if (!summary) return fail(404, '없는 그룹이에요.');
    return done({ group: summary, members: groupMembers(net, me, summary.key) });
  }

  const profile = /^\/api\/profiles\/([^/]+)$/.exec(path);
  if (profile) {
    const id = decodeURIComponent(profile[1]);
    let target = getParticipant(net, id);
    if (!target) {
      const shared = readShared(id);
      if (shared) {
        state.extra.push(shared);
        target = shared;
      }
    }
    if (!target) return fail(404, '없는 프로필이에요.');
    return done({ profile: profileView(network(state), me, target) });
  }

  if (path === '/api/relations' && method === 'GET') return done(relationLists(net, me));
  if (path === '/api/relations' && method === 'POST') {
    const toId = String(body.toId ?? '');
    if (toId === me.id) return fail(400, '나에게는 요청할 수 없어요.');
    if (!getParticipant(net, toId)) return fail(404, '없는 프로필이에요.');
    let rel = findRelation(net, me.id, toId);
    if (!rel) {
      const created: DemoRelation = { a: me.id, b: toId, requesterId: me.id, acceptedAt: null, requestedAt: Date.now() };
      state.relations.push(created);
      rel = created;
    }
    return done({ relation: relationView(rel, me.id) });
  }

  const accept = /^\/api\/relations\/([^/]+)\/accept$/.exec(path);
  if (accept && method === 'POST') {
    const rel = findRelation(net, me.id, decodeURIComponent(accept[1]));
    if (!rel) return fail(404, '받은 요청이 없어요.');
    if (!rel.acceptedAt) {
      if (rel.requesterId === me.id) return fail(409, '내가 보낸 요청은 상대가 수락해야 해요.');
      rel.acceptedAt = new Date().toISOString();
    }
    return done({ relation: 'friend' });
  }

  return fail(404, '없는 요청이에요.');
}
