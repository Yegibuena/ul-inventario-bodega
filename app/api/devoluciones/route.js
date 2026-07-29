import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const { prestamo_id, matricula_alumno, estado_calidad_regreso } = body;

  if (!prestamo_id || !matricula_alumno || !estado_calidad_regreso) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios: prestamo_id, matrícula y estado de calidad son requeridos.' },
      { status: 400 }
    );
  }

  const { data: prestamo, error: prestamoError } = await supabase
    .from('prestamos')
    .select('*')
    .eq('id', prestamo_id)
    .single();

  if (prestamoError || !prestamo) {
    return NextResponse.json({ error: 'No se encontró el préstamo indicado.' }, { status: 404 });
  }

  if (prestamo.status !== 'activo') {
    return NextResponse.json({ error: 'Este préstamo ya fue cerrado (devuelto o marcado como perdido).' }, { status: 409 });
  }

  const esPerdido = estado_calidad_regreso === 'perdido';

  const { data: devolucion, error: devolucionError } = await supabase
    .from('devoluciones')
    .insert({
      prestamo_id,
      sku: prestamo.sku,
      matricula_alumno: matricula_alumno.trim(),
      estado_calidad_regreso,
    })
    .select()
    .single();

  if (devolucionError) return NextResponse.json({ error: devolucionError.message }, { status: 400 });

  const { error: prestamoUpdateError } = await supabase
    .from('prestamos')
    .update({ status: esPerdido ? 'perdido' : 'devuelto' })
    .eq('id', prestamo_id);

  if (prestamoUpdateError) return NextResponse.json({ error: prestamoUpdateError.message }, { status: 400 });

  const articuloUpdate = esPerdido
    ? { status: 'perdido' }
    : { status: 'en_bodega', estado_calidad: estado_calidad_regreso };

  const { error: articuloError } = await supabase
    .from('articulos')
    .update(articuloUpdate)
    .eq('sku', prestamo.sku);

  if (articuloError) return NextResponse.json({ error: articuloError.message }, { status: 400 });

  return NextResponse.json({ devolucion }, { status: 201 });
}
