import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { ReactionCard } from '@/components/ui/ReactionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AnimeSubscribeButton } from '@/components/ui/AnimeSubscribeButton';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: anime } = await supabase
    .from('animes')
    .select('title, cover_url, synopsis, title_jp')
    .eq('id', id)
    .single();

  if (!anime) return { title: 'Anime no encontrado' };

  return {
    title: `${anime.title} — Dantoniano`,
    description: anime.synopsis ?? undefined,
    openGraph: {
      title: anime.title,
      description: anime.synopsis ?? undefined,
      images: anime.cover_url ? [{ url: anime.cover_url }] : [],
    },
  };
}

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: anime } = await supabase
    .from('animes')
    .select('*')
    .eq('id', id)
    .single();

  if (!anime) notFound();

  const { data: reactions } = await supabase
    .from('reactions')
    .select('*')
    .eq('anime_id', id)
    .order('episode_number');

  const { data: season } = anime.season_id
    ? await supabase.from('seasons').select('name, slug').eq('id', anime.season_id).single()
    : { data: null };

  const episodeCount = reactions?.length ?? 0;

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view">

          {/* ── Layout: cover + info | sinopsis | capítulos ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: '2rem',
            alignItems: 'start',
          }}>

            {/* ── Columna izquierda: cover + meta ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Cover */}
              <div style={{
                borderRadius: 'var(--vh-radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--vh-shadow-lg)',
                border: '1.5px solid var(--vh-border)',
              }}>
                <div style={{ position: 'relative', paddingBottom: '133.33%' }}>
                  {anime.cover_url ? (
                    <img
                      src={anime.cover_url}
                      alt={anime.title}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'top',
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--vh-bg-elevated)', fontSize: '3rem',
                    }}>
                      🎌
                    </div>
                  )}
                </div>
              </div>

              {/* Meta info */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                fontSize: '0.82rem', color: 'var(--vh-text-secondary)',
              }}>
                {anime.personal_status && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <StatusBadge status={anime.personal_status} />
                  </div>
                )}
                {anime.personal_score && (
                  <div style={{ fontWeight: 700, color: 'var(--vh-sky-500)' }}>
                    ★ {anime.personal_score}/10
                  </div>
                )}
                {anime.year && (
                  <div>📅 {anime.year}</div>
                )}
                {season && (
                  <a href={`/temporadas/${season.slug}`} style={{ color: 'var(--vh-accent)', textDecoration: 'none' }}>
                    📂 {season.name}
                  </a>
                )}
                {anime.genres?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
                    {anime.genres.map((g: string) => (
                      <span key={g} style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--vh-radius-full)',
                        background: 'var(--vh-accent-soft)',
                        color: 'var(--vh-accent)',
                        border: '1px solid var(--vh-border)',
                      }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {anime.is_featured && (
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    background: 'var(--vh-accent-soft)', color: 'var(--vh-accent)',
                    border: '1px solid var(--vh-border)',
                    borderRadius: 'var(--vh-radius-full)',
                    width: 'fit-content',
                  }}>
                    ⭐ Destacado
                  </div>
                )}
              </div>
            </div>

            {/* ── Columna derecha: título + sinopsis ── */}
            <div style={{ minWidth: 0 }}>
<h1 style={{
  fontFamily: 'var(--font-playfair, Georgia, serif)',
  fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
  fontWeight: 700,
  color: 'var(--vh-text-primary)',
  lineHeight: 1.2,
  marginBottom: '0.2rem',
}}>
  {anime.title}
</h1>
<div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
  <AnimeSubscribeButton animeSlug={anime.slug} animeTitle={anime.title} />
</div>
              {anime.title_jp && (
                <p style={{
                  fontSize: '0.875rem', color: 'var(--vh-text-muted)',
                  marginBottom: '1rem', fontStyle: 'italic',
                }}>
                  {anime.title_jp}
                </p>
              )}

              {/* Sinopsis */}
              {anime.synopsis && (
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--vh-text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: '1.5rem',
                }}>
                  {anime.synopsis}
                </p>
              )}

              {/* Notas personales */}
              {anime.personal_notes && (
                <div style={{
                  padding: '0.875rem 1rem',
                  background: 'var(--vh-bg-elevated)',
                  border: '1.5px solid var(--vh-border)',
                  borderRadius: 'var(--vh-radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--vh-text-secondary)',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                }}>
                  💬 {anime.personal_notes}
                </div>
              )}

              {/* ── Capítulos ── */}
              <div style={{
                background: 'var(--vh-bg-card)',
                border: '1.5px solid var(--vh-border-card)',
                borderRadius: 'var(--vh-radius-xl)',
                padding: '1.25rem',
                boxShadow: 'var(--vh-shadow-md)',
              }}>
                <h2 style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: 'var(--vh-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: '1rem',
                }}>
                  ▶ {episodeCount} capítulo{episodeCount !== 1 ? 's' : ''}
                </h2>

                {episodeCount === 0 ? (
                  <p style={{
                    textAlign: 'center', padding: '2rem 0',
                    color: 'var(--vh-text-muted)', fontSize: '0.875rem',
                  }}>
                    No hay capítulos cargados todavía.
                  </p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}>
                    {reactions!.map(r => (
                      <ReactionCard
                        key={r.id}
                        reaction={{ ...r, anime_cover: anime.cover_url ?? undefined }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}