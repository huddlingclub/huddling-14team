"use client";

import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { limits, type ProfileInput, type Tag } from "@/lib/profile-input";
import { accountRequest, messageFor } from "./api";
import { ProfileFields } from "./profile-fields";

type Props = {
  mode: "login" | "signup" | "edit";
  options?: Tag[];
  initial?: ProfileInput;
  nextPath: string;
};

export function AccountForm({ mode, options = [], initial, nextPath }: Props) {
  const [profile, setProfile] = useState<ProfileInput>(initial ?? {
    displayName: "", tags: { cohort: [], role: [], team: [], region: [] }, customTags: [],
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const login = mode === "login";
  const edit = mode === "edit";
  const otherPage = (login ? "/signup" : "/login") +
    (nextPath === "/home" ? "" : `?next=${encodeURIComponent(nextPath)}`);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const credentials = { username, password };
    if (!edit && (!username.trim() || !password)) {
      setNotice("");
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (edit) {
        await accountRequest("/api/me", "PATCH", profile);
        setNotice("프로필을 저장했어요.");
      } else {
        await accountRequest(login ? "/api/auth/login" : "/api/auth/signup", "POST",
          login ? credentials : { ...credentials, ...profile });
        globalThis.location.assign(nextPath);
      }
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await accountRequest("/api/auth/logout", "POST", {});
      globalThis.location.assign("/login");
    } catch (error) {
      setError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="account-form">
      <fieldset disabled={busy} className="account-form">
        {!edit && (
          <>
            <TextInput
              label="아이디" htmlName="username" autoComplete="username" autoCapitalize="none"
              hasSpellCheck={false} isRequired width="100%"
              description={login ? undefined : "영문, 숫자, 밑줄 3~24자"}
              value={username} onChange={setUsername}
            />
            <TextInput
              label="비밀번호" htmlName="password" type="password"
              autoComplete={login ? "current-password" : "new-password"} isRequired width="100%"
              description={login ? undefined : `${limits.passwordMin}자 이상`}
              value={password} onChange={setPassword}
            />
          </>
        )}
        {!login && <ProfileFields value={profile} options={options} onChange={setProfile} />}
        {mode === "signup" && <p className="account-hint">표시 이름과 태그는 이번 밋업에 등록한 참여자에게 보여요.</p>}
        {error && <p role="alert" className="feedback">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <div className="account-actions">
          <Button
            type="submit" variant="primary" isDisabled={busy}
            label={busy ? "처리 중…" : login ? "로그인" : edit ? "저장" : "가입하기"}
          />
          {edit && <Button type="button" variant="secondary" label="로그아웃" onClick={logout} />}
        </div>
      </fieldset>
      {edit && <Link href="/home" className="account-link">홈으로</Link>}
      {!edit && <Link href={otherPage} className="account-link">{login ? "가입하기" : "로그인으로 돌아가기"}</Link>}
    </form>
  );
}
