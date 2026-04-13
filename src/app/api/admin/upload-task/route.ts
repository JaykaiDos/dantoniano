/**
 * POST /api/admin/upload-task
 * Encola una nueva tarea de subida desatendida.
 * Lanza el remote upload a todas las plataformas y guarda los Remote IDs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAuth() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return null;
}

/** Lanza remote upload a VOE */
async function startVoeUpload(url: string): Promise<string | null> {
  try {
    const key = process.env.VOE_API_KEY;
    const res  = await fetch(
      `https://voe.sx/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data?.result?.file_code ?? data?.file_code ?? null;
  } catch { return null; }
}

/** Lanza remote upload a Filemoon */
async function startFilemoonUpload(url: string): Promise<string | null> {
  try {
    const key = process.env.FILEMOON_API_KEY;
    const res  = await fetch(
      `https://filemoon.sx/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data?.result?.[0]?.id?.toString() ?? null;
  } catch { return null; }
}

/** Lanza remote upload a Doodstream */
async function startDoodstreamUpload(url: string): Promise<string | null> {
  try {
    const key = process.env.DOODSTREAM_API_KEY;
    const res  = await fetch(
      `https://doodstream.com/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data?.result?.filecode ?? null;
  } catch { return null; }
}

/** Lanza remote upload a SeekStreaming */
async function startSeekStreamingUpload(url: string): Promise<string | null> {
  try {
    const key = process.env.SEEKSTREAMING_API_KEY;
    const res  = await fetch(
      `https://seekstreaming.com/api/remote/add?key=${key}&url=${encodeURIComponent(url)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return data?.result?.[0]?.id?.toString() ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const body = await req.json();
  const { anime_id, episode_number, title, duration, published_at, source_url, reaction_id, platforms } = body;

  if (!anime_id || !source_url || !title) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Determinar qué plataformas procesar
  const doVoe           = !platforms || platforms.includes('voe');
  const doFilemoon      = !platforms || platforms.includes('filemoon');
  const doDoodstream    = !platforms || platforms.includes('doodstream');
  const doSeekstreaming = !platforms || platforms.includes('seekstreaming');

  // Lanzar solo las plataformas necesarias en paralelo
  const [voeId, filemoonId, doodstreamId, seekstreamingId] = await Promise.all([
    doVoe           ? startVoeUpload(source_url)           : Promise.resolve(null),
    doFilemoon      ? startFilemoonUpload(source_url)      : Promise.resolve(null),
    doDoodstream    ? startDoodstreamUpload(source_url)    : Promise.resolve(null),
    doSeekstreaming ? startSeekStreamingUpload(source_url) : Promise.resolve(null),
  ]);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upload_tasks')
    .insert({
      anime_id,
      reaction_id:     reaction_id              ?? null,
      episode_number:  episode_number           || null,
      title,
      duration:        duration                 || null,
      published_at:    published_at             || null,
      source_url,
      status:          'processing',
      voe_remote_id:           voeId           ?? null,
      filemoon_remote_id:      filemoonId      ?? null,
      doodstream_remote_id:    doodstreamId    ?? null,
      seekstreaming_remote_id: seekstreamingId ?? null,
      voe_status:          !doVoe           ? 'skipped' : voeId           ? 'processing' : 'error',
      filemoon_status:     !doFilemoon      ? 'skipped' : filemoonId      ? 'processing' : 'error',
      doodstream_status:   !doDoodstream    ? 'skipped' : doodstreamId    ? 'processing' : 'error',
      seekstreaming_status:!doSeekstreaming ? 'skipped' : seekstreamingId ? 'processing' : 'error',
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