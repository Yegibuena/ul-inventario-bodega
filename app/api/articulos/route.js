import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { validarSku, validarPrefijoSku, normalizarSku, SKU_EJEMPLO } from '@/lib/validators';
import { encontrarPosiblesDuplicados } from '@/lib/duplicados';

export async function GET(request) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const club = searchParams.get('club');
  const q = searchParams.get('q');
  const tipo = searchParams.get('tipo'); // 'consumible' | 'duradero'

  let query = supabase.from('articulos').select('*').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (club) query = query.eq('club', club);
  if (q) query = query.or(`sku.ilike.%${q}%,nombre_articulo.ilike.%${q}%`);
  if (tipo === 'consumible') query = query.eq('es_consumible', true);
  if (tipo === 'duradero') query = query.eq('es_consumible', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ articulos: data });
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const {
    sku, nombre_articulo, club, descripcion, estado_calidad, foto_url, cantidad,
    es_consumible, cantidad_actual, cantidad_minima, cantidad_maxima,
  } = body;

  if (!sku || !nombre_articulo || !club) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios: sku, nombre_articulo y club son requeridos.' },
      { status: 400 }
    );
  }

  // --- Camino 1: CONSUMIBLE (una sola fila, con cantidad) ---
  if (es_consumible) {
    const skuFinal = normalizarSku(sku);
    if (!validarSku(skuFinal)) {
      return NextResponse.json(
        { error: `El SKU "${sku}" no tiene el formato esperado (ej. ${SKU_EJEMPLO}).` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('articulos')
      .insert({
        sku: skuFinal,
        nombre_articulo: nombre_articulo.trim(),
        club: club.trim(),
        descripcion: descripcion?.trim() || null,
        estado_calidad: estado_calidad || 'bueno',
        foto_url: foto_url || null,
        status: 'en_bodega',
        es_consumible: true,
        cantidad_actual: parseInt(cantidad_actual, 10) || 0,
        cantidad_minima: parseInt(cantidad_minima, 10) || 0,
        cantidad_maxima: cantidad_maxima ? parseInt(cantidad_maxima, 10) : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: `El SKU "${skuFinal}" ya existe.` }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ articulos: [data], posiblesDuplicados: [] }, { status: 201 });
  }

  // --- Camino 2: DURADERO (una fila por unidad física, con SKU único) ---
  const numCantidad = Math.min(Math.max(parseInt(cantidad, 10) || 1, 1), 50); // tope de 50 por lote

  if (numCantidad === 1 && !validarSku(normalizarSku(sku))) {
    return NextResponse.json(
      { error: `El SKU "${sku}" no tiene el formato esperado (ej. ${SKU_EJEMPLO}).` },
      { status: 400 }
    );
  }

  const { data: existentes } = await supabase.from('articulos').select('sku, nombre_articulo, club');
  const posiblesDuplicados = encontrarPosiblesDuplicados(nombre_articulo, club, existentes || []);

  // Tema 1.7 (Loops): alta masiva. "cantidad" unidades idénticas, SKU incremental.
  const prefijo = numCantidad === 1 ? null : normalizarSku(sku);
  let siguienteNumero = 1;

  if (prefijo) {
    if (!validarPrefijoSku(prefijo)) {
      return NextResponse.json(
        { error: `Para alta masiva, escribe el SKU sin número, como prefijo (ej. BAL-FUT → se guarda como SL-BAL-FUT). Recibido: "${sku}".` },
        { status: 400 }
      );
    }
    const conflictos = (existentes || []).filter((a) => a.sku.startsWith(`${prefijo}-`));
    const numerosUsados = conflictos.map((a) => parseInt(a.sku.split('-').pop(), 10)).filter((n) => !isNaN(n));
    siguienteNumero = numerosUsados.length ? Math.max(...numerosUsados) + 1 : 1;
  }

  const nuevosArticulos = [];
  for (let i = 0; i < numCantidad; i += 1) {
    const skuFinal = prefijo
      ? `${prefijo}-${String(siguienteNumero + i).padStart(3, '0')}`
      : normalizarSku(sku);

    nuevosArticulos.push({
      sku: skuFinal,
      nombre_articulo: nombre_articulo.trim(),
      club: club.trim(),
      descripcion: descripcion?.trim() || null,
      estado_calidad: estado_calidad || 'bueno',
      foto_url: foto_url || null,
      status: 'en_bodega',
      es_consumible: false,
    });
  }

  const { data, error } = await supabase.from('articulos').insert(nuevosArticulos).select();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Alguno de los SKUs ya existe. Cada unidad física necesita un SKU distinto (ej. ${SKU_EJEMPLO}).` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ articulos: data, posiblesDuplicados }, { status: 201 });
}
