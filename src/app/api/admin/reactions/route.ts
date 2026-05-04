import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAuth() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return null;
}

export async function POST(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const body = await req.json();
  const supabase = createAdminClient();

  // Si no hay thumbnail y hay anime_id, usar la cover del anime
  if (!body.thumbnail_url && body.anime_id) {
    const { data: anime } = await supabase
      .from('animes')
      .select('cover_url')
      .eq('id', body.anime_id)
      .single();

    if (anime?.cover_url) {
      body.thumbnail_url = anime.cover_url;
    }
  }

  const { data, error } = await supabase.from('reactions').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // 🚀 ENVIAR NOTIFICACIÓN PUSH (asíncrono, no bloqueante)
  if (data.anime_id && data.episode_number) {
    sendPushNotification(data.anime_id, data.episode_number, data.title, data.thumbnail_url)
      .catch(err => console.error('Error enviando push notification:', err));
  }

  return NextResponse.json(data, { status: 201 });
}

// Función para enviar notificación push
async function sendPushNotification(
  anime_id: string,
  episode_number: number,
  episodeTitle: string | null,
  thumbnail_url: string | null
) {
  try {
    const supabase = createAdminClient();
    
    // 1. Obtener datos del anime
    const { data: anime, error: animeError } = await supabase
      .from('animes')
      .select('title, cover_url')
      .eq('id', anime_id)
      .single();

    if (animeError || !anime) {
      console.error('Error al obtener datos del anime:', animeError);
      return;
    }

    const { title: animeTitle, cover_url } = anime;
    const baseUrl = process.env.NEXTAUTH_URL || 'https://dantoniano.vercel.app';
    const url = `${baseUrl}/animes/${anime_id}#${anime_id}`;

    // 2. Preparar notificación (solo global por ahora)
    const notificationData = {
      title: `¡Nuevo Capítulo de ${animeTitle}!`,
      body: `Episodio ${episode_number}: ${episodeTitle || `Capítulo ${episode_number}`}`,
      url: url,
      image: thumbnail_url || cover_url,
      topics: ['global'] // Solo suscriptos globales
    };

    // 3. Enviar al endpoint de notificaciones
    const response = await fetch(`${baseUrl}/api/admin/send-firebase-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en send-firebase-notification:', errorText);
    } else {
      const result = await response.json();
      console.log('✅ Notificación push enviada:', result);
    }
  } catch (error) {
    console.error('Error enviando push notification:', error);
  }
}

export async function PUT(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const { id, ...body } = await req.json();
  const supabase = createAdminClient();

  // Mismo fix para edición
  if (!body.thumbnail_url && body.anime_id) {
    const { data: anime } = await supabase
      .from('animes')
      .select('cover_url')
      .eq('id', body.anime_id)
      .single();

    if (anime?.cover_url) {
      body.thumbnail_url = anime.cover_url;
    }
  }

  const { data, error } = await supabase.from('reactions').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;
  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from('reactions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
