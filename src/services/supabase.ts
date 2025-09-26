import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars on import.meta.env. To keep TypeScript happy across environments,
// cast import.meta to any here so CI/local builds without Vite types won't fail.
const meta: any = import.meta;

// Debug: show which env keys Vite injected at runtime (open browser console)
try {
  // Object.keys may throw if meta.env is not a plain object in some runtimes; guard it.
  // eslint-disable-next-line no-console
  console.debug('VITE env keys:', meta?.env ? Object.keys(meta.env) : 'no import.meta.env');
} catch (e) {
  // eslint-disable-next-line no-console
  console.debug('Error inspecting import.meta.env', e);
}

// Read vars with a small runtime fallback for clearer diagnostics.
// Note: Vite injects these at build/dev-server start — restarting the dev server is required after changing .env files.
const supabaseUrl = meta.env?.VITE_SUPABASE_URL ?? (typeof process !== 'undefined' ? (process as any).env?.VITE_SUPABASE_URL : undefined);
const supabaseKey = meta.env?.VITE_SUPABASE_ANON_KEY ?? (typeof process !== 'undefined' ? (process as any).env?.VITE_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error('import.meta.env:', meta?.env);
  throw new Error(
    'Supabase URL and anon key are required. Ensure .env.local contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, restart the Vite dev server, and confirm you are running the app with Vite.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
