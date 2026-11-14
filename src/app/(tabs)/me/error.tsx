"use client";

import { Button } from "@astryxdesign/core/Button";

export default function MyPageError({ reset }: { reset: () => void }) {
  return (
    <main className="account-shell">
      <header className="account-header"><h1>마이페이지</h1></header>
      <div className="account-actions">
        <p className="feedback" role="alert">프로필을 불러오지 못했어요.</p>
        <Button variant="secondary" label="다시 시도" onClick={reset} />
      </div>
    </main>
  );
}
