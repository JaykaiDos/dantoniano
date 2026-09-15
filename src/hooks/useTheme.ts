/**
 * Hook para controlar el tema claro/oscuro.
 *
 * El toggle sigue siendo binario (claro / oscuro), pero "claro" ya no es
 * un tema fijo: se resuelve a la estación activa según el mes (ver
 * getSeasonByMonth) y esa estación es la que se escribe en el atributo
 * data-theme del <html> (winter | spring | summer | autumn).
 *
 * El modo oscuro (data-theme="dark") no cambia: sigue siendo un valor fijo.
 *
 * Lee y escribe en localStorage + modifica data-theme en <html>.
 * Evita hydration mismatch inicializando desde el DOM antes del render.
 */
'use client';

import { useEffect, useState } from 'react';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'vh-theme';

/**
 * Convención propia del proyecto (no astronómica):
 *   Invierno  -> Enero, Febrero, Marzo    (meses 0-2)
 *   Primavera -> Abril, Mayo, Junio       (meses 3-5)
 *   Verano    -> Julio, Agosto, Sept.     (meses 6-8)
 *   Otoño     -> Octubre, Nov., Dic.      (meses 9-11)
 *
 * `month` es 0-indexado (0 = Enero), igual que Date.prototype.getMonth().
 * Se exporta para poder testearla o reutilizarla si hace falta.
 */
export function getSeasonByMonth(month: number): Season {
  if (month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

function getCurrentSeason(): Season {
  return getSeasonByMonth(new Date().getMonth());
}

// Lee el modo actual (claro/oscuro) desde el DOM, sin depender de SSR.
// "Claro" es cualquier data-theme que no sea 'dark' (winter/spring/summer/autumn).
function getInitialMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  const current = document.documentElement.getAttribute('data-theme');
  return current === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  // Inicializa desde el DOM para evitar mismatch durante hidratación.
  const [mode, setMode] = useState<ThemeMode>(() => getInitialMode());
  const [season, setSeason] = useState<Season>(() => getCurrentSeason());
  const [mounted, setMounted] = useState(false);

  // Sincroniza una sola vez cuando monta en el cliente.
  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute('data-theme');
    const actualMode: ThemeMode = current === 'dark' ? 'dark' : 'light';
    if (actualMode !== mode) setMode(actualMode);
    setSeason(getCurrentSeason());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);

    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      const activeSeason = getCurrentSeason();
      setSeason(activeSeason);
      document.documentElement.setAttribute('data-theme', activeSeason);
    }

    // Se guarda el modo genérico (no la estación puntual): así, si el
    // usuario vuelve otro mes con "claro" elegido, se recalcula sola.
    localStorage.setItem(STORAGE_KEY, next);
  };

  return {
    // Mantiene la forma anterior del hook (compatibilidad con el resto de la app).
    theme: mode,
    isDark: mode === 'dark',
    toggle,
    mounted,
    // Nuevo: la estación activa, disponible por si algún componente
    // quiere mostrarla (ej. un badge "❄️ Invierno").
    season,
  };
}