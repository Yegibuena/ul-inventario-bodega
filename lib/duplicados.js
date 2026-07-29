// Tema 1.5 del curso: uso de sets para detectar artículos "casi iguales" que
// el staff pudo haber escrito distinto (ej. "Balon Futbol" vs "Balón de Fútbol").
// La idea algorítmica: convertimos cada nombre en un SET de palabras normalizadas
// y comparamos qué tan parecidos son dos sets con el índice de Jaccard
// (tamaño de la intersección / tamaño de la unión). No es texto exacto,
// es comparar "conjuntos de conceptos".

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos: á->a, ó->o, etc.
    .replace(/[^a-z0-9\s]/g, ' ');
}

const PALABRAS_IGNORADAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'y']);

function aSetDePalabras(texto) {
  const palabras = normalizar(texto).split(/\s+/).filter((p) => p && !PALABRAS_IGNORADAS.has(p));
  return new Set(palabras);
}

function similitudJaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let interseccion = 0;
  for (const palabra of setA) {
    if (setB.has(palabra)) interseccion += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return interseccion / union;
}

const UMBRAL_SIMILITUD = 0.5;

/**
 * Compara un nombre de artículo nuevo contra el catálogo existente del mismo
 * club y regresa los que se parecen "sospechosamente", usando sets en vez de
 * comparación de texto exacto.
 */
export function encontrarPosiblesDuplicados(nombreNuevo, club, articulosExistentes) {
  const setNuevo = aSetDePalabras(nombreNuevo);
  if (setNuevo.size === 0) return [];

  const candidatos = articulosExistentes.filter(
    (a) => normalizar(a.club) === normalizar(club)
  );

  const parecidos = [];
  for (const articulo of candidatos) {
    const setExistente = aSetDePalabras(articulo.nombre_articulo);
    const similitud = similitudJaccard(setNuevo, setExistente);
    if (similitud >= UMBRAL_SIMILITUD) {
      parecidos.push({ sku: articulo.sku, nombre_articulo: articulo.nombre_articulo, similitud });
    }
  }

  return parecidos.sort((a, b) => b.similitud - a.similitud);
}
