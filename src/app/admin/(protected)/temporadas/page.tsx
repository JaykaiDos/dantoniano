import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DeleteButton } from '@/components/admin/DeleteButton';

export default async function AdminTemporadasPage() {
  const supabase = createAdminClient();
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*, anime_count:animes(count)')
    .order('year', { ascending: false });

  const seasonsNorm = (seasons ?? []).map(s => ({
    ...s,
    anime_count: (s.anime_count as any)?.[0]?.count ?? 0,
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)' }}>
            Temporadas 📅
          </h1>
          <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.875rem' }}>
            {seasonsNorm.length} temporadas registradas
          </p>
        </div>
        <Link href="/admin/temporadas/nueva" className="vh-btn vh-btn--primary">
          + Nueva temporada
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {seasonsNorm.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--vh-bg-card)',
            border: '1.5px solid var(--vh-border-card)',
            borderRadius: 'var(--vh-radius-lg)',
            padding: '1rem 1.25rem',
            boxShadow: 'var(--vh-shadow-sm)',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '1.75rem' }}>{s.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--vh-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {s.name}
                {s.is_current && <span className="vh-badge vh-badge--playing">Actual</span>}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--vh-text-muted)' }}>
                {s.anime_count} animes · slug: {s.slug}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href={`/admin/temporadas/${s.id}`}
                className="vh-btn vh-btn--ghost"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                ✏️ Editar
              </Link>
              <DeleteButton
                id={s.id}
                table="seasons"
                label="temporada"
                redirectTo="/admin/temporadas"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}