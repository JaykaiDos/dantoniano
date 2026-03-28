import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DeleteButton } from '@/components/admin/DeleteButton';

export default async function AdminAnimesPage() {
  const supabase = createAdminClient();
  const { data: animes } = await supabase
    .from('animes_with_counts')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)' }}>
            Animes 🎌
          </h1>
          <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.875rem' }}>
            {animes?.length ?? 0} animes en el catálogo
          </p>
        </div>
        <Link href="/admin/animes/nuevo" className="vh-btn vh-btn--primary">
          + Nuevo anime
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {(animes ?? []).map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--vh-bg-card)',
            border: '1.5px solid var(--vh-border-card)',
            borderRadius: 'var(--vh-radius-lg)',
            padding: '0.875rem 1.25rem',
            boxShadow: 'var(--vh-shadow-sm)',
            flexWrap: 'wrap',
          }}>
            {/* Cover mini */}
            {a.cover_url ? (
              <img src={a.cover_url} alt={a.title} style={{
                width: 40, height: 56, objectFit: 'cover', objectPosition: 'top',
                borderRadius: 'var(--vh-radius-sm)', border: '1px solid var(--vh-border)',
                flexShrink: 0,
              }} />
            ) : (
              <div style={{
                width: 40, height: 56, borderRadius: 'var(--vh-radius-sm)',
                background: 'var(--vh-accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>🎌</div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--vh-text-primary)', fontSize: '0.9rem' }}>
                {a.title}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <StatusBadge status={a.personal_status} />
                {a.season_name && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)' }}>
                    📅 {a.season_name}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--vh-accent)' }}>
                  ▶ {a.reaction_count ?? 0} reacciones
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href={`/admin/animes/${a.id}`}
                className="vh-btn vh-btn--ghost"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
              >
                ✏️ Editar
              </Link>
              <DeleteButton id={a.id} table="animes" label="anime" redirectTo="/admin/animes" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}