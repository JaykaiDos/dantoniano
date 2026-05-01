import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const UPLOAD_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

async function checkAuth() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return null;
}

function validateSourceUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return 'La URL debe usar HTTP o HTTPS';
    if (!parsed.hostname.includes('.')) return 'Hostname inválido';
    return null;
  } catch {
    return 'URL inválida — debe ser un link directo accesible';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = UPLOAD_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function startVoeUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  const key = process.env.VOE_API_KEY;
  if (!key) return { id: null, error: 'VOE_API_KEY no configurada' };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `https://voe.sx/api/upload/url?key=${key}&url=${encodeURIComponent(url)}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        const errMsg = `HTTP ${res.status}`;
        if (attempt < MAX_RETRIES && (res.status >= 500 || res.status === 429)) {
          console.log(`VOE retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: errMsg };
      }

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { return { id: null, error: `Respuesta inválida: ${text.substring(0, 80)}` }; }

      console.log('VOE response:', JSON.stringify(data).substring(0, 300));

      if (data?.status === 200 && data?.result?.file_code) {
        return { id: data.result.file_code, error: null };
      }

      return { id: null, error: data?.message ?? `Status ${data?.status}` };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const isAbort = e instanceof Error && e.name === 'AbortError';
      if (isAbort) {
        if (attempt < MAX_RETRIES) {
          console.log(`VOE timeout, retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: 'Timeout (60s)' };
      }
      if (attempt < MAX_RETRIES) {
        console.log(`VOE error retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      return { id: null, error: errMsg };
    }
  }
  return { id: null, error: 'Falló tras reintentos' };
}

const FILEMOON_API_BASES = [
  'https://api.byse.sx',
  'https://185.248.171.24',
];

async function fetchFilemoonApi(path: string, timeoutMs = UPLOAD_TIMEOUT_MS): Promise<Response> {
  let lastError: Error | null = null;
  for (const base of FILEMOON_API_BASES) {
    try {
      const headers: Record<string, string> = {};
      if (base.includes('185.248.171')) {
        headers['Host'] = 'api.byse.sx';
      }
      const res = await fetchWithTimeout(`${base}${path}`, { cache: 'no-store', headers }, timeoutMs);
      if (res.status === 403) {
        console.log(`Filemoon API base ${base} returned 403, trying next...`);
        lastError = new Error('HTTP 403');
        continue;
      }
      return res;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.log(`Filemoon API base ${base} failed, trying next...`);
    }
  }
  throw lastError ?? new Error('All Filemoon API bases failed');
}

