import { createClient } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationsPage from './NotificationsPageClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPageWrapper() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const supabase = await createClient();
  const { data: notifications, error } = await supabase
    .from('youtube_notifications')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error al obtener notificaciones:', error);
  }

  return <NotificationsPage initialData={notifications || []} />;
}
