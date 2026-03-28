/**
 * Página de login del panel admin.
 * Formulario con las clases vh-* del design system.
 */
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Email o contraseña incorrectos.');
    } else {
      router.push('/admin');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--vh-bg-card)',
        backdropFilter: 'var(--vh-glass-blur)',
        border: '1.5px solid var(--vh-border-card)',
        borderRadius: 'var(--vh-radius-xl)',
        boxShadow: 'var(--vh-shadow-lg)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1 className="vh-section-title" style={{ fontSize: '1.4rem' }}>
            Panel Admin
          </h1>
          <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Acceso exclusivo para Dantoniano
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--vh-danger-bg)',
              border: '1px solid var(--vh-danger)',
              borderRadius: 'var(--vh-radius-md)',
              color: 'var(--vh-danger)',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>
              Email
            </label>
            <div className="vh-search-bar__wrapper" style={{ maxWidth: 'none', padding: '0 1rem' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ejemplo.com"
                className="vh-search-bar__input"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>
              Contraseña
            </label>
            <div className="vh-search-bar__wrapper" style={{ maxWidth: 'none', padding: '0 1rem' }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="vh-search-bar__input"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="vh-btn vh-btn--primary"
            style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
          >
            {loading ? '⏳ Verificando...' : '🔑 Ingresar al panel'}
          </button>
        </div>
      </div>
    </div>
  );
}