import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('umbrales_articulo').select('*').order('nombre_articulo');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ umbrales: data });
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const { nombre_articulo, club, cantidad_minima, cantidad_maxima } = body;

  if (!nombre_articulo || !club || cantidad_minima === undefined) {
    return NextResponse.json(
      { error: 'Faltan campos: nombre_articulo, club y cantidad_minima son requeridos.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('umbrales_articulo')
    .upsert(
      {
        nombre_articulo: nombre_articulo.trim(),
        club: club.trim(),
        cantidad_minima: parseInt(cantidad_minima, 10) || 0,
        cantidad_maxima: cantidad_maxima ? parseInt(cantidad_maxima, 10) : null,
      },
      { onConflict: 'nombre_articulo,club' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ umbral: data }, { status: 201 });
}
