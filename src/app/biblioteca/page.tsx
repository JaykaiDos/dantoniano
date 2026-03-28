/**
 * Biblioteca personal — lista de animes del reactore con tabs por estado.
 * Server Component con Suspense.
 */
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { BibliotecaTabs } from '@/components/ui/BibliotecaTabs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biblioteca — Dantoniano',
};

export default async function BibliotecaPage() {
  const supabase = await createClient();

  const { data: animes } = await supabase
    .from('animes_with_counts')
    .select('*')
    .not('personal_status', 'is', null)
    .order('personal_score', { ascending: false, nullsFirst: false })
    .order('title');

  const all        = animes ?? [];
  const viendo     = all.filter(a => a.personal_status === 'viendo');
  const pendiente  = all.filter(a => a.personal_status === 'pendiente');
  const completado = all.filter(a => a.personal_status === 'completado');
  const dropeado   = all.filter(a => a.personal_status === 'dropeado');

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view">
          <div className="vh-section-header">
            <div>
              <h2 className="vh-section-title">Biblioteca 📚</h2>
              <p className="vh-section-subtitle">
                {all.length} animes en la lista personal
              </p>
            </div>
            {/* Stats pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: `▶ ${viendo.length} viendo`,         cls: 'vh-badge--playing'  },
                { label: `🕐 ${pendiente.length} pendiente`,  cls: 'vh-badge--pending'  },
                { label: `✅ ${completado.length} completado`,cls: 'vh-badge--finished' },
                { label: `❌ ${dropeado.length} dropeado`,    cls: 'vh-badge--dropped'  },
              ].map(({ label, cls }) => (
                <span key={label} className={`vh-badge ${cls}`}>{label}</span>
              ))}
            </div>
          </div>

          <BibliotecaTabs
            viendo={viendo}
            pendiente={pendiente}
            completado={completado}
            dropeado={dropeado}
          />
        </div>
      </main>
    </>
  );
}