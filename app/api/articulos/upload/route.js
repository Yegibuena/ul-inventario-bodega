import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const formData = await request.formData();
  const file = formData.get('foto');
  const sku = formData.get('sku') || 'sin-sku';

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }

  const extension = file.name?.split('.').pop() || 'jpg';
  const path = `${sku}-${Date.now()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from('fotos-articulos')
    .upload(path, arrayBuffer, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: publicUrlData } = supabase.storage.from('fotos-articulos').getPublicUrl(path);
  return NextResponse.json({ foto_url: publicUrlData.publicUrl });
}
