'use client';

import { useState } from 'react';
import { getEmbedUrl, getVideoProvider } from '@/lib/utils';

interface Props {
  url:   string;
  title: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  'youtube':      '▶ YouTube',
  'google-drive': '📁 Google Drive',
  'okru':         '🎬 Okru',
  'streamtape':   '📼 Streamtape',
  'doodstream':   '🎞 Doodstream',
  'mega':         '☁️ Mega',
  'other':        '🎥 Video',
};

export function VideoPlayer({ url, title }: Props) {
  const [error, setError] = useState(false);

  const embedUrl  = getEmbedUrl(url);
  const provider  = getVideoProvider(url);
  const provLabel = PROVIDER_LABELS[provider] ?? '🎥 Video';

  if (provider === 'mega' || (!embedUrl && url)) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'var(--vh-bg-elevated)',
        border: '1.5px solid var(--vh-border-card)',
        borderRadius: 'var(--vh-radius-lg)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1rem',
      }}>
        <span style={{ fontSize: '2.5rem' }}>☁️</span>
        <p style={{ color: 'var(--vh-text-secondary)', fontSize: '0.9rem' }}>
          Este video no puede reproducirse en la página.
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="vh-btn vh-btn--primary">
          Abrir en {provLabel}
        </a>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'var(--vh-bg-elevated)',
        border: '1.5px solid var(--vh-border-card)',
        borderRadius: 'var(--vh-radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.9rem' }}>
          URL de video no reconocida.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.78rem', color: 'var(--vh-text-muted)',
      }}>
        <span>{provLabel}</span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--vh-accent)', textDecoration: 'none', fontSize: '0.75rem' }}>
          Abrir original ↗
        </a>
      </div>

      <div style={{
        position: 'relative', width: '100%', aspectRatio: '16 / 9',
        borderRadius: 'var(--vh-radius-lg)', overflow: 'hidden',
        background: '#000', boxShadow: 'var(--vh-shadow-lg)',
      }}>
        {!error ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onError={() => setError(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              border: 'none',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1rem', background: 'var(--vh-bg-elevated)',
          }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <p style={{ color: 'var(--vh-text-secondary)', fontSize: '0.9rem' }}>
              No se pudo cargar el video.
            </p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="vh-btn vh-btn--primary">
              Ver en {provLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}