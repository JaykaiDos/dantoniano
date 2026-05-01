/**
 * Página del reproductor — /watch/[id]
 * Convierte automáticamente cualquier URL a embed.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Metadata } from 'next';
import type { Reaction } from '@/types';

interface WatchAnime {
  id: string;
  title: string;
  cover_url: string | null;
  personal_status: 'pendiente' | 'viendo' | 'completado' | 'dropeado' | null;
  personal_score: number | null;
  genres: string[];
  season: { id: string; name: string; slug: string; emoji: string } | null;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('reactions')
    .select('title, anime:animes(title)')
    .eq('id', id)
    .single();

  if (!data) return { title: 'Reproductor — Dantoniano' };
  return {
    title: `${data.title} — Dantoniano`,
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reaction } = await supabase
    .from('reactions')
    .select(`
      *,
      anime:animes(
        id, title, cover_url, personal_status, personal_score, genres,
        season:seasons(id, name, slug, emoji)
      )
    `)
    .eq('id', id)
    .single();

  if (!reaction) notFound();

  const { data: allEpisodes } = await supabase
    .from('reactions')
    .select('id, episode_number, title, duration, thumbnail_url, youtube_id')
    .eq('anime_id', reaction.anime_id)
    .order('episode_number');

  const anime = reaction.anime as WatchAnime | null;
  const season = anime?.season;

  const episodes = (allEpisodes ?? []) as Reaction[];
  const currentIndex = episodes.findIndex(e => e.id === id);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container" style={{ padding: '1.5rem' }}>

          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.82rem', color: 'var(--vh-text-muted)',
            marginBottom: '1.25rem', flexWrap: 'wrap',
          }}>
            {season && (
              <>
                <a href={`/temporadas/${season.slug}`} style={{ color: 'var(--vh-accent)', textDecoration: 'none' }}>
                  {season.emoji} {season.name}
                </a>
                <span>›</span>
              </>
            )}
            <a href={`/animes/${anime?.id}`} style={{ color: 'var(--vh-text-secondary)', textDecoration: 'none' }}>
              {anime?.title}
            </a>
            <span>›</span>
            <span>EP {reaction.episode_number}</span>
          </div>

          {/* Layout: player + sidebar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 280px',
            gap: '1.5rem',
            alignItems: 'start',
          }}
          className="watch-layout"
          >
            {/* ── Columna izquierda: player + info ── */}
            <div>
              {/* Player */}
              <VideoPlayer
                url={reaction.youtube_url}
                title={reaction.title}
                sourceOkru={reaction.source_okru}
                sourceStreamtape={reaction.source_streamtape}
                sourceDoodstream={reaction.source_doodstream}
                sourceStreamwish={reaction.source_streamwish}
                sourceFilemoon={reaction.source_filemoon}
                sourceVoe={reaction.source_voe}
              />

              {/* ── Navegación de episodios ── */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                {prevEpisode ? (
                  <Link
                    href={`/watch/${prevEpisode.id}`}
                    className="vh-btn vh-btn--ghost"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    ◀ Anterior
                  </Link>
                ) : (
                  <div />
                )}

                <Link
                  href={`/animes/${anime?.id}`}
                  className="vh-btn vh-btn--primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', textDecoration: 'none' }}
                >
                  📋 Todos los capítulos ({episodes.length})
                </Link>

                {nextEpisode ? (
                  <Link
                    href={`/watch/${nextEpisode.id}`}
                    className="vh-btn vh-btn--ghost"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    Siguiente ▶
                  </Link>
                ) : (
                  <div />
                )}
              </div>

              {/* Info del episodio */}
              <div style={{
                background:   'var(--vh-bg-card)',
                border:       '1.5px solid var(--vh-border-card)',
                borderRadius: 'var(--vh-radius-lg)',
                padding:      '1.25rem',
                marginTop:    '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h1 style={{
                      fontFamily: 'var(--font-playfair, Georgia, serif)',
                      fontSize: '1.2rem', fontWeight: 700,
                      color: 'var(--vh-text-primary)', marginBottom: '0.4rem',
                    }}>
                      {reaction.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        background: 'var(--vh-accent-soft)', color: 'var(--vh-accent)',
                        border: '1px solid var(--vh-border)',
                        borderRadius: 'var(--vh-radius-sm)',
                        fontSize: '0.75rem', fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                      }}>
                        EP {reaction.episode_number}
                      </span>
                      {reaction.duration && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--vh-text-muted)' }}>
                          ⏱ {reaction.duration}
                        </span>
                      )}
                      {reaction.published_at && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--vh-text-muted)' }} suppressHydrationWarning>
                          📅 {new Date(reaction.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info del anime */}
              {anime && (
                <div style={{
                  background:   'var(--vh-bg-card)',
                  border:       '1.5px solid var(--vh-border-card)',
                  borderRadius: 'var(--vh-radius-lg)',
                  padding:      '1.25rem',
                  marginTop:    '0.75rem',
                  display:      'flex',
                  gap:          '1rem',
                  alignItems:   'flex-start',
                }}>
                  {anime.cover_url && (
                    <img src={anime.cover_url} alt={anime.title} style={{
                      width: 60, height: 85, objectFit: 'cover', objectPosition: 'top',
                      borderRadius: 'var(--vh-radius-md)', border: '1.5px solid var(--vh-border)',
                      flexShrink: 0,
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/animes/${anime.id}`} style={{ fontWeight: 700, color: 'var(--vh-text-primary)', textDecoration: 'none', marginBottom: '0.4rem', display: 'block' }}>
                      {anime.title}
                    </Link>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                        }}>{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Columna derecha: lista de episodios ── */}
            <aside style={{
              background:   'var(--vh-bg-card)',
              border:       '1.5px solid var(--vh-border-card)',
              borderRadius: 'var(--vh-radius-xl)',
              overflow:     'hidden',
              position:     'sticky',
              top:          '80px',
              maxHeight:    'calc(100vh - 100px)',
              display:      'flex',
              flexDirection:'column',
            }}>
              <div style={{
                padding:      '0.875rem 1rem',
                borderBottom: '1px solid var(--vh-border)',
                fontWeight:   700,
                fontSize:     '0.82rem',
                color:        'var(--vh-text-secondary)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
              }}>
                <span>📋 Episodios</span>
                <span style={{
                  background: 'var(--vh-accent-soft)',
                  color: 'var(--vh-accent)',
                  border: '1px solid var(--vh-border)',
                  borderRadius: 'var(--vh-radius-full)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.5rem',
                }}>
                  {episodes.length}
                </span>
              </div>

              {/* Lista scrolleable con scrollbar custom */}
              <div style={{
                overflowY: 'auto',
                flex: 1,
                padding: '0.5rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--vh-border) transparent',
              }}
              className="episode-sidebar-scroll"
              >
                {(allEpisodes ?? []).map((ep: Reaction) => {
                  const isActive = ep.id === id;
                  const thumb = ep.thumbnail_url
                    ?? (ep.youtube_id && !ep.youtube_id.startsWith('http')
                      ? `https://img.youtube.com/vi/${ep.youtube_id}/mqdefault.jpg`
                      : null);
                  return (
                    <a
                      key={ep.id}
                      href={`/watch/${ep.id}`}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{
                        display:    'flex',
                        gap:        '0.75rem',
                        padding:    '0.75rem',
                        alignItems: 'center',
                        background: isActive ? 'var(--vh-accent-soft)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--vh-accent)' : '3px solid transparent',
                        transition: 'all var(--vh-transition)',
                        cursor:     'pointer',
                      }}
                      className="episode-item"
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={ep.title}
                              style={{
                                width: 80, height: 52,
                                objectFit: 'cover',
                                borderRadius: 'var(--vh-radius-sm)',
                                border: isActive ? '2px solid var(--vh-accent)' : '1px solid var(--vh-border)',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: 80, height: 52,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--vh-bg-elevated)',
                              borderRadius: 'var(--vh-radius-sm)',
                              border: '1px solid var(--vh-border)',
                              fontSize: '1.2rem',
                            }}>
                              ▶
                            </div>
                          )}
                          {isActive && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'rgba(0,0,0,0.45)',
                              borderRadius: 'var(--vh-radius-sm)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '1.1rem',
                            }}>▶</div>
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                            color: isActive ? 'var(--vh-accent)' : 'var(--vh-text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            EP {ep.episode_number}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--vh-text-muted)',
                            marginTop: '0.1rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {ep.title}
                          </div>
                          {ep.duration && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--vh-text-muted)', marginTop: '0.1rem' }}>
                              ⏱ {ep.duration}
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}