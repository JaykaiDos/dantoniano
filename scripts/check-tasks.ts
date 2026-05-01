import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const MAX_CHECKS = 90;
const CHECK_TIMEOUT_MS = 30_000;

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

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
    const res = await fetchWithTimeout(`https://voe.sx/api/upload/url/list?key=${key}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status >= 500) return { done: false, url: null, error: null };
      return { done: true, url: null, error: `VOE API HTTP ${res.status}` };
    }
    const data = await res.json();
    const list = data?.list?.data ?? data?.data ?? [];
    type VoeEntry = { file_code?: string; id?: string; status?: number | string };
    const entry = list.find((e: VoeEntry) => e.file_code === fileCode || e.id === fileCode);
    if (!entry) return { done: false, url: null, error: null };
    if (entry?.status === 3 || entry?.status === '3') return { done: true, url: `https://voe.sx/e/${fileCode}`, error: null };
    if (entry?.status === 4 || entry?.status === '4') return { done: true, url: null, error: 'Upload remoto fallido (status 4)' };
    return { done: false, url: null, error: null };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return { done: false, url: null, error: 'Timeout' };
    return { done: false, url: null, error: null };
  }
}

const FILEMOON_API_BASES = ['https://api.byse.sx', 'https://185.248.171.24'];

async function fetchFilemoonApi(path: string, timeoutMs = CHECK_TIMEOUT_MS): Promise<Response> {
  let lastError: Error | null = null;
  for (const base of FILEMOON_API_BASES) {
    try {
      const headers: Record<string, string> = {};
      if (base.includes('185.248.171')) headers['Host'] = 'api.byse.sx';
      const res = await fetchWithTimeout(`${base}${path}`, { cache: 'no-store', headers }, timeoutMs);
      if (res.status === 403) { lastError = new Error('HTTP 403'); continue; }
      return res;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e));
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
    const data = await res.json();
    if (data?.status !== 200 && data?.status !== '200') return { done: false, url: null, error: null };
    const result = data?.result;
    if (Array.isArray(result) && result.length === 0) {
      try {
        const infoRes = await fetchFilemoonApi(`/file/info?key=${key}&file_code=${filecode}`);
        const infoData = await infoRes.json();
        const fileInfo = infoData?.result?.[0] ?? infoData?.result;
        if (fileInfo?.canplay === 1 || fileInfo?.status === 200) {
          return { done: true, url: `https://filemoon.sx/e/${filecode}`, error: null };
        }
      } catch { /* ignore */ }
      return { done: true, url: `https://filemoon.sx/e/${filecode}`, error: null };
    }
    const entry = result?.[0] ?? result;
    const entryStatus = entry?.status;
    const entryFilecode = entry?.filecode ?? entry?.file_code ?? filecode;
    if (entryStatus === 'OK' || entryStatus === 200 || entryStatus === '200') return { done: true, url: `https://filemoon.sx/e/${entryFilecode}`, error: null };
    if (entryStatus === 'ERROR' || entryStatus === 4 || entryStatus === '4') return { done: true, url: null, error: entry?.error ?? 'Upload remoto fallido' };
    return { done: false, url: null, error: null };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return { done: false, url: null, error: 'Timeout' };
    return { done: false, url: null, error: null };
  }
}

async function checkDoodstream(filecode: string): Promise<{ done: boolean; url: string | null; error: string | null }> {
  const key = process.env.DOODSTREAM_API_KEY;
  if (!key) return { done: true, url: null, error: 'DOODSTREAM_API_KEY no configurada' };

  try {
    const res = await fetchWithTimeout(`https://doodapi.co/api/urlupload/status?key=${key}&file_code=${filecode}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status >= 500) return { done: false, url: null, error: null };
      return { done: true, url: null, error: `Doodstream API HTTP ${res.status}` };
    }
    const text = await res.text();
    if (!text || text.trim() === '') return { done: false, url: null, error: null };
    const data = JSON.parse(text);
    const result = data?.result?.[0];
    if (!result) {
      try {
        const infoRes = await fetchWithTimeout(`https://doodapi.co/api/file/check?key=${key}&file_code=${filecode}`, { cache: 'no-store' });
        const infoData = await infoRes.json();
        if (infoData?.status === 'Active' || infoData?.filecode) return { done: true, url: `https://doodstream.com/d/${filecode}`, error: null };
      } catch { /* ignore */ }
      return { done: true, url: `https://doodstream.com/d/${filecode}`, error: null };
    }
    const fileStatus = result?.status;
    if (fileStatus === 'completed') return { done: true, url: `https://doodstream.com/d/${filecode}`, error: null };
    if (fileStatus === 'error') return { done: true, url: null, error: 'Upload remoto fallido' };
    if (fileStatus === 'working') return { done: false, url: null, error: null };
    return { done: false, url: null, error: null };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return { done: false, url: null, error: 'Timeout' };
    return { done: false, url: null, error: null };
  }
}

