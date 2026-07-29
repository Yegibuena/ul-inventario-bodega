import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = getSupabaseServerClient();

  const { data: kits, error } = await supabase.from('kits').select('*').order('nombre');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: items, error: itemsError } = await supabase
    .from('kit_items')
    .select('*, articulos(nombre_articulo, cantidad_actual, cantidad_minima, es_consumible)');
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  const kitsConItems = kits.map((kit) => ({
    ...kit,
    items: items.filter((i) => i.kit_id === kit.id),
  }));

  return NextResponse.json({ kits: kitsConItems });
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const { nombre, descripcion, items } = body;

  if (!nombre || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Faltan campos: nombre del kit y al menos un item (sku + cantidad_requerida).' },
      { status: 400 }
    );
  }

  const { data: kit, error: kitError } = await supabase
    .from('kits')
    .insert({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null })
    .select()
    .single();

  if (kitError) {
    if (kitError.code === '23505') {
      return NextResponse.json({ error: `Ya existe un kit llamado "${nombre}".` }, { status: 409 });
    }
    return NextResponse.json({ error: kitError.message }, { status: 400 });
  }

  const filasItems = items.map((it) => ({
    kit_id: kit.id,
    sku: it.sku,
    cantidad_requerida: parseInt(it.cantidad_requerida, 10) || 1,
  }));

  const { error: itemsError } = await supabase.from('kit_items').insert(filasItems);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  return NextResponse.json({ kit }, { status: 201 });
}
