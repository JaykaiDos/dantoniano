import { createAdminClient } from '@/lib/supabase/admin';
import { SeasonForm } from '@/components/admin/SeasonForm';
import { notFound } from 'next/navigation';

export default async function EditarTemporadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: season } = await supabase.from('seasons').select('*').eq('id', id).single();
  if (!season) notFound();

  return (
    <div style={{ maxWidth: '560px' }}>
      <h1 style={{
        fontFamily: 'var(--font-playfair, Georgia, serif)',
        fontSize: '1.75rem', fontWeight: 700,
        color: 'var(--vh-text-primary)', marginBottom: '1.75rem',
      }}>
        Editar temporada ✏️
      </h1>
      <SeasonForm season={season} />
    </div>
  );
}