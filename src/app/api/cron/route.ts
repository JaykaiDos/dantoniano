/**
 * GET /api/cron
 * Endpoint llamado por cron-job.org cada 2 minutos.
 * Verifica el estado de cada tarea en procesamiento y actualiza la DB.
 * Cuando todas las plataformas terminan, crea la reacción automáticamente.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Verifica estado en VOE */
async function checkVoe(fileCode: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.VOE_API_KEY;
    // VOE usa queueID para verificar el estado del remote upload
    const res  = await fetch(
      `https://voe.sx/api/upload/url/list?key=${key}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    const list = data?.list?.data ?? [];
    const entry = list.find((e: any) => e.file_code === fileCode);
    if (entry?.status === 3) { // status 3 = completado
      return { done: true, url: `https://voe.sx/e/${fileCode}` };
    }
    if (entry?.status === 4) { // status 4 = fallido
      return { done: true, url: null }; // done=true para no seguir intentando
    }
    return { done: false, url: null };
  } catch { return { done: false, url: null }; }
}

/** Verifica estado en Filemoon */
async function checkFilemoon(id: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.FILEMOON_API_KEY;
    const res  = await fetch(
      `https://filemoon.sx/api/file/info?key=${key}&file_id=${id}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    const file = data?.result?.[0];
    if (file?.status === 200 || file?.filecode) {
      return { done: true, url: `https://filemoon.sx/e/${file.filecode ?? id}` };
    }
    return { done: false, url: null };
  } catch { return { done: false, url: null }; }
}

/** Verifica estado en Doodstream */
async function checkDoodstream(filecode: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.DOODSTREAM_API_KEY;
    const res  = await fetch(
      `https://doodstream.com/api/file/info?key=${key}&file_id=${filecode}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    const file = data?.result?.[0];
    if (file?.status === 'active' || file?.canplay === 1) {
      return { done: true, url: `https://doodstream.com/d/${filecode}` };
    }
    return { done: false, url: null };
  } catch { return { done: false, url: null }; }
}

/** Verifica estado en SeekStreaming */
async function checkSeekStreaming(id: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.SEEKSTREAMING_API_KEY;
    const res  = await fetch(
      `https://seekstreaming.com/api/file/info?key=${key}&file_id=${id}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    const file = data?.result?.[0];
    if (file?.status === 200 || file?.filecode) {
      return { done: true, url: `https://seekstreaming.com/e/${file.filecode ?? id}` };
    }
    return { done: false, url: null };
  } catch { return { done: false, url: null }; }
}

export async function GET(req: NextRequest) {
  // Verificar secret del cron
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Traer tareas en procesamiento
  const { data: tasks } = await supabase
    .from('upload_tasks')
    .select('*')
    .eq('status', 'processing')
    .limit(20);

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const task of tasks) {
    const updates: Record<string, any> = {};

    // Verificar VOE
    if (task.voe_status === 'processing' && task.voe_remote_id) {
      const { done, url } = await checkVoe(task.voe_remote_id);
      if (done) {
        updates.voe_status = 'done';
        updates.voe_url    = url;
      }
    }

    // Verificar Filemoon
    if (task.filemoon_status === 'processing' && task.filemoon_remote_id) {
      const { done, url } = await checkFilemoon(task.filemoon_remote_id);
      if (done) {
        updates.filemoon_status = 'done';
        updates.filemoon_url    = url;
      }
    }

    // Verificar Doodstream
    if (task.doodstream_status === 'processing' && task.doodstream_remote_id) {
      const { done, url } = await checkDoodstream(task.doodstream_remote_id);
      if (done) {
        updates.doodstream_status = 'done';
        updates.doodstream_url    = url;
      }
    }

    // Verificar SeekStreaming
    if (task.seekstreaming_status === 'processing' && task.seekstreaming_remote_id) {
      const { done, url } = await checkSeekStreaming(task.seekstreaming_remote_id);
      if (done) {
        updates.seekstreaming_status = 'done';
        updates.seekstreaming_url    = url;
      }
    }

    if (Object.keys(updates).length > 0) {
      // Mergear con el estado actual de la tarea
      const mergedTask = { ...task, ...updates };

      // Verificar si todas las plataformas terminaron
      const statuses = [
        mergedTask.voe_status,
        mergedTask.filemoon_status,
        mergedTask.doodstream_status,
        mergedTask.seekstreaming_status,
      ];
      const allDone = statuses.every(s => s === 'done' || s === 'error' || s === 'skipped');
      const anyDone = statuses.some(s => s === 'done');

      if (allDone && anyDone) {
  if (task.reaction_id) {
    // Actualizar reacción existente
    const updateFields: Record<string, string | null> = {};
    if (mergedTask.voe_url)          updateFields.source_voe        = mergedTask.voe_url;
    if (mergedTask.filemoon_url)     updateFields.source_filemoon   = mergedTask.filemoon_url;
    if (mergedTask.doodstream_url)   updateFields.source_doodstream = mergedTask.doodstream_url;
    if (mergedTask.seekstreaming_url)updateFields.source_streamwish = mergedTask.seekstreaming_url;

    await supabase
      .from('reactions')
      .update(updateFields)
      .eq('id', task.reaction_id);
  } else {
    // Crear nueva reacción
    await supabase.from('reactions').insert({
      anime_id:          task.anime_id,
      episode_number:    task.episode_number,
      title:             task.title,
      duration:          task.duration,
      published_at:      task.published_at,
      youtube_url:       mergedTask.voe_url ?? mergedTask.filemoon_url ?? mergedTask.doodstream_url ?? mergedTask.seekstreaming_url,
      youtube_id:        'auto',
      thumbnail_url:     null,
      source_voe:        mergedTask.voe_url          ?? null,
      source_filemoon:   mergedTask.filemoon_url     ?? null,
      source_doodstream: mergedTask.doodstream_url   ?? null,
      source_streamwish: mergedTask.seekstreaming_url ?? null,
    });
  }
}

      await supabase
        .from('upload_tasks')
        .update(updates)
        .eq('id', task.id);

      processed++;
    }
  }

  return NextResponse.json({ ok: true, processed, tasks: tasks.length });
}