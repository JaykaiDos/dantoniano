'use client';

import { useState } from 'react';
import { getEmbedUrl, getVideoProvider } from '@/lib/utils';

interface Source {
  key:      string;
  label:    string;
  url:      string;
  icon:     string;
}

interface Props {
  url:               string;
  title:             string;
  sourceOkru?:       string;
  sourceStreamtape?: string;
  sourceDoodstream?: string;
  sourceStreamwish?: string;
  sourceFilemoon?:   string;
  sourceVoe?:        string;
}

export function VideoPlayer({
  url, title,
  sourceOkru, sourceStreamtape, sourceDoodstream,
  sourceStreamwish, sourceFilemoon, sourceVoe,
}: Props) {
  // Construir lista de fuentes disponibles
  const allSources: Source[] = [
    { key: 'principal',  label: getProviderLabel(url),  url, icon: getProviderIcon(url) },
    ...(sourceOkru       ? [{ key: 'okru',       label: 'Okru',       url: sourceOkru,       icon: '🎬' }] : []),
    ...(sourceStreamtape ? [{ key: 'streamtape', label: 'Streamtape', url: sourceStreamtape, icon: '📼' }] : []),
    ...(sourceDoodstream ? [{ key: 'doodstream', label: 'Doodstream', url: sourceDoodstream, icon: '🎞' }] : []),
    ...(sourceStreamwish ? [{ key: 'streamwish', label: 'Streamwish', url: sourceStreamwish, icon: '⭐' }] : []),
    ...(sourceFilemoon   ? [{ key: 'filemoon',   label: 'Filemoon',   url: sourceFilemoon,   icon: '🌙' }] : []),
    ...(sourceVoe        ? [{ key: 'voe',        label: 'VOE',        url: sourceVoe,        icon: '🔺' }] : []),
  ];

  const [activeKey, setActiveKey] = useState('principal');
  const [error,     setError]     = useState(false);

  const active   = allSources.find(s => s.key === activeKey) ?? allSources[0];
  const embedUrl = active ? getEmbedUrl(active.url) : null;

  // Cambiar fuente resetea el error
  function handleSwitch(key: string) {
    setActiveKey(key);
    setError(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

      {/* ── Selector de reproductores (solo si hay más de 1) ── */}
      {allSources.length > 1 && (
        <div style={{
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
          padding: '0.625rem',
          background: 'var(--vh-bg-elevated)',
          border: '1.5px solid var(--vh-border)',
          borderRadius: 'var(--vh-radius-md)',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', alignSelf: 'center', marginRight: '0.25rem' }}>
            Reproductor:
          </span>
          {allSources.map(src => (
            <button
              key={src.key}
              onClick={() => handleSwitch(src.key)}
              style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '0.3rem',
                padding:      '0.3rem 0.75rem',
                borderRadius: 'var(--vh-radius-full)',
                border:       `1.5px solid ${activeKey === src.key ? 'var(--vh-accent)' : 'var(--vh-border)'}`,
                background:   activeKey === src.key ? 'var(--vh-accent)' : 'var(--vh-bg-card)',
                color:        activeKey === src.key ? '#fff' : 'var(--vh-text-secondary)',
                fontSize:     '0.78rem',
                fontWeight:   activeKey === src.key ? 700 : 500,
                cursor:       'pointer',
                transition:   'all var(--vh-transition)',
                fontFamily:   'inherit',
              }}
            >
              {src.icon} {src.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Player ── */}
      <div style={{
        position:     'relative',
        width:        '100%',
        aspectRatio:  '16 / 9',
        borderRadius: 'var(--vh-radius-lg)',
        overflow:     'hidden',
        background:   '#000',
        boxShadow:    'var(--vh-shadow-lg)',
      }}>
        {!embedUrl || error ? (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '1rem', background: 'var(--vh-bg-elevated)',
          }}>
            <span style={{ fontSize: '2rem' }}>{!embedUrl ? '☁️' : '⚠️'}</span>
            <p style={{ color: 'var(--vh-text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '0 1rem' }}>
              {!embedUrl
                ? 'Este video no puede reproducirse aquí.'
                : 'No se pudo cargar el reproductor.'}
            </p>
            <a href={active?.url} target="_blank" rel="noopener noreferrer" className="vh-btn vh-btn--primary">
              Abrir en {active?.label} ↗
            </a>
          </div>
        ) : (
          <iframe
            key={activeKey}
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onError={() => setError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </div>

      {/* ── Link original ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href={active?.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', textDecoration: 'none' }}
        >
          Abrir en {active?.label} ↗
        </a>
      </div>
    </div>
  );
}

function getProviderLabel(url: string): string {
  const p = getVideoProvider(url);
  const map: Record<string, string> = {
    'youtube': 'YouTube', 'google-drive': 'Drive', 'okru': 'Okru',
    'streamtape': 'Streamtape', 'doodstream': 'Doodstream',
    'streamwish': 'Streamwish', 'filemoon': 'Filemoon', 'voe': 'VOE',
  };
  return map[p] ?? 'Principal';
}

function getProviderIcon(url: string): string {
  const p = getVideoProvider(url);
  const map: Record<string, string> = {
    'youtube': '▶️', 'google-drive': '📁', 'okru': '🎬',
    'streamtape': '📼', 'doodstream': '🎞', 'streamwish': '⭐',
    'filemoon': '🌙', 'voe': '🔺',
  };
  return map[p] ?? '🎥';
}