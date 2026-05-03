import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const formData = await req.formData();
  const videoId = formData.get('video_id') as string;

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID requerido' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('youtube_notifications')
    .delete()
    .eq('video_id', videoId);

  if (error) {
    console.error('Error al eliminar notificación:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Redirigir de vuelta a la página de notificaciones
  return NextResponse.redirect(new URL('/admin/notificaciones', req.url));
}