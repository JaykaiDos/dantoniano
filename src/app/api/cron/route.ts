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
    // VOE usa file_code para verificar el estado del remote upload
    const res  = await fetch(
      `https://voe.sx/api/upload/url/list?key=${key}`,
      { cache: 'no-store' }
    );
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log('VOE parse error:', text.substring(0, 200));
      return { done: false, url: null };
    }
    console.log('VOE list response:', JSON.stringify(data).substring(0, 500));
    const list = data?.list?.data ?? data?.data ?? [];
    const entry = list.find((e: any) => e.file_code === fileCode || e.id === fileCode);
    console.log(`VOE searching for ${fileCode}, found entries: ${list.length}, match: ${entry ? 'YES' : 'NO'}`);
    if (entry?.status === 3 || entry?.status === '3') { // status 3 = completado
      return { done: true, url: `https://voe.sx/e/${fileCode}` };
    }
    if (entry?.status === 4 || entry?.status === '4') { // status 4 = fallido
      return { done: true, url: null }; // done=true para no seguir intentando
    }
    return { done: false, url: null };
  } catch (e: any) {
    console.error('VOE check error:', e.message);
    return { done: false, url: null };
  }
}
  
/** Verifica estado en Filemoon */
async function checkFilemoon(id: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.FILEMOON_API_KEY;
    const res  = await fetch(
      `https://api.byse.sx/remote/status?key=${key}&file_code=${id}`,
      { cache: 'no-store' }
    );
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log('Filemoon parse error:', text.substring(0, 200));
      return { done: false, url: null };
    }
    // Status: COMPLETED, WORKING, FAILED, QUEUED
    if (data?.status === 'COMPLETED') {
      return { done: true, url: `https://filemoon.sx/e/${id}` };
    }
    if (data?.status === 'FAILED') {
      return { done: true, url: null };
    }
    return { done: false, url: null };
  } catch (e: any) {
    console.error('Filemoon check error:', e.message);
    return { done: false, url: null };
  }
}

/** Verifica estado en Doodstream */
async function checkDoodstream(filecode: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.DOODSTREAM_API_KEY;
    
    // Use the specific file_code endpoint
    console.log(`Doodstream: checking status for file_code=${filecode}`);
    const res  = await fetch(
      `https://doodapi.co/api/urlupload/status?key=${key}&file_code=${filecode}`,
      { cache: 'no-store' }
    );
    
    const text = await res.text();
    console.log(`Doodstream status response (${res.status}):`, text.substring(0, 300));
    
    if (!text || text.trim() === '') {
      console.log('Doodstream: empty response');
      return { done: false, url: null };
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Doodstream parse error:', parseErr);
      return { done: false, url: null };
    }
    
    // Response format: { status: 200, result: [ { status: "working|completed|error", file_code: "xxx" } ] }
    const result = data?.result?.[0];
    
    // If result array is empty, it means the file was already processed and removed from queue
    // Try to fetch file info to confirm it exists
    if (!result) {
      console.log('Doodstream: result array empty, checking with file/info endpoint');
      
      try {
        const infoRes = await fetch(
          `https://doodapi.co/api/file/check?key=${key}&file_code=${filecode}`,
          { cache: 'no-store' }
        );
        const infoText = await infoRes.text();
        console.log('Doodstream file/check response:', infoText.substring(0, 200));
        
        let infoData = JSON.parse(infoText);
        if (infoData?.status === 'Active' || infoData?.filecode) {
          console.log('Doodstream: file confirmed as Active/Completed');
          return { done: true, url: `https://doodstream.com/d/${filecode}` };
        }
      } catch (e) {
        console.log('Doodstream file/check failed:', e instanceof Error ? e.message : 'unknown error');
      }
      
      // If both endpoints fail, assume it's completed (safer than keeping it in processing forever)
      console.log('Doodstream: assuming completed since not in list');
      return { done: true, url: `https://doodstream.com/d/${filecode}` };
    }
    
    const fileStatus = result?.status;
    console.log(`Doodstream ${filecode} status: "${fileStatus}"`);
    
    if (fileStatus === 'completed') {
      return { done: true, url: `https://doodstream.com/d/${filecode}` };
    }
    if (fileStatus === 'error') {
      return { done: true, url: null };
    }
    if (fileStatus === 'working') {
      return { done: false, url: null };
    }
    
    console.log('Doodstream: unknown status', fileStatus);
    return { done: false, url: null };
  } catch (e: any) {
    console.error('Doodstream check error:', e.message);
    return { done: false, url: null };
  }
}

