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
  const linkMatch = entry.match(/href="([^"]+)"/);
  if (!idMatch) return null;
  return {
    video_id: idMatch[1],
    title: titleMatch?.[1] ?? 'Nuevo video',
    published_at: publishedMatch?.[1] ?? new Date().toISOString(),
    url: linkMatch?.[1] || `https://www.youtube.com/watch?v=${idMatch[1]}`,
  };
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && challenge) {
    console.log('✅ Suscripción verificada con YouTube');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('youtube_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) {
    return NextResponse.json({ video: null });
  }
  return NextResponse.json({ video: { ...data, url: `https://www.youtube.com/watch?v=${data.video_id}`, } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const videoData = parseYouTubeFeed(body);
    if (videoData) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('youtube_notifications').upsert(
        { video_id: videoData.video_id, title: videoData.title, published_at: videoData.published_at },
        { onConflict: 'video_id' }
      );
      console.log(`🔔 Nuevo video guardado: ${videoData.title}`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}