import { createAdminClient } from '@/lib/supabase/admin';
import { AnimeForm } from '@/components/admin/AnimeForm';

export default async function NuevoAnimePage() {
  const supabase = createAdminClient();
  const { data: seasons } = await supabase.from('seasons').select('id, name').order('year', { ascending: false });

  return (
    <div style={{ maxWidth: '620px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)', marginBottom: '1.75rem' }}>
        Nuevo anime 🎌
      </h1>
      <AnimeForm seasons={seasons ?? []} />
    </div>
  );
}