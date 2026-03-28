import { createAdminClient } from '@/lib/supabase/admin';
import { ReactionForm } from '@/components/admin/ReactionForm';

export default async function NuevaReaccionPage() {
  const supabase = createAdminClient();
  const { data: animes } = await supabase.from('animes').select('id, title').order('title');

  return (
    <div style={{ maxWidth: '580px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)', marginBottom: '1.75rem' }}>
        Nueva reacción ▶️
      </h1>
      <ReactionForm animes={animes ?? []} />
    </div>
  );
}