import { SeasonForm } from '@/components/admin/SeasonForm';

export default function NuevaTemporadaPage() {
  return (
    <div style={{ maxWidth: '560px' }}>
      <h1 style={{
        fontFamily: 'var(--font-playfair, Georgia, serif)',
        fontSize: '1.75rem', fontWeight: 700,
        color: 'var(--vh-text-primary)', marginBottom: '1.75rem',
      }}>
        Nueva temporada 📅
      </h1>
      <SeasonForm />
    </div>
  );
}