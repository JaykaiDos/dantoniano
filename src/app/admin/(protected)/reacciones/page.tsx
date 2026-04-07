import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { getYoutubeThumbnail } from '@/lib/utils';
import React from 'react';

// Estilos extraídos para limpieza
const sourceTag: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  padding: '0.1rem 0.4rem',
  borderRadius: 'var(--vh-radius-sm)',
  background: 'var(--vh-accent-soft)',
  color: 'var(--vh-accent)',
  border: '1px solid var(--vh-border)',
};

export default async function AdminReaccionesPage() {
  const supabase = createAdminClient();
  
  // Es buena práctica manejar el posible error de la consulta
  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('*, anime:animes(title, cover_url)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error al cargar las reacciones.</div>;
  }

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
        {(reactions ?? []).map((r) => {
          // Lógica de Thumbnail
          const animeData = r.anime as any;
          const thumb =
            r.custom_thumbnail ??
            r.thumbnail_url ??
            (r.youtube_id && !r.youtube_id.startsWith('http')
              ? getYoutubeThumbnail(r.youtube_id, 'mq')
              : null) ??
            animeData?.cover_url ??
            null;

          const mainUrl =
            r.youtube_url ??
            r.source_streamtape ??
            r.source_okru ??
            r.source_doodstream ??
            r.source_streamwish ??
            r.source_filemoon ??
            r.source_voe ??
            null;

          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: 'var(--vh-bg-card)',
              border: '1.5px solid var(--vh-border-card)',
              borderRadius: 'var(--vh-radius-lg)',
              padding: '0.875rem 1.25rem',
              flexWrap: 'wrap',
            }}>
              
              {thumb ? (
                <img
                  src={thumb}
                  alt={r.title}
                  style={{
                    width: 80, height: 56, objectFit: 'cover',
                    borderRadius: 'var(--vh-radius-sm)',
                    border: '1px solid var(--vh-border)',
                    flexShrink: 0,
                  }}
                  // Nota: onError requiere que este componente sea 'use client'
                  // Si es Server Component, esto se ignorará.
                />
              ) : (
                <div style={{
                  width: 80, height: 56, flexShrink: 0,
                  borderRadius: 'var(--vh-radius-sm)',
                  border: '1px solid var(--vh-border)',
                  background: 'var(--vh-bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  🎌
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--vh-text-primary)' }}>
                  {r.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--vh-text-muted)', marginTop: '0.2rem' }}>
                  🎌 {animeData?.title ?? '—'} · EP {r.episode_number ?? '—'} · {r.duration ?? '—'}
                </div>
                
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  {r.youtube_url && <span style={sourceTag}>Principal</span>}
                  {r.source_streamtape && <span style={sourceTag}>Streamtape</span>}
                  {r.source_okru && <span style={sourceTag}>Okru</span>}
                  {r.source_doodstream && <span style={sourceTag}>Doodstream</span>}
                  {r.source_streamwish && <span style={sourceTag}>Streamwish</span>}
                  {r.source_filemoon && <span style={sourceTag}>Filemoon</span>}
                  {r.source_voe && <span style={sourceTag}>VOE</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {mainUrl && (
                  <a
                    href={mainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vh-btn vh-btn--ghost"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                  >
                    ▶ Ver
                  </a>
                )}
                <Link
                  href={`/admin/reacciones/${r.id}`}
                  className="vh-btn vh-btn--ghost"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                >
                  ✏️ Editar
                </Link>
                <DeleteButton id={r.id} table="reactions" label="reacción" redirectTo="/admin/reacciones" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}