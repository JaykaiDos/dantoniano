import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { anime_id, episode_number, title, thumbnail_url } = await req.json();

    if (!anime_id || !episode_number) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Obtener datos del anime (slug, titulo)
    const supabase = createAdminClient();
    const { data: anime, error: animeError } = await supabase
      .from('animes')
      .select('slug, title')
      .eq('id', anime_id)
      .single();

    if (animeError || !anime) {
      return NextResponse.json({ error: 'Anime no encontrado' }, { status: 404 });
    }

    const { slug, title: animeTitle } = anime;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/temporadas/${slug}#${anime_id}`;

    // 2. Preparar notificación para OneSignal
    const notificationData = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      // Filtrado: Usuarios con tag 'interes'='todos' O 'seguimiento_anime'=slug
      filters: [
        { field: 'tag', key: 'interes', relation: '=', value: 'todos' },
        { operator: 'OR' },
        { field: 'tag', key: 'seguimiento_anime', relation: '=', value: slug },
      ],
      headings: { en: `¡Nuevo Capítulo de ${animeTitle}!` },
      contents: {
        en: `Se ha publicado el Episodio ${episode_number}: ${title}. ¡No te lo pierdas!`,
      },
      url: url,
      small_icon: '/icon.png',
      // Si tienes thumbnail_url, puedes enviarla como imagen grande
      ...(thumbnail_url && {
        chrome_web_image: thumbnail_url,
        ios_attachments: [{ id: 'image1', url: thumbnail_url }],
      }),
      data: {
        anime_id,
        episode_number,
        type: 'new_chapter',
      },
    };

    // 3. Enviar a OneSignal
    const response = await fetch(
      'https://onesignal.com/api/v1/notifications',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify(notificationData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OneSignal API Error:', errorText);
      return NextResponse.json(
        { error: 'Falló el envío a OneSignal' },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Notificación Push enviada:', result);

    return NextResponse.json({ success: true, message: 'Notificación enviada' });
  } catch (error) {
    console.error('Error en notify-chapter:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
