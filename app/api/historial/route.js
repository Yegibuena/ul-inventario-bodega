import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(request) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const matricula = searchParams.get('matricula');

  let query = supabase.from('historial_movimientos').select('*').order('fecha', { ascending: false }).order('hora', { ascending: false }).limit(200);

  if (sku) query = query.eq('sku', sku);
  if (matricula) query = query.eq('matricula_alumno', matricula);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ historial: data });
}
