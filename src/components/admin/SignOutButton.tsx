'use client';
import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/admin/login' })}
      style={{
        width: '100%', padding: '0.5rem 0.75rem',
        borderRadius: 'var(--vh-radius-md)',
        border: '1.5px solid var(--vh-border)',
        background: 'transparent',
        color: 'var(--vh-danger)', fontSize: '0.8rem',
        fontWeight: 600, cursor: 'pointer',
        transition: 'all var(--vh-transition)',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}
    >
      🚪 Cerrar sesión
    </button>
  );
}