'use client';
// PG-102 등록 (07) — 등록 방법 선택(PG-102-1) → 명함 촬영 · 확인(PG-102-2·3) → 직접 입력(PG-102-4)
// 계정(아이디·비밀번호) + 프로필(이름·기수 필수, 나머지 선택). 저장하면 홈, QR로 들어왔으면 그 프로필로 간다
import { Camera, ChevronRight, CircleAlert, Eye, EyeOff, PenLine, ScanLine, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { checkProfile, emptyProfile, ProfileForm, type FieldErrors } from '@/components/account/ProfileForm';
import { BottomCta, Button, Chip, iconProps, TextField, TopBar } from '@/components/ui';
import { api } from '@/lib/client';
import { shrinkImage } from '@/lib/image';
import { limits, weakPassword, type ProfileInput, type Tag } from '@/lib/profile-input';

type Step = 'method' | 'reading' | 'form';
type CardResult = { displayName?: string; role?: string; region?: string };
type Scan = { image: string; status: 'ok' | 'partial' | 'failed'; filled: string[]; message?: string } | null;

const USERNAME = /^[a-z0-9_]{3,24}$/;

export function SignupScreen({ next, options, ocr }: { next: string; options: Tag[]; ocr: boolean }) {
  // 명함 읽기(OCR)를 켠 경우에만 등록 방법 선택부터, 아니면 바로 입력 폼
  const [step, setStep] = useState<Step>(ocr ? 'method' : 'form');
  const [scan, setScan] = useState<Scan>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [profile, setProfile] = useState<ProfileInput>(emptyProfile);
  const [errors, setErrors] = useState<FieldErrors & { username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fromQr = next.startsWith('/p/');

  function usernameError(v: string) {
    if (!v) return '아이디를 입력해 주세요.';
    if (!USERNAME.test(v)) return '영문 소문자 · 숫자 · 밑줄(_)로 3~24자를 입력해 주세요.';
    return undefined;
  }
  function passwordError(v: string) {
    if (!v) return '비밀번호를 입력해 주세요.';
    if (v.length < limits.passwordMin) return `비밀번호는 ${limits.passwordMin}자 이상 입력해 주세요.`;
    if (v.length > limits.passwordMax) return `비밀번호는 ${limits.passwordMax}자까지 입력할 수 있어요.`;
    if (weakPassword(v, username)) return '너무 쉬운 비밀번호예요. 다른 비밀번호를 입력해 주세요.';
    return undefined;
  }

  // 명함 사진 → 서버에서 글자를 읽어 이름 · 직무 · 근무 지역 후보를 받는다
  async function readCard(file: File) {
    setStep('reading');
    let image = '';
    try {
      image = await shrinkImage(file, 1280, false, 0.82);
    } catch (e) {
      setScan({ image: '', status: 'failed', filled: [] });
      setFormError((e as Error).message);
      setStep('form');
      return;
    }
    const r = await api<CardResult>('/api/ocr/card', { method: 'POST', body: { image } });
    const filled: string[] = [];
    if (r.ok) {
      const d = r.data;
      const tagId = (category: Tag['category'], label?: string) =>
        label ? options.find((t) => t.category === category && t.label === label)?.id : undefined;
      const role = tagId('role', d.role);
      const region = tagId('region', d.region);
      setProfile((p) => ({
        ...p,
        displayName: d.displayName?.trim() ? d.displayName.trim().slice(0, limits.name) : p.displayName,
        tags: { ...p.tags, role: role ? [role] : p.tags.role, region: region ? [region] : p.tags.region },
      }));
      if (d.displayName) filled.push('이름');
      if (role) filled.push('직무');
      if (region) filled.push('근무 지역');
    }
    setScan({ image, status: !r.ok ? 'failed' : filled.length ? 'ok' : 'partial', filled, message: r.ok ? undefined : r.error });
    setFormError(null);
    setStep('form');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const found = {
      username: usernameError(username),
      password: passwordError(password),
      ...checkProfile(profile),
    };
    const clean = Object.fromEntries(Object.entries(found).filter(([, v]) => v)) as typeof errors;
    setErrors(clean);
    setFormError(null);
    if (Object.keys(clean).length) {
      // 첫 번째 잘못된 칸으로 이동
      const order = ['username', 'password', 'displayName', 'cohort'] as const;
      const first = order.find((k) => clean[k]);
      const target =
        first === 'cohort'
          ? formRef.current?.querySelector<HTMLElement>('[aria-describedby="signup-cohort-error"] button')
          : formRef.current?.querySelector<HTMLElement>(`#signup-${first === 'displayName' ? 'name' : first}`);
      target?.focus();
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setBusy(true);
    const r = await api('/api/auth/signup', {
      method: 'POST',
      body: { username, password, ...profile, displayName: profile.displayName.trim() },
    });
    if (r.ok) {
      window.location.assign(next);
      return;
    }
    setBusy(false);
    if (r.status === 409) {
      setErrors((x) => ({ ...x, username: r.error }));
      formRef.current?.querySelector<HTMLElement>('#signup-username')?.focus();
    } else {
      setFormError(r.error);
    }
  }

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) void readCard(f);
      }}
    />
  );

  if (step === 'method') {
    return (
      <>
        <TopBar title="" back={fromQr ? `/login?next=${encodeURIComponent(next)}` : '/login'} />
        <div className="flex flex-1 flex-col px-4 pb-6 pt-2">
          <div className="flex flex-col gap-[6px]">
            <h1 className="t-title">어떻게 등록할까요?</h1>
            <p className="t-body text-[color:var(--color-text-secondary)]">명함을 찍으면 입력할 내용이 줄어들어요</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <MethodCard
              Icon={ScanLine}
              title="명함으로 등록"
              badge="추천"
              text="명함을 찍으면 이름 · 직무 · 근무지를 채워 드려요"
              onClick={() => fileRef.current?.click()}
            />
            <MethodCard Icon={PenLine} title="직접 입력하기" text="이름과 기수만 입력하면 바로 시작할 수 있어요" onClick={() => setStep('form')} />
          </div>
          <p className="t-support mt-auto flex items-center gap-2 pt-8 text-[color:var(--color-text-secondary)]">
            <ShieldCheck size={16} {...iconProps} className="shrink-0" />
            명함에서 읽은 정보는 직접 확인한 뒤에만 저장돼요. 명함 사진은 저장하지 않아요.
          </p>
          {fileInput}
        </div>
      </>
    );
  }

  if (step === 'reading') {
    return (
      <>
        <TopBar title="명함 확인" />
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <ScanLine size={32} {...iconProps} className="animate-pulse text-[color:var(--color-accent)]" />
          <p className="t-h3">명함을 읽고 있어요</p>
          <p className="t-body text-[color:var(--color-text-secondary)]">몇 초 정도 걸려요</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={scan ? '정보 확인' : '프로필 등록'} back={fromQr ? `/login?next=${encodeURIComponent(next)}` : '/login'} />
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-1 flex-col">
        <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="t-h2">{scan ? '정보를 확인해 주세요' : '허들링 네트워킹'}</h2>
          <p className="t-support text-[color:var(--color-text-secondary)]">
            {scan ? '명함에서 읽은 내용이에요. 틀린 부분은 고쳐 주세요' : '밋업에서 만난 사람과 연결돼요'}
          </p>
        </div>

        {scan && (
          <div className="flex items-center gap-3 rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] p-3">
            {scan.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- 방금 찍은 명함 미리보기(data URL)
              <img src={scan.image} alt="찍은 명함" width={72} height={44} className="h-11 w-[72px] shrink-0 rounded-[6px] object-cover" />
            ) : (
              <span className="flex h-11 w-[72px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-background-raised)]">
                <CircleAlert size={20} {...iconProps} />
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <p className="t-label-strong">
                {scan.status === 'ok' ? '명함 인식 완료' : scan.status === 'partial' ? '일부만 읽었어요' : '명함을 읽지 못했어요'}
              </p>
              <p className="t-support text-[color:var(--color-text-secondary)]">
                {scan.status === 'ok'
                  ? `${scan.filled.join(' · ')}을 채웠어요`
                  : scan.status === 'partial'
                    ? '읽은 내용이 없어서 직접 입력해 주세요'
                    : (scan.message ?? '직접 입력하거나 다시 찍어 주세요')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="t-label flex h-11 shrink-0 items-center gap-1 px-1 text-[color:var(--color-accent)]"
            >
              <Camera size={16} {...iconProps} />
              다시 찍기
            </button>
          </div>
        )}
        {fileInput}

        <div className="flex flex-col gap-4">
          <TextField
            id="signup-username"
            label="아이디"
            required
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.trim().toLowerCase());
              if (errors.username) setErrors((x) => ({ ...x, username: undefined }));
            }}
            onBlur={async () => {
              if (!username) return;
              const formatError = usernameError(username);
              setErrors((x) => ({ ...x, username: formatError }));
              if (formatError) return;
              // 다 쓰고 나가면 바로 중복을 알려 준다 (저장 때 서버가 다시 확인)
              const r = await api<{ available: boolean }>(`/api/auth/username?u=${encodeURIComponent(username)}`);
              if (r.ok && !r.data.available) {
                setErrors((x) => ({ ...x, username: '이미 쓰는 아이디예요. 다른 아이디를 입력해 주세요.' }));
              }
            }}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={24}
            placeholder="예: huddling_14"
            hint="영문 소문자 · 숫자 · 밑줄(_) 3~24자. 로그인할 때 써요"
            error={errors.username}
          />
          <div className="relative">
            <TextField
              id="signup-password"
              label="비밀번호"
              required
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
              }}
              onBlur={() => password && setErrors((x) => ({ ...x, password: passwordError(password) }))}
              autoComplete="new-password"
              maxLength={limits.passwordMax}
              hint={`${limits.passwordMin}자 이상`}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={show}
              className="absolute right-0 top-7 flex size-11 items-center justify-center text-[color:var(--color-text-secondary)]"
            >
              {show ? <EyeOff size={20} {...iconProps} /> : <Eye size={20} {...iconProps} />}
            </button>
          </div>
        </div>

        <ProfileForm
          idPrefix="signup"
          value={profile}
          onChange={(p) => {
            setProfile(p);
            if (errors.displayName && p.displayName.trim()) setErrors((x) => ({ ...x, displayName: undefined }));
            if (errors.cohort && p.tags.cohort.length) setErrors((x) => ({ ...x, cohort: undefined }));
          }}
          options={options}
          errors={errors}
          nameLabel="표시 이름"
        />

        {/* 수집 항목 안내 — 무엇을 받고 누구에게 보이는지 저장 전에 알린다 */}
        <p className="t-support text-[color:var(--color-text-secondary)]">
          아이디 · 비밀번호(암호화해 저장) · 이름 · 태그 · 프로필 사진(선택)을 받아 이번 밋업 네트워킹에만 써요. 이름 · 태그 · 사진은 이번 밋업 등록자에게만 보여요.
        </p>

        {formError && (
          <p role="alert" className="t-body flex items-center gap-2 text-[color:var(--color-status-error)]">
            <CircleAlert size={18} {...iconProps} className="shrink-0" />
            {formError}
          </p>
        )}

        <p className="t-support flex items-center gap-[6px] text-[color:var(--color-text-secondary)]">
          이미 등록했나요?
          <Link
            href={next === '/home' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
            className="t-label-strong inline-flex min-h-11 items-center text-[color:var(--color-accent)] underline [text-underline-position:from-font]"
          >
            로그인
          </Link>
        </p>
        </div>

        <BottomCta>
          <Button type="submit" disabled={busy}>
            {busy ? '저장 중…' : fromQr ? '저장하고 상대 프로필 보기' : '내 그룹 보기'}
          </Button>
        </BottomCta>
      </form>
    </>
  );
}

function MethodCard({
  Icon,
  title,
  text,
  badge,
  onClick,
}: {
  Icon: typeof Camera;
  title: string;
  text: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[14px] rounded-[var(--radius-container)] border border-[color:var(--color-border)] bg-[var(--color-background-card)] px-[18px] py-[18px] text-left"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-[color:var(--color-accent)]">
        <Icon size={24} {...iconProps} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-[6px]">
          <span className="t-h3">{title}</span>
          {badge && <Chip tone="selected">{badge}</Chip>}
        </span>
        <span className="t-support text-[color:var(--color-text-secondary)]">{text}</span>
      </span>
      <ChevronRight size={20} {...iconProps} className="shrink-0 text-[color:var(--color-text-secondary)]" />
    </button>
  );
}
