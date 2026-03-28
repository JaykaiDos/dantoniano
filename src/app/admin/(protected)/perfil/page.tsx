import { createAdminClient } from '@/lib/supabase/admin';
import { ProfileForm } from '@/components/admin/ProfileForm';

export default async function AdminPerfilPage() {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from('profile').select('*').single();

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{
        fontFamily: 'var(--font-playfair, Georgia, serif)',
        fontSize: '1.75rem', fontWeight: 700,
        color: 'var(--vh-text-primary)', marginBottom: '1.75rem',
      }}>
        Mi Perfil 👤
      </h1>
      <ProfileForm profile={profile} />
    </div>
  );
}