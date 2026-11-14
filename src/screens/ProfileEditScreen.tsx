'use client';
// PG-502 프로필 수정 (07) — 사진(96 + 사진 변경) · 이름 · 아이디(바꿀 수 없음) · 선택 정보 칩 · 하단 저장. 사진 시트 MD-501
import { Camera, CircleAlert, ImageIcon, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { checkProfile, ProfileForm, type FieldErrors } from '@/components/account/ProfileForm';
import { useToast } from '@/components/feedback/Toast';
import { Avatar, BottomCta, Button, centerSnap, iconProps, inlineButton, TextField, TopBar } from '@/components/ui';
import { api } from '@/lib/client';
import { shrinkImage } from '@/lib/image';
import type { ProfileInput, Tag } from '@/lib/profile-input';

export function ProfileEditScreen({
  me,
}: {
  me: { id: string; profile: ProfileInput; options: Tag[]; username: string; photo: string | null };
}) {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<ProfileInput>(me.profile);
  const [photo, setPhoto] = useState<string | null>(me.photo);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [sheet, setSheet] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = JSON.stringify(profile) !== JSON.stringify(me.profile);

  // 저장하지 않고 나가려 하면 브라우저가 한 번 묻는다
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function upload(file: File) {
    setSheet(false);
    setPhotoBusy(true);
    try {
      const dataUrl = await shrinkImage(file, 384, true, 0.86);
      const r = await api<{ photo: string }>('/api/me/photo', { method: 'POST', body: { dataUrl } });
      if (!r.ok) throw new Error(r.error);
      setPhoto(r.data.photo);
      toast('프로필 사진을 바꿨어요');
      router.refresh();
    } catch (e) {
      toast((e as Error).message || '사진을 올리지 못했어요. 다시 시도해 주세요.', 'error');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function resetPhoto() {
    setSheet(false);
    setPhotoBusy(true);
    const r = await api('/api/me/photo', { method: 'DELETE' });
    setPhotoBusy(false);
    if (!r.ok) return toast(r.error, 'error');
    setPhoto(null);
    toast('기본 이미지로 바꿨어요');
    router.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const found = checkProfile(profile);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) {
      const target = found.displayName
        ? formRef.current?.querySelector<HTMLElement>('#edit-name')
        : formRef.current?.querySelector<HTMLElement>('[aria-describedby="edit-cohort-error"] button');
      target?.focus();
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setBusy(true);
    const r = await api('/api/me', { method: 'PATCH', body: { ...profile, displayName: profile.displayName.trim() } });
    setBusy(false);
    if (!r.ok) {
      setFormError(r.error); // 실패하면 입력값을 그대로 두고 다시 시도할 수 있게 한다
      return;
    }
    toast('프로필을 저장했어요');
    router.push('/me');
    router.refresh();
  }

  const pick = (ref: React.RefObject<HTMLInputElement | null>, capture: boolean) => (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      {...(capture ? { capture: 'user' as const } : {})}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) void upload(f);
      }}
    />
  );

  return (
    <>
      <TopBar title="프로필 수정" back="/me" />
      <form ref={formRef} onSubmit={save} noValidate className="flex flex-1 flex-col">
        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col items-center gap-2">
            <div ref={centerSnap} className="self-start">
              <Avatar name={profile.displayName || me.username} seed={me.id} photo={photo} size={96} />
            </div>
            <button
              ref={centerSnap}
              type="button"
              onClick={() => setSheet(true)}
              disabled={photoBusy}
              aria-haspopup="dialog"
              className={`${inlineButton} self-start`}
            >
              {photoBusy ? '올리는 중…' : '사진 변경'}
            </button>
            {pick(cameraRef, true)}
            {pick(albumRef, false)}
          </div>

          <ProfileForm
            idPrefix="edit"
            value={profile}
            onChange={(p) => {
              setProfile(p);
              if (errors.displayName && p.displayName.trim()) setErrors((x) => ({ ...x, displayName: undefined }));
              if (errors.cohort && p.tags.cohort.length) setErrors((x) => ({ ...x, cohort: undefined }));
            }}
            options={me.options}
            errors={errors}
            optionalHint="태그를 바꾸면 그룹과 추천이 새로 바뀌어요"
            beforeOptional={
              <TextField id="edit-username" label="아이디" value={me.username} disabled readOnly hint="아이디는 로그인에 쓰여서 바꿀 수 없어요" />
            }
          />

          <p className="t-support text-[color:var(--color-text-secondary)]">태그를 바꿔도 이미 맺은 친구는 그대로 유지돼요</p>

          {formError && (
            <p role="alert" className="t-body flex items-center gap-2 text-[color:var(--color-status-error)]">
              <CircleAlert size={18} {...iconProps} className="shrink-0" />
              {formError}
            </p>
          )}
        </div>

        <BottomCta>
          <Button type="submit" disabled={busy}>
            {busy ? '저장 중…' : '저장'}
          </Button>
        </BottomCta>
      </form>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="presentation">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-[rgba(8,6,26,0.6)]"
            onClick={() => setSheet(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="photo-sheet-title"
            className="relative w-full max-w-[375px] rounded-t-[16px] bg-[var(--color-background-card)] px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3"
          >
            <div aria-hidden className="mx-auto h-1 w-9 rounded-full bg-[var(--color-border-emphasized)]" />
            <div className="mt-4 flex flex-col gap-1">
              <h2 id="photo-sheet-title" className="t-h3">
                프로필 사진
              </h2>
              <p className="t-support text-[color:var(--color-text-secondary)]">사진은 이번 밋업 등록자에게만 보여요</p>
            </div>
            <ul className="mt-4 flex flex-col">
              <SheetItem Icon={Camera} label="사진 찍기" onClick={() => cameraRef.current?.click()} />
              <SheetItem Icon={ImageIcon} label="앨범에서 선택" onClick={() => albumRef.current?.click()} />
              {photo && <SheetItem Icon={RotateCcw} label="기본 이미지로 변경" onClick={resetPhoto} />}
            </ul>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => setSheet(false)} autoFocus>
              취소
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function SheetItem({ Icon, label, onClick }: { Icon: typeof Camera; label: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex h-[52px] w-full items-center gap-3 px-1 text-left">
        <Icon size={20} {...iconProps} className="text-[color:var(--color-text-secondary)]" />
        <span className="text-[16px] font-medium leading-[22px]">{label}</span>
      </button>
    </li>
  );
}