async function checkSeekStreaming(taskId: string): Promise<{ done: boolean; url: string | null; error: string | null }> {
  const key = process.env.SEEKSTREAMING_API_KEY;
  if (!key) return { done: true, url: null, error: 'SEEKSTREAMING_API_KEY no configurada' };

  try {
    const res = await fetchWithTimeout(`https://seekstreaming.com/api/v1/video/advance-upload/${taskId}`, { cache: 'no-store', headers: { 'api-token': key } });
    if (res.status === 404) return { done: true, url: null, error: 'Task not found (404)' };
    if (res.status === 401) return { done: true, url: null, error: 'Authentication failed (401)' };
    if (res.status >= 500) return { done: false, url: null, error: null };
    const text = await res.text();
    if (!text || text.trim() === '') return { done: false, url: null, error: null };
    const data = JSON.parse(text);
    const taskStatus = data?.status;
    if (taskStatus === 'Completed') {
      const videos = data?.videos || [];
      if (videos.length > 0) {
        const playerUrl = process.env.SEEKSTREAMING_PLAYER_URL || 'https://seekstreaming.com';
        return { done: true, url: `${playerUrl}/#${videos[0]}`, error: null };
      }
      return { done: true, url: null, error: 'Completado sin videos generados' };
    }
    if (taskStatus === 'Queued' || taskStatus === 'Processing') return { done: false, url: null, error: null };
    if (taskStatus === 'Failed' || taskStatus === 'Error') return { done: true, url: null, error: data?.error || 'Task failed' };
    return { done: false, url: null, error: null };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return { done: false, url: null, error: 'Timeout' };
    return { done: false, url: null, error: null };
  }
}

