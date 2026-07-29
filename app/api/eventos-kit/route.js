import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('eventos_kit')
    .select('*, kits(nombre)')
    .order('creado_en', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ eventos: data });
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const { kit_id, nombre_evento, fecha_evento, foto_url } = body;

  if (!kit_id || !nombre_evento) {
    return NextResponse.json({ error: 'Faltan campos: kit_id y nombre_evento son requeridos.' }, { status: 400 });
  }

  const { data: items, error: itemsError } = await supabase
    .from('kit_items')
    .select('sku, cantidad_requerida, articulos(nombre_articulo, cantidad_actual, cantidad_minima)')
    .eq('kit_id', kit_id);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Este kit no tiene artículos configurados.' }, { status: 400 });
  }

  // Descontamos cada consumible del kit. No bloqueamos si no alcanza — se
  // deja en 0 y se reporta como faltante para que Student Life sepa qué comprar.
  const bajoMinimo = [];
  for (const item of items) {
    const actual = item.articulos?.cantidad_actual ?? 0;
    const nuevaCantidad = Math.max(0, actual - item.cantidad_requerida);

    const { error: updateError } = await supabase
      .from('articulos')
      .update({ cantidad_actual: nuevaCantidad })
      .eq('sku', item.sku);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    const minimo = item.articulos?.cantidad_minima ?? 0;
    if (nuevaCantidad < minimo) {
      bajoMinimo.push({
        sku: item.sku,
        nombre_articulo: item.articulos?.nombre_articulo,
        cantidad_actual: nuevaCantidad,
        cantidad_minima: minimo,
      });
    }
  }

  const { data: evento, error: eventoError } = await supabase
    .from('eventos_kit')
    .insert({
      kit_id,
      nombre_evento: nombre_evento.trim(),
      fecha_evento: fecha_evento || null,
      foto_url: foto_url || null,
    })
    .select()
    .single();

  if (eventoError) return NextResponse.json({ error: eventoError.message }, { status: 400 });

  return NextResponse.json({ evento, bajoMinimo }, { status: 201 });
}
