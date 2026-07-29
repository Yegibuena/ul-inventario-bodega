import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { normalizarSku } from '@/lib/validators';

// Tema 2.14 (Hacer que la máquina lea documentos): este endpoint abre el Excel
// real de la bodega y lo convierte en filas utilizables.
// Tema 3.22 (Data Cleaning — "80% del valor está aquí"): antes de insertar,
// normalizamos texto, generamos SKUs faltantes y quitamos duplicados con un Set.

// Alias de encabezados: el Excel real de Student Life puede no llamarse igual
// que nuestras columnas, así que aceptamos varias formas comunes por campo.
const ALIAS = {
  nombre_articulo: ['articulo', 'artículo', 'nombre', 'material', 'item', 'producto'],
  club: ['club', 'area', 'área', 'departamento', 'equipo'],
  descripcion: ['descripcion', 'descripción', 'detalle', 'notas', 'observaciones'],
  sku: ['sku', 'id', 'identificador', 'clave', 'codigo', 'código'],
  estado_calidad: ['estado', 'calidad', 'condicion', 'condición'],
};

function normalizarEncabezado(texto) {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tituloCaso(texto) {
  return (texto || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\p{L}/gu, (letra) => letra.toUpperCase());
}

function mapearFila(filaCruda, encabezados) {
  const fila = {};
  for (const [campo, alias] of Object.entries(ALIAS)) {
    const encabezadoEncontrado = encabezados.find((h) => alias.includes(normalizarEncabezado(h)));
    fila[campo] = encabezadoEncontrado ? filaCruda[encabezadoEncontrado] : undefined;
  }
  return fila;
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  const formData = await request.formData();
  const file = formData.get('archivo');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No se recibió ningún archivo de Excel.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
  const filasCrudas = XLSX.utils.sheet_to_json(primeraHoja, { defval: '' });

  if (filasCrudas.length === 0) {
    return NextResponse.json({ error: 'El Excel no tiene filas de datos en la primera hoja.' }, { status: 400 });
  }

  const encabezados = Object.keys(filasCrudas[0]);

  const { data: existentes } = await supabase.from('articulos').select('sku');
  const skusExistentes = new Set((existentes || []).map((a) => a.sku));

  // Set para deduplicar dentro del PROPIO archivo (dos filas iguales en el Excel)
  const clavesVistasEnArchivo = new Set();

  const limpios = [];
  const omitidos = [];
  let contadorAutoSku = {};

  for (const [indice, filaCruda] of filasCrudas.entries()) {
    const fila = mapearFila(filaCruda, encabezados);
    const nombre = tituloCaso(fila.nombre_articulo);
    const club = tituloCaso(fila.club);

    if (!nombre || !club) {
      omitidos.push({ fila: indice + 2, motivo: 'Falta artículo o club' });
      continue;
    }

    const claveDedupe = `${normalizarEncabezado(nombre)}|${normalizarEncabezado(club)}`;
    if (clavesVistasEnArchivo.has(claveDedupe)) {
      omitidos.push({ fila: indice + 2, motivo: 'Duplicado dentro del mismo Excel' });
      continue;
    }
    clavesVistasEnArchivo.add(claveDedupe);

    // Si el Excel no trae SKU, se genera uno a partir del club + un contador (loop).
    let sku = (fila.sku || '').toString().trim().toUpperCase();
    if (!sku) {
      const prefijo = club
        .split(' ')
        .map((p) => p.slice(0, 3).toUpperCase())
        .join('')
        .slice(0, 6) || 'GEN';
      contadorAutoSku[prefijo] = (contadorAutoSku[prefijo] || 0) + 1;
      sku = `${prefijo}-${String(contadorAutoSku[prefijo]).padStart(3, '0')}`;
    }
    sku = normalizarSku(sku);

    if (skusExistentes.has(sku) || clavesVistasEnArchivo.has(`sku:${sku}`)) {
      omitidos.push({ fila: indice + 2, motivo: `SKU "${sku}" ya existe` });
      continue;
    }
    clavesVistasEnArchivo.add(`sku:${sku}`);

    const estadoRaw = normalizarEncabezado(fila.estado_calidad);
    const estadosValidos = ['nuevo', 'bueno', 'regular', 'danado'];
    const estado_calidad = estadosValidos.includes(estadoRaw)
      ? (estadoRaw === 'danado' ? 'dañado' : estadoRaw)
      : 'bueno';

    limpios.push({
      sku,
      nombre_articulo: nombre,
      club,
      descripcion: (fila.descripcion || '').toString().trim() || null,
      estado_calidad,
      status: 'en_bodega',
    });
  }

  if (limpios.length === 0) {
    return NextResponse.json({ error: 'No quedó ninguna fila válida después de la limpieza.', omitidos }, { status: 400 });
  }

  const { data, error } = await supabase.from('articulos').insert(limpios).select();
  if (error) return NextResponse.json({ error: error.message, omitidos }, { status: 400 });

  return NextResponse.json({
    insertados: data.length,
    omitidos: omitidos.length,
    detalleOmitidos: omitidos,
    articulos: data,
  });
}
