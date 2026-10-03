import { NextRequest, NextResponse, after } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarPush, resolverSiteUrl } from '@/lib/fcm';

// El push corre dentro de after(): dejamos margen para enviar a todos los suscriptores.
export const maxDuration = 30;

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

  // 🚀 ENVIAR NOTIFICACIÓN PUSH
  // Se ejecuta DESPUÉS de responder, pero sostenida por after() (waitUntil en Vercel):
  // la instancia no se congela hasta que termine, así el envío no se pierde.
  if (data.anime_id && data.episode_number) {
    const origin = resolverSiteUrl(req.nextUrl.origin); // dantoniano.online, nunca el dominio viejo
    const { anime_id, episode_number, title, thumbnail_url } = data;

    after(async () => {
      // Primer log ANTES de cualquier await: si el push se dispara, siempre queda rastro.
      console.log('🔔 Disparando push de capítulo nuevo:', { anime_id, episode_number });
      await sendPushNotification(origin, anime_id, episode_number, title, thumbnail_url);
    });
  }

  return NextResponse.json(data, { status: 201 });
}

// Función para enviar notificación push (llamada directa, sin HTTP a la propia API)
async function sendPushNotification(
  origin: string,
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

    // 2. Enviar (solo suscriptos globales por ahora)
    const result = await enviarPush({
      title: `¡Nuevo Capítulo de ${animeTitle}!`,
      body: `Episodio ${episode_number}: ${episodeTitle || `Capítulo ${episode_number}`}`,
      url: `${origin}/animes/${anime_id}#${anime_id}`,
      image: thumbnail_url || cover_url,
      topics: ['global'],
    });

    console.log('✅ Notificación push enviada:', {
      sent: result.sent,
      failed: result.failed,
      tokens: result.tokens,
      removed: result.removed,
    });
  } catch (error) {
    // Nunca debe romper la respuesta del POST: ya se envió antes de llegar acá
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