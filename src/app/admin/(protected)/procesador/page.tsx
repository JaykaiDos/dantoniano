import { createAdminClient } from '@/lib/supabase/admin';
import { UploadTaskForm } from '@/components/admin/UploadTaskForm';
import { UploadTaskMonitor } from '@/components/admin/UploadTaskMonitor';

export default async function ProcesadorPage() {
  const supabase = createAdminClient();

  const [{ data: animes }, { data: reactions }, { data: tasks }] = await Promise.all([
    supabase.from('animes').select('id, title').order('title'),
    supabase
      .from('reactions')
      .select('id, title, episode_number, source_voe, source_filemoon, source_doodstream, source_streamwish, anime_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('upload_tasks')
      .select('*, anime:animes(title)')
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair, Georgia, serif)',
          fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--vh-text-primary)', marginBottom: '0.25rem',
        }}>
          Procesador ⚡
        </h1>
        <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.875rem' }}>
          Pegá un link directo — el sistema sube a todas las plataformas automáticamente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <UploadTaskForm animes={animes ?? []} reactions={reactions ?? []} />
        <UploadTaskMonitor initialTasks={tasks ?? []} />
      </div>
    </div>
  );
}