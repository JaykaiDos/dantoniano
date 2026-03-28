/**
 * Card de anime — thumbnail 16:9 (cover del anime),
 * título, género, badge de estado y link a sus reacciones.
 */
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import type { Anime } from '@/types';

interface Props {
  anime: Anime & {
    reaction_count?: number;
    season_name?: string;
    season_slug?: string;
  };
  /** Si true, muestra el nombre de la temporada en la card */
  showSeason?: boolean;
}

export function AnimeCard({ anime, showSeason = false }: Props) {
  return (
    <article className="vh-card">
      {/* Cover */}
      <div className="vh-card__cover-wrapper">
        {anime.cover_url ? (
          <img
            src={anime.cover_url}
            alt={`Cover de ${anime.title}`}
            className="vh-card__cover"
            loading="lazy"
          />
        ) : (
          <div className="vh-card__cover-placeholder">🎌</div>
        )}

        {/* Badge de estado personal en la esquina */}
        {anime.personal_status && (
          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 2 }}>
            <StatusBadge status={anime.personal_status} />
          </div>
        )}

        {/* Contador de reacciones */}
        {(anime.reaction_count ?? 0) > 0 && (
          <div style={{
            position: 'absolute', bottom: '0.5rem', right: '0.5rem', zIndex: 2,
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--vh-radius-sm)',
            backdropFilter: 'blur(4px)',
          }}>
            ▶ {anime.reaction_count} reac.
          </div>
        )}
      </div>

      {/* Body */}
      <div className="vh-card__body">
        <h3 className="vh-card__title">{anime.title}</h3>

        <div className="vh-card__meta">
          {anime.genres.slice(0, 2).map(g => (
            <span key={g} style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--vh-radius-sm)',
              background: 'var(--vh-accent-soft)',
              color: 'var(--vh-accent)',
              border: '1px solid var(--vh-border)',
            }}>
              {g}
            </span>
          ))}
          {anime.personal_score && (
            <span style={{
              fontSize: '0.8rem', fontWeight: 700,
              color: 'var(--vh-sky-500)', marginLeft: 'auto',
            }}>
              ★ {anime.personal_score}
            </span>
          )}
        </div>

        {showSeason && anime.season_name && (
          <span style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)' }}>
            📅 {anime.season_name}
          </span>
        )}
      </div>

      {/* Footer — link a reacciones */}
      <div className="vh-card__footer">
        <Link
          href={`/temporadas/${anime.season_slug ?? 'sin-temporada'}#anime-${anime.id}`}
          className="vh-btn vh-btn--primary"
          style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
        >
          ▶ Ver reacciones
        </Link>
      </div>
    </article>
  );
}