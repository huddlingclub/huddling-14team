import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ProfileScreen } from '@/screens/ProfileScreen';

// PG-601 타인 프로필 — QR 링크(/p/<참여자 ID>)가 도착하는 주소.
// 비로그인이면 로그인·가입을 거쳐 이 프로필로 돌아온다 (README "계정·프로필 연동")
export default async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await getSession())) redirect(`/login?next=${encodeURIComponent(`/p/${id}`)}`);
  return <ProfileScreen />;
}
