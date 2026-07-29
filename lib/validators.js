// Tema 1.9 del curso: expresiones regulares para validar formatos antes de
// que lleguen a la base de datos.

// Todo SKU de Student Life empieza con "SL-" (marca institucional), seguido
// del mismo patrón de antes: SL-LETRAS-LETRAS-NUMERO, ej. SL-BAL-FUT-001
export const SKU_REGEX = /^SL-[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,4}-[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,8}-\d{2,4}$/;

// El prefijo, solo (para validar el caso de alta masiva, sin el número final)
export const PREFIJO_SKU_REGEX = /^SL-[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,4}-[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,8}$/;

// Matrícula esperada: AL-AÑO-NUMERO, ej. AL-2026-0042
export const MATRICULA_REGEX = /^[A-Za-z]{2,4}-\d{4}-\d{3,5}$/;

export function validarSku(sku) {
  return SKU_REGEX.test((sku || '').trim());
}

export function validarPrefijoSku(prefijo) {
  return PREFIJO_SKU_REGEX.test((prefijo || '').trim());
}

export function validarMatricula(matricula) {
  return MATRICULA_REGEX.test((matricula || '').trim());
}

// Antepone "SL-" automáticamente si el staff no lo escribió, para que no
// tenga que acordarse de teclearlo cada vez.
export function normalizarSku(sku) {
  const limpio = (sku || '').trim().toUpperCase();
  return limpio.startsWith('SL-') ? limpio : `SL-${limpio}`;
}

export const SKU_EJEMPLO = 'SL-BAL-FUT-001';
export const MATRICULA_EJEMPLO = 'AL-2026-0042';
