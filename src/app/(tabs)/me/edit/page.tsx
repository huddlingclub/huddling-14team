import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { getSession } from '@/lib/session';
import { ProfileEditScreen } from '@/screens/ProfileEditScreen';

export const metadata: Metadata = { title: '프로필 수정' };

// PG-502 프로필 수정
export default async function ProfileEdit() {
  const session = await getSession();
  if (!session) redirect('/login');
  const me = await getMe(session.userId);
  if (!me) redirect('/login');
  return (
    <ProfileEditScreen
      me={{ id: me.id, profile: me.profile, options: me.options, username: me.username, photo: me.photo }}
    />
  );
}
