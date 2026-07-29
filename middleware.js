import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'ul_session';

// El middleware corre en el runtime "Edge" de Vercel, que sí trae la Web
// Crypto API (globalThis.crypto.subtle) de forma nativa, por eso el hash
// se recalcula aquí con SubtleCrypto en vez de con el módulo "crypto" de Node.
async function expectedToken() {
  const code = process.env.STAFF_ACCESS_CODE || '';
  const secret = process.env.SESSION_SECRET || '';
  const encoder = new TextEncoder();
  const data = encoder.encode(`${code}:${secret}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = cookie && cookie === (await expectedToken());

  if (!valid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