async function startFilemoonUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  const key = process.env.FILEMOON_API_KEY;
  if (!key) return { id: null, error: 'FILEMOON_API_KEY no configurada' };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchFilemoonApi(`/remote/add?key=${key}&url=${encodeURIComponent(url)}`);

      if (!res.ok) {
        const errMsg = `HTTP ${res.status}`;
        if (attempt < MAX_RETRIES && (res.status >= 500 || res.status === 429)) {
          console.log(`Filemoon retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: errMsg };
      }

      const text = await res.text();
      console.log('Filemoon response:', text.substring(0, 300));

      let data;
      try { data = JSON.parse(text); }
      catch { return { id: null, error: `Respuesta inválida: ${text.substring(0, 80)}` }; }

      if (data?.status === 200 || data?.status === '200') {
        const filecode = data?.result?.filecode
          ?? data?.result?.[0]?.filecode
          ?? data?.result?.[0]?.id?.toString()
          ?? data?.result?.id?.toString()
          ?? null;
        return filecode
          ? { id: filecode, error: null }
          : { id: null, error: 'No se encontró filecode en la respuesta' };
      }

      return { id: null, error: data?.msg ?? `Status ${data?.status}` };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const isAbort = e instanceof Error && e.name === 'AbortError';
      if (isAbort) {
        if (attempt < MAX_RETRIES) {
          console.log(`Filemoon timeout, retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: 'Timeout (60s)' };
      }
      if (attempt < MAX_RETRIES) {
        console.log(`Filemoon error retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      return { id: null, error: errMsg };
    }
  }
  return { id: null, error: 'Falló tras reintentos' };
}

async function startDoodstreamUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  const key = process.env.DOODSTREAM_API_KEY;
  if (!key) return { id: null, error: 'DOODSTREAM_API_KEY no configurada' };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `https://doodapi.co/api/upload/url?key=${key}&url=${encodeURIComponent(url)}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        const errMsg = `HTTP ${res.status}`;
        if (attempt < MAX_RETRIES && (res.status >= 500 || res.status === 429)) {
          console.log(`Doodstream retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: errMsg };
      }

      const text = await res.text();
      console.log('Doodstream upload raw response:', text.substring(0, 500));

      let data;
      try { data = JSON.parse(text); }
      catch { return { id: null, error: `Invalid JSON: ${text.substring(0, 100)}` }; }

      if (data?.status === 200 || data?.status === '200') {
        const filecode = data?.result?.filecode ?? data?.filecode ?? null;
        if (filecode) {
          console.log('Doodstream upload success, filecode:', filecode);
          return { id: filecode, error: null };
        }
        return { id: null, error: 'No filecode en respuesta' };
      }

      return { id: null, error: data?.msg ?? data?.error ?? `Status: ${data?.status}` };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const isAbort = e instanceof Error && e.name === 'AbortError';
      if (isAbort) {
        if (attempt < MAX_RETRIES) {
          console.log(`Doodstream timeout, retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: 'Timeout (60s)' };
      }
      if (attempt < MAX_RETRIES) {
        console.log(`Doodstream error retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      return { id: null, error: errMsg };
    }
  }
  return { id: null, error: 'Falló tras reintentos' };
}

async function startSeekStreamingUpload(url: string): Promise<{ id: string | null; error: string | null }> {
  const key = process.env.SEEKSTREAMING_API_KEY;
  if (!key) return { id: null, error: 'SEEKSTREAMING_API_KEY no configurada' };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const requestBody = {
        url: url,
        name: (() => { try { return new URL(url).pathname.split('/').pop() || 'video'; } catch { return 'video'; } })()
      };

      console.log('SeekStreaming: Creating advance-upload task (attempt', attempt, ')...');
      const res = await fetchWithTimeout(
        `https://seekstreaming.com/api/v1/video/advance-upload`,
        {
          cache: 'no-store',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-token': key,
          },
          body: JSON.stringify(requestBody),
        },
        30_000
      );

      const text = await res.text();
      console.log('SeekStreaming raw response:', text.substring(0, 300));

      let data;
      try { data = JSON.parse(text); }
      catch { return { id: null, error: `Invalid JSON response: ${text.substring(0, 80)}` }; }

      if (res.status === 201 && data?.id) {
        console.log('SeekStreaming advance-upload task created:', data.id);
        return { id: data.id, error: null };
      }

      if (res.status === 401) {
        return { id: null, error: 'Authentication failed (401) — verificar API token' };
      }

      if (res.status === 429) {
        if (attempt < MAX_RETRIES) {
          console.log(`SeekStreaming rate limited, retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, attempt * 5000));
          continue;
        }
        return { id: null, error: 'Rate limit exceeded (429)' };
      }

      if (res.status >= 500) {
        if (attempt < MAX_RETRIES) {
          console.log(`SeekStreaming server error ${res.status}, retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
      }

      const errorMsg = data?.message ?? data?.error ?? `HTTP ${res.status}`;
      return { id: null, error: errorMsg };
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const isAbort = e instanceof Error && e.name === 'AbortError';
      if (isAbort) {
        if (attempt < MAX_RETRIES) {
          console.log(`SeekStreaming timeout, retry ${attempt}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        return { id: null, error: 'Timeout (30s)' };
      }
      if (attempt < MAX_RETRIES) {
        console.log(`SeekStreaming error retry ${attempt}/${MAX_RETRIES}: ${errMsg}`);
        await new Promise(r => setTimeout(r, attempt * 2000));
        continue;
      }
      return { id: null, error: errMsg };
    }
  }
  return { id: null, error: 'Falló tras reintentos' };
}

export async function POST(req: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const body = await req.json();
  const { anime_id, episode_number, title, duration, published_at, source_url, reaction_id, platforms } = body;

  if (!anime_id || !source_url || !title) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const urlError = validateSourceUrl(source_url);
  if (urlError) {
    return NextResponse.json({ error: `URL inválida: ${urlError}` }, { status: 400 });
  }

  const doVoe = !platforms || platforms.includes('voe');
  const doFilemoon = !platforms || platforms.includes('filemoon');
  const doDoodstream = !platforms || platforms.includes('doodstream');
  const doSeekstreaming = !platforms || platforms.includes('seekstreaming');

  const [voeRes, filemoonRes, doodstreamRes, seekstreamingRes] = await Promise.all([
    doVoe ? startVoeUpload(source_url) : Promise.resolve({ id: null, error: null }),
    doFilemoon ? startFilemoonUpload(source_url) : Promise.resolve({ id: null, error: null }),
    doDoodstream ? startDoodstreamUpload(source_url) : Promise.resolve({ id: null, error: null }),
    doSeekstreaming ? startSeekStreamingUpload(source_url) : Promise.resolve({ id: null, error: null }),
  ]);

  const voeStatus = !doVoe ? 'skipped' : voeRes.id ? 'processing' : 'error';
  const filemoonStatus = !doFilemoon ? 'skipped' : filemoonRes.id ? 'processing' : 'error';
  const doodstreamStatus = !doDoodstream ? 'skipped' : doodstreamRes.id ? 'processing' : 'error';
  const seekstreamingStatus = !doSeekstreaming ? 'skipped' : seekstreamingRes.id ? 'processing' : 'error';

  const allStatuses = [voeStatus, filemoonStatus, doodstreamStatus, seekstreamingStatus];
  const anyProcessing = allStatuses.includes('processing');
  const anySuccess = allStatuses.includes('processing') || allStatuses.includes('done');

  const taskStatus = !anyProcessing && !anySuccess ? 'error' : 'processing';

  const errorParts = [
    voeRes.error ? `VOE: ${voeRes.error}` : null,
    filemoonRes.error ? `Filemoon: ${filemoonRes.error}` : null,
    doodstreamRes.error ? `Doodstream: ${doodstreamRes.error}` : null,
    seekstreamingRes.error ? `SeekStreaming: ${seekstreamingRes.error}` : null,
  ].filter(Boolean);
  const errorMsg = errorParts.length > 0 ? errorParts.join(' | ') : null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('upload_tasks')
    .insert({
      anime_id,
      reaction_id: reaction_id ?? null,
      episode_number: episode_number || null,
      title,
      duration: duration || null,
      published_at: published_at || null,
      source_url,
      status: taskStatus,
      voe_remote_id: voeRes.id ?? null,
      filemoon_remote_id: filemoonRes.id ?? null,
      doodstream_remote_id: doodstreamRes.id ?? null,
      seekstreaming_remote_id: seekstreamingRes.id ?? null,
      voe_status: voeStatus,
      filemoon_status: filemoonStatus,
      doodstream_status: doodstreamStatus,
      seekstreaming_status: seekstreamingStatus,
      error_msg: errorMsg,
      check_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (taskStatus === 'error') {
    if (reaction_id) {
      const updateFields: Record<string, string | null> = {};
      if (voeRes.id) updateFields.source_voe = null;
      if (filemoonRes.id) updateFields.source_filemoon = null;
      if (doodstreamRes.id) updateFields.source_doodstream = null;
      if (seekstreamingRes.id) updateFields.source_streamwish = null;
    }
  }

  return NextResponse.json({
    ok: true,
    task: data,
    warnings: errorParts.length > 0 ? errorParts : undefined,
  }, { status: 201 });
}

export async function GET(_req: NextRequest) {
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
