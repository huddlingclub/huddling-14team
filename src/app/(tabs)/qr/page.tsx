import { redirect } from 'next/navigation';
import { DEMO } from '@/lib/demo';
import { getProfile } from '@/lib/profiles';
import { getSession } from '@/lib/session';
import { DemoQr, QrScreen } from '@/screens/QrScreen';

// PG-602 내 QR
export default async function MyQr() {
  if (DEMO) return <DemoQr />;
  const session = await getSession();
  if (!session) redirect('/login');
  const profile = await getProfile(session.userId);
  if (!profile) redirect('/login');
  return <QrScreen me={{ id: profile.userId, displayName: profile.displayName }} />;
}
