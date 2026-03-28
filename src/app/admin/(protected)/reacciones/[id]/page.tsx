import { createAdminClient } from '@/lib/supabase/admin';
import { ReactionForm } from '@/components/admin/ReactionForm';
import { notFound } from 'next/navigation';

export default async function EditarReaccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: reaction }, { data: animes }] = await Promise.all([
    supabase.from('reactions').select('*').eq('id', id).single(),
    supabase.from('animes').select('id, title').order('title'),
  ]);
  if (!reaction) notFound();

  return (
    <div style={{ maxWidth: '580px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)', marginBottom: '1.75rem' }}>
        Editar reacción ✏️
      </h1>
      <ReactionForm reaction={reaction} animes={animes ?? []} />
    </div>
  );
}