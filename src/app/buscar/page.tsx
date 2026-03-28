import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { BuscarClient } from '@/components/ui/BuscarClient';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Buscar — Dantoniano' };

export default async function BuscarPage() {
  const supabase = await createClient();

  // Traer todos los animes y temporadas para el buscador client-side
  const [{ data: animes }, { data: seasons }] = await Promise.all([
    supabase.from('animes_with_counts').select('*').order('title'),
    supabase.from('seasons').select('id, name, slug').order('year', { ascending: false }),
  ]);

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view">
          <div className="vh-section-header">
            <div>
              <h2 className="vh-section-title">Buscar 🔍</h2>
              <p className="vh-section-subtitle">
                {animes?.length ?? 0} animes en el catálogo
              </p>
            </div>
          </div>
          <BuscarClient animes={animes ?? []} seasons={seasons ?? []} />
        </div>
      </main>
    </>
  );
}