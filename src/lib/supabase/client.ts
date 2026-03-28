/**
 * Supabase client para uso en el browser (Client Components).
 * Usa createBrowserClient de @supabase/ssr para manejar cookies correctamente.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}