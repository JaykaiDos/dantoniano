'use client';

import { useState } from 'react';
import { getYoutubeThumbnail } from '@/lib/utils';
import type { Reaction } from '@/types';

interface Props {
  reaction: Reaction & { anime_cover?: string };
}

export function ReactionCard({ reaction }: Props) {
  const initialThumb =
    reaction.thumbnail_url
    ?? (reaction.youtube_id && !reaction.youtube_id.startsWith('http')
        ? getYoutubeThumbnail(reaction.youtube_id, 'hq')
        : null)
    ?? reaction.anime_cover
    ?? null;

  const [thumb, setThumb] = useState<string | null>(initialThumb);

  return (
    <a href={`/watch/${reaction.id}`} style={{ textDecoration: 'none' }}>
      <article className="vh-card vh-card--reaction">
        <div className="vh-card__cover-wrapper" style={{ position: 'relative' }}>
          {thumb ? (
            <img
              src={thumb}
              alt={reaction.title}
              className="vh-card__cover"
              loading="lazy"
              onError={() => {
                // Intentar con la cover del anime como fallback
                if (reaction.anime_cover && thumb !== reaction.anime_cover) {
                  setThumb(reaction.anime_cover);
                } else {
                  setThumb(null);
                }
              }}
            />
          ) : (
            <div className="vh-card__cover-placeholder">🎌</div>
          )}

          <div className="vh-card__play-overlay">
            <span className="vh-card__play-icon">▶</span>
          </div>

          {reaction.episode_number != null && (
            <div style={{
              position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 2,
              background: 'var(--vh-accent)', color: '#fff',
              fontSize: '0.7rem', fontWeight: 700,
              padding: '0.2rem 0.5rem', borderRadius: 'var(--vh-radius-sm)',
            }}>
              EP {reaction.episode_number}
            </div>
          )}

          {reaction.duration != null && (
            <div style={{
              position: 'absolute', bottom: '0.5rem', right: '0.5rem', zIndex: 2,
              background: 'rgba(0,0,0,0.8)', color: '#fff',
              fontSize: '0.7rem', fontWeight: 600,
              padding: '0.15rem 0.4rem', borderRadius: 'var(--vh-radius-sm)',
            }}>
              {reaction.duration}
            </div>
          )}
        </div>

        <div className="vh-card__body">
          <h4 className="vh-card__title">{reaction.title}</h4>
          {reaction.published_at != null && (
            <span className="vh-card__year">
              {new Date(reaction.published_at).toLocaleDateString('es-AR', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
        </div>
      </article>
    </a>
  );
}