async function main() {
  console.log('🔍 Verificando tareas de upload...\n');
  const supabase = createAdminClient();

  const { data: tasks, error: fetchError } = await supabase
    .from('upload_tasks')
    .select('*')
    .in('status', ['processing', 'pending'])
    .limit(20);

  if (fetchError) { console.error('❌ Error fetching tasks:', fetchError); process.exit(1); }
  if (!tasks || tasks.length === 0) { console.log('✅ No hay tareas activas.'); return; }

  console.log(`📋 Encontradas ${tasks.length} tareas activas\n`);

  let processed = 0;

  for (const task of tasks) {
    console.log(`─`.repeat(50));
    console.log(`📌 ${task.title} (status: ${task.status}, checks: ${task.check_count ?? 0})`);

    const updates: Record<string, string | null> = {};
    const errorUpdates: string[] = [];
    const currentCheckCount = (task.check_count ?? 0) + 1;

    if (task.voe_status === 'processing' && task.voe_remote_id) {
      process.stdout.write('  🔺 VOE: ');
      const { done, url, error } = await checkVoe(task.voe_remote_id);
      if (done && url) { updates.voe_status = 'done'; updates.voe_url = url; console.log(`✅ ${url}`); }
      else if (done && !url) { updates.voe_status = 'error'; if (error) errorUpdates.push(`VOE: ${error}`); console.log(`❌ ${error}`); }
      else { console.log(`⏳ procesando...`); }
    }

    if (task.filemoon_status === 'processing' && task.filemoon_remote_id) {
      process.stdout.write('  🌙 Filemoon: ');
      const { done, url, error } = await checkFilemoon(task.filemoon_remote_id);
      if (done && url) { updates.filemoon_status = 'done'; updates.filemoon_url = url; console.log(`✅ ${url}`); }
      else if (done && !url) { updates.filemoon_status = 'error'; if (error) errorUpdates.push(`Filemoon: ${error}`); console.log(`❌ ${error}`); }
      else { console.log(`⏳ procesando...`); }
    }

    if (task.doodstream_status === 'processing' && task.doodstream_remote_id) {
      process.stdout.write('  🎞 Doodstream: ');
      const { done, url, error } = await checkDoodstream(task.doodstream_remote_id);
      if (done && url) { updates.doodstream_status = 'done'; updates.doodstream_url = url; console.log(`✅ ${url}`); }
      else if (done && !url) { updates.doodstream_status = 'error'; if (error) errorUpdates.push(`Doodstream: ${error}`); console.log(`❌ ${error}`); }
      else { console.log(`⏳ procesando...`); }
    }

    if (task.seekstreaming_status === 'processing' && task.seekstreaming_remote_id) {
      process.stdout.write('  ⭐ SeekStreaming: ');
      const { done, url, error } = await checkSeekStreaming(task.seekstreaming_remote_id);
      if (done && url) { updates.seekstreaming_status = 'done'; updates.seekstreaming_url = url; console.log(`✅ ${url}`); }
      else if (done && !url) { updates.seekstreaming_status = 'error'; if (error) errorUpdates.push(`SeekStreaming: ${error}`); console.log(`❌ ${error}`); }
      else { console.log(`⏳ procesando...`); }
    }

    if (currentCheckCount >= MAX_CHECKS) {
      const platFields = [
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
    const statuses = [mergedTask.voe_status, mergedTask.filemoon_status, mergedTask.doodstream_status, mergedTask.seekstreaming_status];
    const allTerminal = statuses.every(s => s === 'done' || s === 'error' || s === 'skipped');
    const hasAnyUrl = !!(mergedTask.voe_url || mergedTask.filemoon_url || mergedTask.doodstream_url || mergedTask.seekstreaming_url);
    const hasAnyProcessing = statuses.some(s => s === 'processing');

    let shouldLinkReaction = false;
    if ((allTerminal && hasAnyUrl) || (!hasAnyProcessing && hasAnyUrl)) shouldLinkReaction = true;

    if (shouldLinkReaction) {
      const linkFields: Record<string, string | null> = {};
      if (mergedTask.voe_url) linkFields.source_voe = mergedTask.voe_url;
      if (mergedTask.filemoon_url) linkFields.source_filemoon = mergedTask.filemoon_url;
      if (mergedTask.doodstream_url) linkFields.source_doodstream = mergedTask.doodstream_url;
      if (mergedTask.seekstreaming_url) linkFields.source_streamwish = mergedTask.seekstreaming_url;

      if (task.reaction_id) {
        console.log(`  🔗 Vinculando reacción ${task.reaction_id}...`);
        const { error: updateError } = await supabase.from('reactions').update(linkFields).eq('id', task.reaction_id);
        if (updateError) { console.log(`  ❌ Error vinculando: ${updateError.message}`); errorUpdates.push(`Error vinculando: ${updateError.message}`); }
        else console.log('  ✅ Reacción vinculada');
      } else {
        console.log('  🔗 Creando nueva reacción...');
        const reactionData = {
          anime_id: task.anime_id, episode_number: task.episode_number, title: task.title,
          duration: task.duration, published_at: task.published_at,
          youtube_url: mergedTask.voe_url ?? mergedTask.filemoon_url ?? mergedTask.doodstream_url ?? mergedTask.seekstreaming_url,
          youtube_id: 'auto', thumbnail_url: null,
          source_voe: mergedTask.voe_url ?? null, source_filemoon: mergedTask.filemoon_url ?? null,
          source_doodstream: mergedTask.doodstream_url ?? null, source_streamwish: mergedTask.seekstreaming_url ?? null,
        };
        const { error: insertError } = await supabase.from('reactions').insert(reactionData);
        if (insertError) { console.log(`  ❌ Error creando: ${insertError.message}`); errorUpdates.push(`Error creando reacción: ${insertError.message}`); }
        else console.log('  ✅ Reacción creada');
      }
    }

    const existingErrors = task.error_msg ? task.error_msg.split(' | ') : [];
    const allErrors = [...existingErrors, ...errorUpdates].filter(Boolean);
    const combinedErrorMsg = allErrors.length > 0 ? allErrors.join(' | ') : null;

    let taskStatus: string;
    if (allTerminal) taskStatus = hasAnyUrl ? 'done' : 'error';
    else if (shouldLinkReaction) taskStatus = 'done';
    else taskStatus = 'processing';

    const finalUpdates: Record<string, string | number | null> = {
      ...updates, status: taskStatus, error_msg: combinedErrorMsg, check_count: currentCheckCount,
    };
    if (taskStatus === 'done') finalUpdates.completed_at = new Date().toISOString();

    const { error: updateTaskError } = await supabase.from('upload_tasks').update(finalUpdates).eq('id', task.id);
    if (updateTaskError) console.log(`  ❌ Error actualizando tarea: ${updateTaskError.message}`);
    else { processed++; console.log(`  📊 Estado: ${taskStatus.toUpperCase()}`); }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Listo. ${processed}/${tasks.length} tareas actualizadas.`);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
