import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DeleteButton } from '@/components/admin/DeleteButton';

export default async function AdminReaccionesPage() {
  const supabase = createAdminClient();
  const { data: reactions } = await supabase
    .from('reactions')
    .select('*, anime:animes(title)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--vh-text-primary)' }}>
            Reacciones ▶️
          </h1>
          <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.875rem' }}>
            {reactions?.length ?? 0} reacciones subidas
          </p>
        </div>
        <Link href="/admin/reacciones/nueva" className="vh-btn vh-btn--primary">
          + Nueva reacción
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {(reactions ?? []).map(r => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--vh-bg-card)',
            border: '1.5px solid var(--vh-border-card)',
            borderRadius: 'var(--vh-radius-lg)',
            padding: '0.875rem 1.25rem',
            flexWrap: 'wrap',
          }}>
            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${r.youtube_id}/mqdefault.jpg`}
              alt={r.title}
              style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 'var(--vh-radius-sm)', border: '1px solid var(--vh-border)', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--vh-text-primary)' }}>{r.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--vh-text-muted)', marginTop: '0.2rem' }}>
                🎌 {(r.anime as any)?.title ?? '—'} · EP {r.episode_number ?? '—'} · {r.duration ?? '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={r.youtube_url} target="_blank" rel="noopener noreferrer" className="vh-btn vh-btn--ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                ▶ Ver
              </a>
              <Link href={`/admin/reacciones/${r.id}`} className="vh-btn vh-btn--ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                ✏️ Editar
              </Link>
              <DeleteButton id={r.id} table="reactions" label="reacción" redirectTo="/admin/reacciones" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}