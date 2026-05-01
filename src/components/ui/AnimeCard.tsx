/**
 * Card compacta de anime — portada 3:4 + título.
 * Linkea a /animes/[id] con la información completa del anime.
 */
import type { Anime } from '@/types';

interface Props {
  anime: Anime & {
    reaction_count?: number;
  };
}

export function AnimeCard({ anime }: Props) {
  return (
    <article className="vh-card vh-card--anime">
      {/* Cover — link a detalle del anime */}
      <a href={`/animes/${anime.id}`} style={{ display: 'block', textDecoration: 'none' }}>
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

          {/* Contador de reacciones */}
          {(anime.reaction_count ?? 0) > 0 && (
            <div style={{
              position: 'absolute', bottom: '0.35rem', right: '0.35rem', zIndex: 2,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: 'var(--vh-radius-sm)',
              backdropFilter: 'blur(4px)',
            }}>
              ▶ {anime.reaction_count}
            </div>
          )}
        </div>
      </a>

      {/* Body — solo título debajo de la imagen */}
      <div className="vh-card__body">
        <h3 className="vh-card__title">{anime.title}</h3>
      </div>
    </article>
  );
}