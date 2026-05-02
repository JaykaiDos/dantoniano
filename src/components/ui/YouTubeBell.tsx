'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoInfo {
  video_id: string;
  title: string;
  published_at: string;
  url: string;
}

const STORAGE_KEY = 'yt_last_seen_video_id';

export function YouTubeBell() {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/youtube-webhook');
        const data = await res.json();
        const latest = data.video;
        if (latest) {
          setVideo(latest);
          const lastSeen = localStorage.getItem(STORAGE_KEY);
          if (latest.video_id !== lastSeen) {
            setHasNew(true);
          }
        }
      } catch (e) {
        console.error('Error fetching notifications:', e);
      }
    }
    check();
    const interval = setInterval(check, 120_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleClick() {
    if (hasNew && video) {
      localStorage.setItem(STORAGE_KEY, video.video_id);
      setHasNew(false);
    }
    setOpen(!open);
  }

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        onClick={handleClick}
        style={{
          width: 44, height: 44,
          borderRadius: 'var(--vh-radius-full)',
          border: `1.5px solid ${hasNew ? 'var(--vh-danger)' : 'var(--vh-border)'}`,
          background: hasNew ? 'var(--vh-danger-bg)' : 'var(--vh-bg-elevated)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
          transition: 'all var(--vh-transition)',
          color: hasNew ? 'var(--vh-danger)' : 'var(--vh-text-muted)',
          position: 'relative',
          fontFamily: 'inherit',
        }}
      >
        🔔
        {hasNew && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 10, height: 10,
            background: 'var(--vh-danger)',
            borderRadius: '50%',
            border: '2px solid var(--vh-bg-elevated)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 52,
          right: 0,
          width: 300,
          background: 'var(--vh-bg-card)',
          backdropFilter: 'var(--vh-glass-blur)',
          border: '1.5px solid var(--vh-border-card)',
          borderRadius: 'var(--vh-radius-lg)',
          boxShadow: 'var(--vh-shadow-lg)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--vh-border)',
            fontSize: '0.78rem', fontWeight: 700,
            color: 'var(--vh-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Notificaciones
          </div>
          {video ? (
            <div style={{ padding: '1rem' }}>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{
                  fontSize: '0.82rem', fontWeight: 600,
                  color: 'var(--vh-text-primary)',
                  lineHeight: 1.35,
                  marginBottom: '0.35rem',
                }}>
                  🎬 {video.title}
                </div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--vh-text-muted)',
                  marginBottom: '0.75rem',
                }}>
                  {new Date(video.published_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </a>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="vh-btn vh-btn--primary"
                style={{
                  width: '100%', textAlign: 'center', textDecoration: 'none',
                  fontSize: '0.82rem', padding: '0.45rem 0.75rem', display: 'block',
                }}
              >
                ▶ Ver en YouTube
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--vh-text-muted)', fontSize: '0.82rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>🔕</div>
              Cargando notificaciones...
            </div>
          )}
        </div>
      )}
    </div>
  );
}