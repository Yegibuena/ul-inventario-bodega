import { createClient } from '@supabase/supabase-js';

// OJO: este cliente solo debe importarse dentro de código que corre en el
// servidor (route handlers de app/api/*). Nunca se importa desde un
// componente con "use client", así la URL y la key de Supabase nunca
// viajan al navegador ni quedan expuestas en el bundle público.
let cachedClient = null;

export function getSupabaseServerClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltan las variables de entorno SUPABASE_URL / SUPABASE_ANON_KEY. Configúralas en Vercel > Settings > Environment Variables.'
    );
  }

  cachedClient = createClient(url, key, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
