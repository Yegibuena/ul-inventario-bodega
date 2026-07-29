import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data: articulos, error } = await supabase
    .from('articulos')
    .select('status, club, es_consumible, nombre_articulo, sku, cantidad_actual, cantidad_minima');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const duraderos = articulos.filter((a) => !a.es_consumible);
  const total = duraderos.length;
  const en_bodega = duraderos.filter((a) => a.status === 'en_bodega').length;
  const prestado = duraderos.filter((a) => a.status === 'prestado').length;
  const perdido = duraderos.filter((a) => a.status === 'perdido').length;

  const porClub = {};
  for (const a of duraderos) {
    porClub[a.club] = (porClub[a.club] || 0) + 1;
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: vencidos, error: vencidosError } = await supabase
    .from('prestamos')
    .select('*, articulos(nombre_articulo, club)')
    .eq('status', 'activo')
    .lt('fecha_devolucion_estimada', hoy);

  if (vencidosError) return NextResponse.json({ error: vencidosError.message }, { status: 400 });

  // Consumibles por debajo de su mínimo
  const consumiblesBajoMinimo = articulos.filter(
    (a) => a.es_consumible && a.cantidad_minima != null && (a.cantidad_actual ?? 0) < a.cantidad_minima
  );

  // Duraderos por debajo de su mínimo, por familia (nombre_articulo + club)
  const { data: umbrales } = await supabase.from('umbrales_articulo').select('*');
  const conteoPorFamilia = {};
  for (const a of duraderos) {
    if (a.status !== 'en_bodega') continue;
    const clave = `${a.nombre_articulo}|||${a.club}`;
    conteoPorFamilia[clave] = (conteoPorFamilia[clave] || 0) + 1;
  }
  const duraderosBajoMinimo = (umbrales || [])
    .map((u) => {
      const clave = `${u.nombre_articulo}|||${u.club}`;
      const enBodega = conteoPorFamilia[clave] || 0;
      return { ...u, en_bodega: enBodega };
    })
    .filter((u) => u.en_bodega < u.cantidad_minima);

  return NextResponse.json({
    total,
    en_bodega,
    prestado,
    perdido,
    porClub,
    vencidos: vencidos || [],
    consumiblesBajoMinimo,
    duraderosBajoMinimo,
  });
}
