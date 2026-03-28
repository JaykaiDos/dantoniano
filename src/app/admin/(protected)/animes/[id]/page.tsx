import { createAdminClient } from '@/lib/supabase/admin';
import { AnimeForm } from '@/components/admin/AnimeForm';
import { notFound } from 'next/navigation';

export default async function EditarAnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: anime }, { data: seasons }] = await Promise.all([
    supabase.from('animes').select('*').eq('id', id).single(),
    supabase.from('seasons').select('id, name').order('year', { ascending: false }),
  ]);
  if (!anime) notFound();

  return (
    <div style={{ maxWidth: '620px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)', marginBottom: '1.75rem' }}>
        Editar anime ✏️
      </h1>
      <AnimeForm anime={anime} seasons={seasons ?? []} />
    </div>
  );
}