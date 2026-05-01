/**
 * GET /api/cron
 * Endpoint llamado por cron-job.org cada 2 minutos.
 * Verifica el estado de cada tarea en procesamiento y actualiza la DB.
 * Cuando al menos una plataforma tiene URL y el resto terminó (done/error),
 * vincula la reacción automáticamente.
 *
 * Robustez:
 * - done+url=null se marca como error (no como done)
 * - check_count y MAX_CHECKS evitan que tareas se queden en processing infinitamente
 * - Vincula parcialmente si al menos 1 plataforma tiene URL y el resto ya terminó
 * - Actualiza error_msg y status global de la tarea
 * - Timeouts en todas las llamadas HTTP
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_CHECKS = 90;
const CHECK_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = CHECK_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkVoe(fileCode: string): Promise<{ done: boolean; url: string | null; error: string | null }> {
  const key = process.env.VOE_API_KEY;
  if (!key) return { done: true, url: null, error: 'VOE_API_KEY no configurada' };

  try {
    const res = await fetchWithTimeout(
      `https://voe.sx/api/upload/url/list?key=${key}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      if (res.status >= 500) return { done: false, url: null, error: null };
      return { done: true, url: null, error: `VOE API HTTP ${res.status}` };
    }

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch {
      console.log('VOE parse error:', text.substring(0, 200));
      return { done: false, url: null, error: null };
    }

    console.log('VOE list response:', JSON.stringify(data).substring(0, 500));

    const list = data?.list?.data ?? data?.data ?? [];
    type VoeEntry = { file_code?: string; id?: string; status?: number | string };
    const entry = list.find((e: VoeEntry) => e.file_code === fileCode || e.id === fileCode);

    console.log(`VOE searching for ${fileCode}, found entries: ${list.length}, match: ${entry ? 'YES' : 'NO'}`);

    if (!entry) {
      return { done: false, url: null, error: null };
    }

    if (entry?.status === 3 || entry?.status === '3') {
      return { done: true, url: `https://voe.sx/e/${fileCode}`, error: null };
    }
    if (entry?.status === 4 || entry?.status === '4') {
      return { done: true, url: null, error: 'Upload remoto fallido (status 4)' };
    }

    return { done: false, url: null, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('VOE check timeout');
      return { done: false, url: null, error: 'Timeout verificando VOE' };
    }
    console.error('VOE check error:', error);
    return { done: false, url: null, error: null };
  }
}

const FILEMOON_API_BASES = [
  'https://api.byse.sx',
  'http://185.248.171.24',
];

async function fetchFilemoonApi(path: string, timeoutMs = CHECK_TIMEOUT_MS): Promise<Response> {
  let lastError: Error | null = null;
  for (const base of FILEMOON_API_BASES) {
    try {
      const headers: Record<string, string> = {};
      if (base.startsWith('http://185.')) {
        headers['Host'] = 'api.byse.sx';
      }
      const res = await fetchWithTimeout(`${base}${path}`, { cache: 'no-store', headers }, timeoutMs);
      return res;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.log(`Filemoon API base ${base} failed, trying next...`);
    }
  }
  throw lastError ?? new Error('All Filemoon API bases failed');
}

async function checkFilemoon(filecode: string): Promise<{ done: boolean; url: string | null; error: string | null }> {
  const key = process.env.FILEMOON_API_KEY;
  if (!key) return { done: true, url: null, error: 'FILEMOON_API_KEY no configurada' };

  try {
    const res = await fetchFilemoonApi(`/remote/status?key=${key}&file_code=${filecode}`);

    if (!res.ok) {
      if (res.status >= 500) return { done: false, url: null, error: null };
      return { done: true, url: null, error: `Filemoon API HTTP ${res.status}` };
    }

    const text = await res.text();
    console.log('Filemoon status response:', text.substring(0, 300));

    let data;
    try { data = JSON.parse(text); }
    catch { return { done: false, url: null, error: null }; }

    if (data?.status !== 200 && data?.status !== '200') return { done: false, url: null, error: null };

    const entry = data?.result?.[0] ?? data?.result;
    const entryStatus = entry?.status;
    const entryFilecode = entry?.filecode ?? entry?.file_code ?? filecode;

    console.log(`Filemoon ${filecode} status: ${entryStatus}, filecode: ${entryFilecode}`);

    if (entryStatus === 'OK' || entryStatus === 200 || entryStatus === '200') {
      return { done: true, url: `https://filemoon.sx/e/${entryFilecode}`, error: null };
    }
    if (entryStatus === 'ERROR' || entryStatus === 4 || entryStatus === '4') {
      const errorMsg = entry?.error ?? 'Upload remoto fallido';
      return { done: true, url: null, error: errorMsg };
    }
    if (entry?.progress !== undefined && entryStatus !== 'OK' && entryStatus !== 'ERROR') {
      console.log(`Filemoon ${filecode} progress: ${entry.progress}%, status: ${entryStatus}`);
      return { done: false, url: null, error: null };
    }

    return { done: false, url: null, error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('Filemoon check timeout');
      return { done: false, url: null, error: 'Timeout verificando Filemoon' };
    }
    console.error('Filemoon check error:', message);
    return { done: false, url: null, error: null };
  }
}

async function checkDoodstream(filecode: string): Promise<{ done: boolean; url: string | null; error: string | null }> {
  const key = process.env.DOODSTREAM_API_KEY;
  if (!key) return { done: true, url: null, error: 'DOODSTREAM_API_KEY no configurada' };

  try {
    console.log(`Doodstream: checking status for file_code=${filecode}`);
    const res = await fetchWithTimeout(
      `https://doodapi.co/api/urlupload/status?key=${key}&file_code=${filecode}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      if (res.status >= 500) return { done: false, url: null, error: null };
      return { done: true, url: null, error: `Doodstream API HTTP ${res.status}` };
    }

    const text = await res.text();
    console.log(`Doodstream status response (${res.status}):`, text.substring(0, 300));

    if (!text || text.trim() === '') {
      console.log('Doodstream: empty response');
      return { done: false, url: null, error: null };
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return { done: false, url: null, error: null }; }

    const result = data?.result?.[0];

    if (!result) {
      console.log('Doodstream: result array empty, checking with file/check endpoint');
      try {
        const infoRes = await fetchWithTimeout(
          `https://doodapi.co/api/file/check?key=${key}&file_code=${filecode}`,
          { cache: 'no-store' }
        );
        const infoText = await infoRes.text();
        console.log('Doodstream file/check response:', infoText.substring(0, 200));
        const infoData = JSON.parse(infoText);
        if (infoData?.status === 'Active' || infoData?.filecode) {
          console.log('Doodstream: file confirmed as Active/Completed');
          return { done: true, url: `https://doodstream.com/d/${filecode}`, error: null };
        }
      } catch (e) {
        console.log('Doodstream file/check failed:', e instanceof Error ? e.message : 'unknown error');
      }

      console.log('Doodstream: assuming completed since not in list');
      return { done: true, url: `https://doodstream.com/d/${filecode}`, error: null };
    }

    const fileStatus = result?.status;
    console.log(`Doodstream ${filecode} status: "${fileStatus}"`);

    if (fileStatus === 'completed') {
      return { done: true, url: `https://doodstream.com/d/${filecode}`, error: null };
    }
    if (fileStatus === 'error') {
      return { done: true, url: null, error: 'Upload remoto fallido' };
    }
    if (fileStatus === 'working') {
      return { done: false, url: null, error: null };
    }

    console.log('Doodstream: unknown status', fileStatus);
    return { done: false, url: null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Doodstream check timeout');
      return { done: false, url: null, error: 'Timeout verificando Doodstream' };
    }
    console.error('Doodstream check error:', message);
    return { done: false, url: null, error: null };
  }
}

async function checkSeekStreaming(taskId: string): Promise<{ done: boolean; url: string | null; error: string | null }> {
  const key = process.env.SEEKSTREAMING_API_KEY;
  if (!key) return { done: true, url: null, error: 'SEEKSTREAMING_API_KEY no configurada' };

  try {
    console.log(`SeekStreaming: checking task status for taskId=${taskId}`);
    const res = await fetchWithTimeout(
      `https://seekstreaming.com/api/v1/video/advance-upload/${taskId}`,
      {
        cache: 'no-store',
        headers: { 'api-token': key },
      }
    );

    const text = await res.text();
    console.log('SeekStreaming task status response (' + res.status + '):', text.substring(0, 500));

    if (!text || text.trim() === '') {
      console.log('SeekStreaming: empty response');
      return { done: false, url: null, error: null };
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return { done: false, url: null, error: null }; }

    if (res.status === 404) {
      console.error('SeekStreaming: task not found (404)');
      return { done: true, url: null, error: 'Task not found (404)' };
    }

    if (res.status === 401) {
      return { done: true, url: null, error: 'Authentication failed (401)' };
    }

    if (res.status >= 500) {
      return { done: false, url: null, error: null };
    }

    const taskStatus = data?.status;
    console.log('SeekStreaming task status:', taskStatus);

    if (taskStatus === 'Completed') {
      const videos = data?.videos || [];
      console.log('SeekStreaming: task completed with', videos.length, 'videos');
      if (videos.length > 0) {
        const videoId = videos[0];
        const playerUrl = process.env.SEEKSTREAMING_PLAYER_URL || 'https://seekstreaming.com';
        const url = `${playerUrl}/#${videoId}`;
        console.log('SeekStreaming video ready at:', url);
        return { done: true, url, error: null };
      }
      return { done: true, url: null, error: 'Completado sin videos generados' };
    }

    if (taskStatus === 'Queued' || taskStatus === 'Processing') {
      return { done: false, url: null, error: null };
    }

    if (taskStatus === 'Failed' || taskStatus === 'Error') {
      return { done: true, url: null, error: data?.error || 'Task failed' };
    }

    console.log('SeekStreaming: unknown task status:', taskStatus);
    return { done: false, url: null, error: null };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    if (e instanceof Error && e.name === 'AbortError') {
      console.error('SeekStreaming check timeout');
      return { done: false, url: null, error: 'Timeout verificando SeekStreaming' };
    }
    console.error('SeekStreaming task check error:', errorMessage);
    return { done: false, url: null, error: null };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: tasks } = await supabase
    .from('upload_tasks')
    .select('*')
    .in('status', ['processing', 'pending'])
    .limit(20);

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const task of tasks) {
    const updates: Record<string, string | null> = {};
    const errorUpdates: string[] = [];

    const currentCheckCount = (task.check_count ?? 0) + 1;

    if (task.voe_status === 'processing' && task.voe_remote_id) {
      const { done, url, error } = await checkVoe(task.voe_remote_id);
      if (done && url) {
        updates.voe_status = 'done';
        updates.voe_url = url;
      } else if (done && !url) {
        updates.voe_status = 'error';
        if (error) errorUpdates.push(`VOE: ${error}`);
      }
    }

    if (task.filemoon_status === 'processing' && task.filemoon_remote_id) {
      const { done, url, error } = await checkFilemoon(task.filemoon_remote_id);
      if (done && url) {
        updates.filemoon_status = 'done';
        updates.filemoon_url = url;
      } else if (done && !url) {
        updates.filemoon_status = 'error';
        if (error) errorUpdates.push(`Filemoon: ${error}`);
      }
    }

    if (task.doodstream_status === 'processing' && task.doodstream_remote_id) {
      const { done, url, error } = await checkDoodstream(task.doodstream_remote_id);
      if (done && url) {
        updates.doodstream_status = 'done';
        updates.doodstream_url = url;
      } else if (done && !url) {
        updates.doodstream_status = 'error';
        if (error) errorUpdates.push(`Doodstream: ${error}`);
      }
    }

    if (task.seekstreaming_status === 'processing' && task.seekstreaming_remote_id) {
      const { done, url, error } = await checkSeekStreaming(task.seekstreaming_remote_id);
      if (done && url) {
        updates.seekstreaming_status = 'done';
        updates.seekstreaming_url = url;
      } else if (done && !url) {
        updates.seekstreaming_status = 'error';
        if (error) errorUpdates.push(`SeekStreaming: ${error}`);
      }
    }

    if (currentCheckCount >= MAX_CHECKS) {
      console.warn(`Task ${task.id}: MAX_CHECKS reached (${MAX_CHECKS}), marking stuck platforms as error`);
      const platFields: { statusField: string; name: string }[] = [
        { statusField: 'voe_status', name: 'VOE' },
        { statusField: 'filemoon_status', name: 'Filemoon' },
        { statusField: 'doodstream_status', name: 'Doodstream' },
        { statusField: 'seekstreaming_status', name: 'SeekStreaming' },
      ];
      for (const { statusField, name } of platFields) {
        const currentStatus = updates[statusField] ?? task[statusField];
        if (currentStatus === 'processing') {
          updates[statusField] = 'error';
          errorUpdates.push(`${name}: timeout tras ${MAX_CHECKS} verificaciones`);
        }
      }
    }

    const mergedTask = { ...task, ...updates };

    const statuses = [
      mergedTask.voe_status,
      mergedTask.filemoon_status,
      mergedTask.doodstream_status,
      mergedTask.seekstreaming_status,
    ];
    const allTerminal = statuses.every(s => s === 'done' || s === 'error' || s === 'skipped');
    const hasAnyUrl = !!(mergedTask.voe_url || mergedTask.filemoon_url || mergedTask.doodstream_url || mergedTask.seekstreaming_url);
    const hasAnyProcessing = statuses.some(s => s === 'processing');

    console.log(`Task ${task.id}: statuses=${JSON.stringify(statuses)}, allTerminal=${allTerminal}, hasAnyUrl=${hasAnyUrl}, checks=${currentCheckCount}`);

    let shouldLinkReaction = false;

    if (allTerminal && hasAnyUrl) {
      shouldLinkReaction = true;
    } else if (!hasAnyProcessing && hasAnyUrl) {
      shouldLinkReaction = true;
    } else if (allTerminal && !hasAnyUrl) {
      console.warn(`Task ${task.id}: all platforms finished but no URLs — will not link reaction`);
    }

    if (shouldLinkReaction) {
      const linkFields: Record<string, string | null> = {};
      if (mergedTask.voe_url) linkFields.source_voe = mergedTask.voe_url;
      if (mergedTask.filemoon_url) linkFields.source_filemoon = mergedTask.filemoon_url;
      if (mergedTask.doodstream_url) linkFields.source_doodstream = mergedTask.doodstream_url;
      if (mergedTask.seekstreaming_url) linkFields.source_streamwish = mergedTask.seekstreaming_url;

      if (task.reaction_id) {
        console.log('Updating reaction', task.reaction_id, 'with fields:', JSON.stringify(linkFields));
        const { error: updateError } = await supabase
          .from('reactions')
          .update(linkFields)
          .eq('id', task.reaction_id);

        if (updateError) {
          console.error('Error updating reaction:', updateError);
          errorUpdates.push(`Error vinculando reacción: ${updateError.message}`);
        } else {
          console.log('Reaction updated successfully');
        }
      } else {
        console.log('Creating new reaction for task:', task.id);
        const reactionData = {
          anime_id: task.anime_id,
          episode_number: task.episode_number,
          title: task.title,
          duration: task.duration,
          published_at: task.published_at,
          youtube_url: mergedTask.voe_url ?? mergedTask.filemoon_url ?? mergedTask.doodstream_url ?? mergedTask.seekstreaming_url,
          youtube_id: 'auto',
          thumbnail_url: null,
          source_voe: mergedTask.voe_url ?? null,
          source_filemoon: mergedTask.filemoon_url ?? null,
          source_doodstream: mergedTask.doodstream_url ?? null,
          source_streamwish: mergedTask.seekstreaming_url ?? null,
        };
        console.log('Reaction data:', JSON.stringify(reactionData).substring(0, 300));

        const { error: insertError } = await supabase.from('reactions').insert(reactionData);
        if (insertError) {
          console.error('Error creating reaction:', insertError);
          errorUpdates.push(`Error creando reacción: ${insertError.message}`);
        } else {
          console.log('Reaction created successfully');
        }
      }
    }

    const existingErrors = task.error_msg ? task.error_msg.split(' | ') : [];
    const allErrors = [...existingErrors, ...errorUpdates].filter(Boolean);
    const combinedErrorMsg = allErrors.length > 0 ? allErrors.join(' | ') : null;

    let taskStatus: string;
    if (allTerminal) {
      taskStatus = hasAnyUrl ? 'done' : 'error';
    } else if (shouldLinkReaction) {
      taskStatus = 'done';
    } else {
      taskStatus = 'processing';
    }

    const finalUpdates: Record<string, string | number | null> = {
      ...updates,
      status: taskStatus,
      error_msg: combinedErrorMsg,
      check_count: currentCheckCount,
    };

    if (taskStatus === 'done') {
      finalUpdates.completed_at = new Date().toISOString();
    }

    const { error: updateTaskError } = await supabase
      .from('upload_tasks')
      .update(finalUpdates)
      .eq('id', task.id);

    if (updateTaskError) {
      console.error(`Error updating task ${task.id}:`, updateTaskError);
    } else {
      processed++;
    }
  }

  return NextResponse.json({ ok: true, processed, tasks: tasks.length });
}
