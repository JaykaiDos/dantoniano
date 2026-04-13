import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAuth() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return null;
}

async function startVoeUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const key = process.env.VOE_API_KEY;
    const res  = await fetch(
      `https://voe.sx/api/upload/url?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    console.log('VOE response:', JSON.stringify(data));
    if (data?.status === 200 && data?.result?.file_code) {
      return { id: data.result.file_code, error: null };
    }
    return { id: null, error: data?.message ?? 'Sin respuesta' };
  } catch (e: any) {
    return { id: null, error: e.message };
  }
}

async function startFilemoonUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const key = process.env.FILEMOON_API_KEY;
    const res  = await fetch(
      `https://filemoon.sx/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    console.log('Filemoon response:', JSON.stringify(data));
    if (data?.status === 200) {
      const id = data?.result?.[0]?.id?.toString() ?? data?.result?.id?.toString() ?? null;
      return { id, error: id ? null : 'ID no encontrado' };
    }
    return { id: null, error: data?.msg ?? 'Sin respuesta' };
  } catch (e: any) {
    return { id: null, error: e.message };
  }
}

async function startDoodstreamUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const key = process.env.DOODSTREAM_API_KEY;
    const res  = await fetch(
      `https://doodstream.com/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    console.log('Doodstream response:', JSON.stringify(data));
    if (data?.status === 200) {
      const id = data?.result?.filecode ?? null;
      return { id, error: id ? null : 'Filecode no encontrado' };
    }
    return { id: null, error: data?.msg ?? 'Sin respuesta' };
  } catch (e: any) {
    return { id: null, error: e.message };
  }
}

async function startSeekStreamingUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const key = process.env.SEEKSTREAMING_API_KEY;
    const res  = await fetch(
      `https://seekstreaming.com/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    console.log('SeekStreaming response:', JSON.stringify(data));
    if (data?.status === 200) {
      const id = data?.result?.[0]?.id?.toString() ?? data?.result?.id?.toString() ?? null;
      return { id, error: id ? null : 'ID no encontrado' };
    }
    return { id: null, error: data?.msg ?? 'Sin respuesta' };
  } catch (e: any) {
    return { id: null, error: e.message };
  }
}

export async function POST(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const body = await req.json();
  const { anime_id, episode_number, title, duration, published_at, source_url, reaction_id, platforms } = body;

  if (!anime_id || !source_url || !title) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const doVoe           = !platforms || platforms.includes('voe');
  const doFilemoon      = !platforms || platforms.includes('filemoon');
  const doDoodstream    = !platforms || platforms.includes('doodstream');
  const doSeekstreaming = !platforms || platforms.includes('seekstreaming');

  const [voeRes, filemoonRes, doodstreamRes, seekstreamingRes] = await Promise.all([
    doVoe           ? startVoeUpload(source_url)           : Promise.resolve({ id: null, error: null }),
    doFilemoon      ? startFilemoonUpload(source_url)      : Promise.resolve({ id: null, error: null }),
    doDoodstream    ? startDoodstreamUpload(source_url)    : Promise.resolve({ id: null, error: null }),
    doSeekstreaming ? startSeekStreamingUpload(source_url) : Promise.resolve({ id: null, error: null }),
  ]);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upload_tasks')
    .insert({
      anime_id,
      reaction_id:     reaction_id     ?? null,
      episode_number:  episode_number  || null,
      title,
      duration:        duration        || null,
      published_at:    published_at    || null,
      source_url,
      status:          'processing',
      voe_remote_id:           voeRes.id           ?? null,
      filemoon_remote_id:      filemoonRes.id      ?? null,
      doodstream_remote_id:    doodstreamRes.id    ?? null,
      seekstreaming_remote_id: seekstreamingRes.id ?? null,
      voe_status:          !doVoe           ? 'skipped' : voeRes.id           ? 'processing' : 'error',
      filemoon_status:     !doFilemoon      ? 'skipped' : filemoonRes.id      ? 'processing' : 'error',
      doodstream_status:   !doDoodstream    ? 'skipped' : doodstreamRes.id    ? 'processing' : 'error',
      seekstreaming_status:!doSeekstreaming ? 'skipped' : seekstreamingRes.id ? 'processing' : 'error',
      error_msg: [
        voeRes.error           ? `VOE: ${voeRes.error}`                   : null,
        filemoonRes.error      ? `Filemoon: ${filemoonRes.error}`          : null,
        doodstreamRes.error    ? `Doodstream: ${doodstreamRes.error}`      : null,
        seekstreamingRes.error ? `SeekStreaming: ${seekstreamingRes.error}` : null,
      ].filter(Boolean).join(' | ') || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, task: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('upload_tasks')
    .select('*, anime:animes(title)')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json(data ?? []);
}