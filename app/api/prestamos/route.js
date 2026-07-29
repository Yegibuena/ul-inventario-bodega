import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { validarMatricula, MATRICULA_EJEMPLO } from '@/lib/validators';

export async function GET(request) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'activo';

  let query = supabase
    .from('prestamos')
    .select('*, articulos(nombre_articulo, club, foto_url)')
    .order('created_at', { ascending: false });

  if (status !== 'todos') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ prestamos: data });
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const { sku, matricula_alumno, fecha_devolucion_estimada } = body;

  if (!sku || !matricula_alumno) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios: sku y matrícula del alumno son requeridos.' },
      { status: 400 }
    );
  }

  if (!validarMatricula(matricula_alumno)) {
    return NextResponse.json(
      { error: `La matrícula "${matricula_alumno}" no tiene el formato esperado (ej. ${MATRICULA_EJEMPLO}).` },
      { status: 400 }
    );
  }

  const { data: articulo, error: articuloError } = await supabase
    .from('articulos')
    .select('*')
    .eq('sku', sku.trim())
    .single();

  if (articuloError || !articulo) {
    return NextResponse.json({ error: `No existe ningún artículo con SKU "${sku}".` }, { status: 404 });
  }

  if (articulo.status !== 'en_bodega') {
    const mensajes = {
      prestado: 'ya está prestado a otro alumno',
      perdido: 'está marcado como perdido',
    };
    return NextResponse.json(
      { error: `El artículo "${articulo.nombre_articulo}" (${sku}) ${mensajes[articulo.status] || 'no está disponible'}.` },
      { status: 409 }
    );
  }

  const { data: prestamo, error: prestamoError } = await supabase
    .from('prestamos')
    .insert({
      sku: sku.trim(),
      matricula_alumno: matricula_alumno.trim(),
      fecha_devolucion_estimada: fecha_devolucion_estimada || null,
      status: 'activo',
    })
    .select()
    .single();

  if (prestamoError) return NextResponse.json({ error: prestamoError.message }, { status: 400 });

  const { error: updateError } = await supabase
    .from('articulos')
    .update({ status: 'prestado' })
    .eq('sku', sku.trim());

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ prestamo }, { status: 201 });
}