/** Verifica estado en SeekStreaming */
async function checkSeekStreaming(taskId: string): Promise<{ done: boolean; url: string | null }> {
  try {
    const key = process.env.SEEKSTREAMING_API_KEY;
    if (!key) {
      console.error('SeekStreaming: API key not configured');
      return { done: false, url: null };
    }
    
    // SeekStreaming v1 API: GET /api/v1/video/advance-upload/{id}
    console.log(`SeekStreaming: checking task status for taskId=${taskId}`);
    const statusUrl = `https://seekstreaming.com/api/v1/video/advance-upload/${taskId}`;
    
    const res = await fetch(statusUrl, {
      cache: 'no-store',
      headers: {
        'api-token': key,
      }
    });
    
    const text = await res.text();
    console.log('SeekStreaming task status response ('+res.status+'):', text.substring(0, 500));
    
    if (!text || text.trim() === '') {
      console.log('SeekStreaming: empty response');
      return { done: false, url: null };
    }
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('SeekStreaming JSON parse error:', parseErr);
      return { done: false, url: null };
    }
    
    // Check API response status
    if (res.status === 404) {
      console.error('SeekStreaming: task not found (404)');
      return { done: true, url: null }; // Consider not found as error
    }
    
    if (res.status !== 200) {
      console.error('SeekStreaming: API error -', data?.message || `HTTP ${res.status}`);
      return { done: false, url: null };
    }
    
    // Task status from response
    const taskStatus = data?.status;
    console.log('SeekStreaming task status:', taskStatus);
    
    if (taskStatus === 'Completed') {
      const videos = data?.videos || [];
      console.log('SeekStreaming: task completed with', videos.length, 'videos');
      
      if (videos.length > 0) {
        // Build URL from first video ID
        // SeekStreaming video URL pattern: https://seekstreaming.com/v/{videoId}
        const videoId = videos[0];
        const url = `https://seekstreaming.com/v/${videoId}`;
        console.log('SeekStreaming video ready at:', url);
        return { done: true, url };
      }
      
      console.log('SeekStreaming: task completed but no videos generated');
      return { done: true, url: null };
    }
    
    if (taskStatus === 'Queued' || taskStatus === 'Processing') {
      console.log('SeekStreaming: task still processing', taskId);
      return { done: false, url: null };
    }
    
    if (taskStatus === 'Failed' || taskStatus === 'Error') {
      console.error('SeekStreaming: task failed with error:', data?.error || 'unknown error');
      return { done: true, url: null };
    }
    
    console.log('SeekStreaming: unknown task status:', taskStatus, 'full response:', JSON.stringify(data).substring(0, 300));
    return { done: false, url: null };
    
  } catch (e: any) {
    console.error('SeekStreaming task check error:', e.message);
    return { done: false, url: null };
  }
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
      
      console.log(`Task ${task.id}: statuses=${JSON.stringify(statuses)}, allDone=${allDone}, anyDone=${anyDone}`);

      if (allDone && anyDone) {
  if (task.reaction_id) {
    // Actualizar reacción existente
    const updateFields: Record<string, string | null> = {};
    if (mergedTask.voe_url)          updateFields.source_voe        = mergedTask.voe_url;
    if (mergedTask.filemoon_url)     updateFields.source_filemoon   = mergedTask.filemoon_url;
    if (mergedTask.doodstream_url)   updateFields.source_doodstream = mergedTask.doodstream_url;
    if (mergedTask.seekstreaming_url)updateFields.source_streamwish = mergedTask.seekstreaming_url;

    console.log('Updating reaction', task.reaction_id, 'with fields:', JSON.stringify(updateFields));
    
    const { error: updateError } = await supabase
      .from('reactions')
      .update(updateFields)
      .eq('id', task.reaction_id);
    
    if (updateError) {
      console.error('Error updating reaction:', updateError);
    } else {
      console.log('Reaction updated successfully');
    }
  } else {
    // Crear nueva reacción
    console.log('Creating new reaction for task:', task.id);
    const reactionData = {
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
    };
    console.log('Reaction data:', JSON.stringify(reactionData).substring(0, 300));
    
    const { error: insertError } = await supabase.from('reactions').insert(reactionData);
    if (insertError) {
      console.error('Error creating reaction:', insertError);
    } else {
      console.log('Reaction created successfully');
    }
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