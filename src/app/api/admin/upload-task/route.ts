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
    if (!key) {
      return { id: null, error: 'FILEMOON_API_KEY no configurada' };
    }
    
    const uploadUrl = `https://api.byse.sx/remote/add`;
    console.log('Filemoon upload URL (POST):', uploadUrl);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    console.log('Filemoon: attempting POST request...');
    
    // Build URL-encoded body manually to avoid URLSearchParams issues
    const body = `key=${encodeURIComponent(key)}&url=${encodeURIComponent(url)}`;
    console.log('Filemoon POST body length:', body.length);
    
    const res = await fetch(uploadUrl, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });
    clearTimeout(timeout);
    
    console.log('Filemoon: POST request completed with status:', res.status);
    const text = await res.text();
    console.log('Filemoon raw response:', text.substring(0, 300));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Filemoon JSON parse error:', parseErr, 'Response:', text.substring(0, 150));
      return { id: null, error: `Invalid response: ${text.substring(0, 80)}` };
    }
    
    // Filemoon returns status 200 with filecode in result
    if (data?.status === 200 || data?.status === '200') {
      const filecode = data?.result?.filecode ?? data?.filecode ?? null;
      if (filecode) {
        console.log('Filemoon upload successful, filecode:', filecode);
        return { id: filecode, error: null };
      }
      console.error('Filemoon: status 200 but no filecode found in response');
      return { id: null, error: 'No filecode en respuesta' };
    }
    
    const errorMsg = data?.msg ?? data?.error ?? `HTTP ${res.status}`;
    console.error('Filemoon error response:', errorMsg, 'Full data:', JSON.stringify(data).substring(0, 200));
    return { id: null, error: `Filemoon: ${errorMsg}` };
    
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.error('Filemoon request timeout');
      return { id: null, error: 'Timeout conectando a Filemoon (45s)' };
    }
    console.error('Filemoon upload error:', e.message, 'type:', e.constructor.name);
    return { id: null, error: `Filemoon: ${e.message}` };
  }
}

async function startDoodstreamUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const key = process.env.DOODSTREAM_API_KEY;
    const uploadUrl = `https://doodapi.co/api/upload/url?key=${key}&url=${encodeURIComponent(url)}`;
    console.log('Doodstream upload URL:', uploadUrl.replace(key!, 'KEY_HIDDEN'));
    
    const res  = await fetch(uploadUrl, {
      cache: 'no-store'
    });
    
    const text = await res.text();
    console.log('Doodstream upload raw response:', text.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Doodstream JSON parse error:', parseErr);
      return { id: null, error: `Invalid JSON: ${text.substring(0, 100)}` };
    }
    
    console.log('Doodstream parsed response:', JSON.stringify(data).substring(0, 300));
    
    if (data?.status === 200 || data?.status === '200') {
      const filecode = data?.result?.filecode ?? data?.filecode ?? null;
      if (filecode) {
        console.log('Doodstream upload success, filecode:', filecode);
        return { id: filecode, error: null };
      }
      return { id: null, error: 'No filecode en respuesta' };
    }
    
    return { id: null, error: data?.msg ?? data?.error ?? `Status: ${data?.status}` };
  } catch (e: any) {
    return { id: null, error: e.message };
  }
}

async function startSeekStreamingUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  try {
    const key = process.env.SEEKSTREAMING_API_KEY;
    if (!key) {
      return { id: null, error: 'SEEKSTREAMING_API_KEY no configurada' };
    }
    
    const uploadUrl = `https://seekstreaming.com/api/v1/video/advance-upload`;
    console.log('SeekStreaming: Creating advance-upload task...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // SeekStreaming v1 API uses task-based system
    const requestBody = {
      url: url,
      name: new URL(url).pathname.split('/').pop() || 'video'
    };
    
    console.log('SeekStreaming: POST request body:', JSON.stringify(requestBody));
    const res = await fetch(uploadUrl, {
      cache: 'no-store',
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': key,
      },
      body: JSON.stringify(requestBody),
    });
    clearTimeout(timeout);
    
    console.log('SeekStreaming: POST completed with status:', res.status);
    const text = await res.text();
    console.log('SeekStreaming raw response:', text.substring(0, 300));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('SeekStreaming JSON parse error:', parseErr);
      return { id: null, error: `Invalid JSON response: ${text.substring(0, 80)}` };
    }
    
    // SeekStreaming API v1 response: { "id": "task_id" }
    if (res.status === 201 && data?.id) {
      console.log('SeekStreaming advance-upload task created:', data.id);
      return { id: data.id, error: null };
    }
    
    if (res.status === 401) {
      console.error('SeekStreaming: Authentication failed - check API token');
      return { id: null, error: 'SeekStreaming: Authentication failed (401)' };
    }
    
    if (res.status === 429) {
      console.error('SeekStreaming: Rate limit exceeded');
      return { id: null, error: 'SeekStreaming: Rate limit exceeded (429)' };
    }
    
    const errorMsg = data?.message ?? data?.error ?? `HTTP ${res.status}`;
    console.error('SeekStreaming error response:', errorMsg);
    return { id: null, error: `SeekStreaming: ${errorMsg}` };
    
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.error('SeekStreaming request timeout');
      return { id: null, error: 'Timeout conectando a SeekStreaming (30s)' };
    }
    console.error('SeekStreaming upload error:', e.message, 'type:', e.constructor.name);
    return { id: null, error: `SeekStreaming: ${e.message}` };
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

export async function DELETE(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID de tarea requerido' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('upload_tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}