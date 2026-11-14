import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { getSession } from '@/lib/session';
import { QrScreen } from '@/screens/QrScreen';

export const metadata: Metadata = { title: '내 QR' };

// PG-602 내 QR
export default async function MyQr() {
  const session = await getSession();
  if (!session) redirect('/login');
  const me = await getMe(session.userId);
  if (!me) redirect('/login');
  return <QrScreen me={{ id: me.id, displayName: me.profile.displayName, photo: me.photo }} />;
}
