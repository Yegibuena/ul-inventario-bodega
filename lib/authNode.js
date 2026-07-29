import crypto from 'node:crypto';

// Genera el token de sesión: un hash SHA-256 del código de acceso + un secreto
// del servidor. No guardamos "sesiones" en base de datos: el propio hash,
// guardado como cookie httpOnly, ES la sesión. Si alguien no conoce
// STAFF_ACCESS_CODE ni SESSION_SECRET, no puede fabricar un token válido.
export function buildSessionToken() {
  const code = process.env.STAFF_ACCESS_CODE || '';
  const secret = process.env.SESSION_SECRET || '';
  return crypto.createHash('sha256').update(`${code}:${secret}`).digest('hex');
}

export const SESSION_COOKIE_NAME = 'ul_session';
