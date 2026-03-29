/**
 * Página de una temporada específica.
 * Muestra todos sus animes y, al hacer click en uno, sus reacciones.
 */
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { ReactionCard } from '@/components/ui/ReactionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SEASON_META } from '@/lib/utils';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — Dantoniano` };
}

export default async function SeasonPage({ params }: Props) {
  const { slug } = await params;
  const supabase  = await createClient();

  // Traer la temporada
  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!season) notFound();

  // Traer animes de la temporada con conteo de reacciones
  const { data: animes } = await supabase
    .from('animes_with_counts')
    .select('*')
    .eq('season_id', season.id)
    .order('is_featured', { ascending: false })
    .order('title');

  // Traer todas las reacciones de estos animes en un solo query
  const animeIds = (animes ?? []).map(a => a.id);
  const { data: reactions } = animeIds.length > 0
    ? await supabase
        .from('reactions')
        .select('*')
        .in('anime_id', animeIds)
        .order('episode_number')
    : { data: [] };

  // Agrupar reacciones por anime_id
  const reactionsByAnime = (reactions ?? []).reduce<Record<string, any[]>>((acc, r) => {
    if (!acc[r.anime_id]) acc[r.anime_id] = [];
    acc[r.anime_id]!.push(r);
    return acc;
  }, {});

  const meta = SEASON_META[season.cour as keyof typeof SEASON_META];

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view">

          {/* Hero de la temporada */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1.5rem',
            marginBottom: '2.5rem', flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: '4rem',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            }}>
              {season.emoji}
            </span>
            <div>
              <h2 className="vh-section-title">{season.name}</h2>
              <p className="vh-section-subtitle">
                {meta?.months} · {animes?.length ?? 0} animes ·{' '}
                {reactions?.length ?? 0} reacciones
              </p>
            </div>
            {season.is_current && (
              <span className="vh-badge vh-badge--playing" style={{ alignSelf: 'center' }}>
                🔴 En curso
              </span>
            )}
          </div>

          {/* Lista de animes */}
          {!animes || animes.length === 0 ? (
            <EmptyState
              icon="🎌"
              title="Sin animes en esta temporada"
              description="El admin todavía no cargó animes para esta temporada."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {animes.map((anime) => {
                const animeReactions = reactionsByAnime[anime.id] ?? [];
                return (
                  <section
                    key={anime.id}
                    id={`anime-${anime.id}`}
                    style={{
                      background: 'var(--vh-bg-card)',
                      border: '1.5px solid var(--vh-border-card)',
                      borderRadius: 'var(--vh-radius-xl)',
                      overflow: 'hidden',
                      boxShadow: 'var(--vh-shadow-md)',
                    }}
                  >
                    {/* Header del anime */}
                    <div style={{
                      display: 'flex', gap: '1.25rem', padding: '1.25rem',
                      borderBottom: '1px solid var(--vh-border)',
                      flexWrap: 'wrap',
                    }}>
                      {/* Cover pequeño */}
                      {anime.cover_url && (
                        <img
                          src={anime.cover_url}
                          alt={anime.title}
                          style={{
                            width: '72px', height: '100px',
                            objectFit: 'cover', objectPosition: 'top',
                            borderRadius: 'var(--vh-radius-md)',
                            border: '1.5px solid var(--vh-border)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'flex-start',
                          gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem',
                        }}>
                          <h3 style={{
                            fontFamily: 'var(--font-playfair, Georgia, serif)',
                            fontSize: '1.15rem', fontWeight: 700,
                            color: 'var(--vh-text-primary)', flex: 1, minWidth: 0,
                          }}>
                            {anime.title}
                          </h3>
                          {anime.is_featured && (
                            <span style={{
                              fontSize: '0.72rem', fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              background: 'var(--vh-accent-soft)',
                              color: 'var(--vh-accent)',
                              border: '1px solid var(--vh-border)',
                              borderRadius: 'var(--vh-radius-full)',
                              whiteSpace: 'nowrap',
                            }}>
                              ⭐ Destacado
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <StatusBadge status={anime.personal_status} />
                          {anime.personal_score && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--vh-sky-500)' }}>
                              ★ {anime.personal_score}/10
                            </span>
                          )}
                          {anime.genres?.slice(0, 3).map((g: string) => (
                            <span key={g} style={{
                              fontSize: '0.7rem', padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--vh-radius-sm)',
                              background: 'var(--vh-accent-soft)', color: 'var(--vh-accent)',
                              border: '1px solid var(--vh-border)',
                            }}>
                              {g}
                            </span>
                          ))}
                        </div>

                        {anime.personal_notes && (
                          <p style={{
                            marginTop: '0.5rem', fontSize: '0.83rem',
                            color: 'var(--vh-text-secondary)', lineHeight: 1.5,
                          }}>
                            💬 {anime.personal_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reacciones del anime */}
                    <div style={{ padding: '1.25rem' }}>
                      {animeReactions.length === 0 ? (
                        <p style={{
                          color: 'var(--vh-text-muted)', fontSize: '0.875rem',
                          textAlign: 'center', padding: '1.5rem 0',
                        }}>
                          Todavía no hay reacciones para este anime.
                        </p>
                      ) : (
                        <>
                          <h4 style={{
                            fontSize: '0.82rem', fontWeight: 700,
                            color: 'var(--vh-text-muted)',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            marginBottom: '1rem',
                          }}>
                            ▶ {animeReactions.length} reacciones
                          </h4>
                          <div className="vh-cards-grid" style={{
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                          }}>
                            {animeReactions.map(r => (
                          <ReactionCard
                          key={r.id}
                          reaction={{
      ...r,
      anime_cover: anime.cover_url ?? undefined,
                            }}
                          />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}