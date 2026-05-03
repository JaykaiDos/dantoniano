import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function parseYouTubeFeed(xml: string) {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) return null;
  const entry = entryMatch[1];
  const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
  const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
  const channelMatch = xml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/);
  const linkMatch = entry.match(/href="([^"]+)"/);
  if (!idMatch) return null;
  return {
    channel_id: channelMatch?.[1] ?? 'unknown',
    video_id: idMatch[1],
    title: titleMatch?.[1] ?? 'Nuevo video',
    published_at: publishedMatch?.[1] ?? new Date().toISOString(),
    url: linkMatch?.[1] || `https://www.youtube.com/watch?v=${idMatch[1]}`,
  };
}

// GET: Verificación de PubSubHubbub Y consulta del cliente
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  // 1. Verificación de suscripción (Google PubSubHubbub)
  if (mode === 'subscribe' && challenge) {
    console.log('✅ Suscripción verificada con YouTube');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  // 2. Cliente pide los últimos videos
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 3;

  const supabase = createClient(supabaseUrl, supabaseKey);
  let query = supabase
    .from('youtube_notifications')
    .select('*')
    .order('published_at', { ascending: false });

  const { data, error } = await query;

  if (error || !data) {
    return NextResponse.json({ videos: [] });
  }

  // Devolver solo los últimos N videos
  const latestVideos = data.slice(0, limit).map((video) => ({
    ...video,
    url: `https://www.youtube.com/watch?v=${video.video_id}`,
  }));

  return NextResponse.json({ videos: latestVideos });
}

// POST: YouTube notifica nuevo video
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const videoData = parseYouTubeFeed(body);

    if (videoData) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Insertar o ignorar si ya existe (unique constraint en channel_id + video_id)
      const { error } = await supabase.from('youtube_notifications').upsert(
        {
          channel_id: videoData.channel_id,
          video_id: videoData.video_id,
          title: videoData.title,
          published_at: videoData.published_at,
        },
        { onConflict: 'channel_id,video_id' }
      );

      if (error) {
        console.error('Error al guardar notificación:', error.message);
      } else {
        console.log(`🔔 Nuevo video de ${videoData.channel_id}: ${videoData.title}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}