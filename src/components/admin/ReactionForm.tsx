'use client';

import { VideoUploader } from './VideoUploader';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getYoutubeId, getYoutubeThumbnail } from '@/lib/utils';
import type { Reaction } from '@/types';

interface Props {
  reaction?: Reaction;
  animes:    { id: string; title: string }[];
}

export function ReactionForm({ reaction, animes }: Props) {
  const router  = useRouter();
  const editing = !!reaction;

  const [youtubeUrl,       setYoutubeUrl]       = useState(reaction?.youtube_url       ?? '');
  const [youtubeId,        setYoutubeId]        = useState(reaction?.youtube_id        ?? '');
  const [title,            setTitle]            = useState(reaction?.title             ?? '');
  const [animeId,          setAnimeId]          = useState(reaction?.anime_id          ?? '');
  const [episode,          setEpisode]          = useState(reaction?.episode_number    ?? '');
  const [duration,         setDuration]         = useState(reaction?.duration          ?? '');
  const [publishedAt,      setPublishedAt]      = useState(
    reaction?.published_at ? reaction.published_at.slice(0, 10) : ''
  );
  const [sourceOkru,       setSourceOkru]       = useState(reaction?.source_okru       ?? '');
  const [sourceStreamtape, setSourceStreamtape] = useState(reaction?.source_streamtape ?? '');
  const [sourceDoodstream, setSourceDoodstream] = useState(reaction?.source_doodstream ?? '');
  const [sourceStreamwish, setSourceStreamwish] = useState(reaction?.source_streamwish ?? '');
  const [sourceFilemoon,   setSourceFilemoon]   = useState(reaction?.source_filemoon   ?? '');
  const [sourceVoe,        setSourceVoe]        = useState(reaction?.source_voe        ?? '');
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');

  function handleUrlChange(url: string) {
    setYoutubeUrl(url);
    const ytId = getYoutubeId(url);
    setYoutubeId(ytId ?? '');
    if (!title) setTitle(`Reacción EP ${episode || '?'}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeUrl) { setError('Ingresá una URL de video.'); return; }
    if (!animeId)    { setError('Seleccioná un anime.');      return; }

    setLoading(true);
    setError('');

    const payload = {
      anime_id:          animeId,
      youtube_url:       youtubeUrl,
      youtube_id:        youtubeId || youtubeUrl,
      thumbnail_url:     youtubeId ? getYoutubeThumbnail(youtubeId, 'hq') : null,
      title:             title || `Reacción EP ${episode || '?'}`,
      episode_number:    episode     ? Number(episode) : null,
      duration:          duration    || null,
      published_at:      publishedAt || null,
      source_okru:       sourceOkru       || null,
      source_streamtape: sourceStreamtape || null,
      source_doodstream: sourceDoodstream || null,
      source_streamwish: sourceStreamwish || null,
      source_filemoon:   sourceFilemoon   || null,
      source_voe:        sourceVoe        || null,
    };

    const res = await fetch('/api/admin/reactions', {
      method:  editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(editing ? { ...payload, id: reaction!.id } : payload),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? 'Error al guardar');
    } else {
      router.push('/admin/reacciones');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem 1rem', background: 'var(--vh-danger-bg)',
          border: '1px solid var(--vh-danger)', borderRadius: 'var(--vh-radius-md)',
          color: 'var(--vh-danger)', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* ── Uploader automático ── */}
      <VideoUploader
        onSuccess={({ streamtapeUrl, doodstreamUrl }) => {
          if (streamtapeUrl) setSourceStreamtape(streamtapeUrl);
          if (doodstreamUrl) setSourceDoodstream(doodstreamUrl);
        }}
      />

      {/* Separador */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        color: 'var(--vh-text-muted)', fontSize: '0.78rem',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--vh-border)' }} />
        o pegá los links manualmente
        <div style={{ flex: 1, height: '1px', background: 'var(--vh-border)' }} />
      </div>

      {/* ── URL principal ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={labelStyle}>
          URL del video *{' '}
          <span style={{ color: 'var(--vh-text-muted)', fontWeight: 400 }}>
            (YouTube, Okru, Drive, Streamtape...)
          </span>
        </label>
        <input
          type="url"
          value={youtubeUrl}
          onChange={e => handleUrlChange(e.target.value)}
          style={inputStyle}
          placeholder="https://www.youtube.com/watch?v=..."
          required
        />
        {youtubeUrl && (
          <div style={{ marginTop: '0.5rem', position: 'relative', display: 'inline-block' }}>
            {youtubeId ? (
              <>
                <img
                  src={getYoutubeThumbnail(youtubeId, 'hq')}
                  alt="thumbnail"
                  style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--vh-radius-md)', border: '1.5px solid var(--vh-border)' }}
                />
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  background: 'var(--vh-accent)', color: '#fff',
                  fontSize: '0.7rem', fontWeight: 700,
                  padding: '0.2rem 0.5rem', borderRadius: 'var(--vh-radius-sm)',
                }}>
                  ✅ YouTube detectado
                </span>
              </>
            ) : (
              <div style={{
                padding: '0.6rem 1rem',
                background: 'var(--vh-accent-2-soft)',
                border: '1px solid var(--vh-accent-2)',
                borderRadius: 'var(--vh-radius-md)',
                fontSize: '0.8rem', color: 'var(--vh-accent-2)',
              }}>
                ✅ URL cargada — se convertirá automáticamente al reproducir
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Anime ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={labelStyle}>Anime *</label>
        <select value={animeId} onChange={e => setAnimeId(e.target.value)} style={selectStyle} required>
          <option value="">Seleccioná un anime...</option>
          {animes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
      </div>

      {/* ── Título ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={labelStyle}>Título de la reacción</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={inputStyle}
          placeholder="Reacción EP 1 — Solo Leveling S2"
        />
      </div>

      {/* ── Episodio / Duración / Fecha ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={labelStyle}>Episodio</label>
          <input
            type="number"
            value={episode}
            onChange={e => setEpisode(e.target.value as any)}
            style={inputStyle}
            min={0}
            placeholder="1"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={labelStyle}>Duración</label>
          <input
            value={duration}
            onChange={e => setDuration(e.target.value)}
            style={inputStyle}
            placeholder="18:34"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={labelStyle}>Fecha de subida</label>
          <input
            type="date"
            value={publishedAt}
            onChange={e => setPublishedAt(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ── Fuentes alternativas ── */}
      <div style={{
        padding: '1.25rem', background: 'var(--vh-bg-elevated)',
        border: '1.5px solid var(--vh-border)', borderRadius: 'var(--vh-radius-lg)',
      }}>
        <h3 style={{
          fontSize: '0.85rem', fontWeight: 700, color: 'var(--vh-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem',
        }}>
          🎬 Reproductores alternativos{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.78rem' }}>
            (opcional)
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            { label: '🎬 Okru',       value: sourceOkru,        setter: setSourceOkru,        placeholder: 'https://ok.ru/video/123456'        },
            { label: '📼 Streamtape', value: sourceStreamtape,  setter: setSourceStreamtape,  placeholder: 'https://streamtape.com/v/ABC123'   },
            { label: '🎞 Doodstream', value: sourceDoodstream,  setter: setSourceDoodstream,  placeholder: 'https://doodstream.com/d/ABC123'   },
            { label: '⭐ Streamwish', value: sourceStreamwish,  setter: setSourceStreamwish,  placeholder: 'https://streamwish.com/e/ABC123'   },
            { label: '🌙 Filemoon',   value: sourceFilemoon,    setter: setSourceFilemoon,    placeholder: 'https://filemoon.sx/e/ABC123'      },
            { label: '🔺 VOE',        value: sourceVoe,         setter: setSourceVoe,         placeholder: 'https://voe.sx/e/ABC123'           },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>
                {label}
              </label>
              <input
                type="url"
                value={value}
                onChange={e => setter(e.target.value)}
                style={inputStyle}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Botones ── */}
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={loading}
          className="vh-btn vh-btn--primary"
          style={{ flex: 1 }}
        >
          {loading ? '⏳ Guardando...' : editing ? '💾 Guardar cambios' : '+ Cargar reacción'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="vh-btn vh-btn--ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem', fontWeight: 600, color: 'var(--vh-text-secondary)',
};
const inputStyle: React.CSSProperties = {
  padding: '0.65rem 1rem', borderRadius: 'var(--vh-radius-md)',
  border: '1.5px solid var(--vh-border)', background: 'var(--vh-bg-elevated)',
  color: 'var(--vh-text-primary)', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', width: '100%',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };