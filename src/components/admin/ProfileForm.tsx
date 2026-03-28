'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';

interface Props {
  profile?: Profile | null;
}

export function ProfileForm({ profile }: Props) {
  const router = useRouter();

  const [displayName,    setDisplayName]    = useState(profile?.display_name     ?? '');
  const [bio,            setBio]            = useState(profile?.bio              ?? '');
  const [avatarUrl,      setAvatarUrl]      = useState(profile?.avatar_url       ?? '');
  const [youtubeChannel, setYoutubeChannel] = useState(profile?.youtube_channel  ?? '');
  const [kick,           setKick]           = useState(profile?.kick_channel     ?? '');
  const [twitter,        setTwitter]        = useState(profile?.twitter          ?? '');
  const [instagram,      setInstagram]      = useState(profile?.instagram        ?? '');
  const [discord,        setDiscord]        = useState(profile?.discord          ?? '');
  const [twitch,         setTwitch]         = useState(profile?.twitch           ?? '');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const payload = {
      id:              profile?.id,
      display_name:    displayName,
      bio:             bio             || null,
      avatar_url:      avatarUrl       || null,
      youtube_channel: youtubeChannel  || null,
      kick_channel:    kick            || null,
      twitter:         twitter         || null,
      instagram:       instagram       || null,
      discord:         discord         || null,
      twitch:          twitch          || null,
    };

    const res = await fetch('/api/admin/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? 'Error al guardar');
    } else {
      setSuccess(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--vh-danger-bg)', border: '1px solid var(--vh-danger)', borderRadius: 'var(--vh-radius-md)', color: 'var(--vh-danger)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 'var(--vh-radius-md)', color: '#22c55e', fontSize: '0.875rem' }}>
          ✅ Perfil actualizado correctamente
        </div>
      )}

      {/* Datos básicos */}
      <div style={{ padding: '1.25rem', background: 'var(--vh-bg-elevated)', border: '1.5px solid var(--vh-border)', borderRadius: 'var(--vh-radius-lg)' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--vh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
          Datos básicos
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Nombre a mostrar *">
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} required placeholder="Dantoniano" />
          </Field>
          <Field label="Bio">
            <textarea value={bio} onChange={e => setBio(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Reactore de anime. Subo reacciones cada semana..." />
          </Field>
          <Field label="URL del avatar">
            <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={inputStyle} placeholder="https://..." type="url" />
            {avatarUrl && (
              <img src={avatarUrl} alt="avatar preview" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem', border: '2px solid var(--vh-border)' }} />
            )}
          </Field>
        </div>
      </div>

      {/* Redes sociales */}
      <div style={{ padding: '1.25rem', background: 'var(--vh-bg-elevated)', border: '1.5px solid var(--vh-border)', borderRadius: 'var(--vh-radius-lg)' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--vh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
          Redes sociales
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="▶️ YouTube">
            <input value={youtubeChannel} onChange={e => setYoutubeChannel(e.target.value)} style={inputStyle} placeholder="https://youtube.com/@usuario" type="url" />
          </Field>
          <Field label="🟢 Kick">
            <input value={kick} onChange={e => setKick(e.target.value)} style={inputStyle} placeholder="https://kick.com/usuario" type="url" />
          </Field>
          <Field label="🐦 Twitter / X">
            <input value={twitter} onChange={e => setTwitter(e.target.value)} style={inputStyle} placeholder="https://twitter.com/usuario" type="url" />
          </Field>
          <Field label="📸 Instagram">
            <input value={instagram} onChange={e => setInstagram(e.target.value)} style={inputStyle} placeholder="https://instagram.com/usuario" type="url" />
          </Field>
          <Field label="💬 Discord">
            <input value={discord} onChange={e => setDiscord(e.target.value)} style={inputStyle} placeholder="https://discord.gg/servidor" type="url" />
          </Field>
          <Field label="🎮 Twitch">
            <input value={twitch} onChange={e => setTwitch(e.target.value)} style={inputStyle} placeholder="https://twitch.tv/usuario" type="url" />
          </Field>
        </div>
      </div>

      <button type="submit" disabled={loading} className="vh-btn vh-btn--primary" style={{ width: '100%' }}>
        {loading ? '⏳ Guardando...' : '💾 Guardar perfil'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 1rem', borderRadius: 'var(--vh-radius-md)',
  border: '1.5px solid var(--vh-border)', background: 'var(--vh-bg-card)',
  color: 'var(--vh-text-primary)', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', width: '100%',
};