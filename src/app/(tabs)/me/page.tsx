import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { getSession } from '@/lib/session';
import { MyScreen } from '@/screens/MyScreen';

export const metadata: Metadata = { title: '마이페이지' };

// PG-501 마이페이지
export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const me = await getMe(session.userId);
  if (!me) redirect('/login');
  return (
    <MyScreen
      me={{
        id: me.id,
        displayName: me.profile.displayName,
        username: me.username,
        photo: me.photo,
        tags: me.tags,
        customTags: me.profile.customTags,
      }}
    />
  );
}
