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

  // 🚀 DISPARAR NOTIFICACIÓN PUSH (asíncrono, no bloqueante)
  if (data.anime_id && data.episode_number) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app');
    fetch(`${baseUrl}/api/admin/notify-chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anime_id: data.anime_id,
        episode_number: data.episode_number,
        title: data.title || `Episodio ${data.episode_number}`,
        thumbnail_url: data.thumbnail_url || body.thumbnail_url,
      }),
    }).catch(err => console.error('Error enviando push notification:', err));
  }

  return NextResponse.json(data, { status: 201 });
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
