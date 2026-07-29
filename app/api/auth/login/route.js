import { NextResponse } from 'next/server';
import { buildSessionToken, SESSION_COOKIE_NAME } from '@/lib/authNode';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const codigo = (body.codigo || '').trim();

  if (!process.env.STAFF_ACCESS_CODE) {
    return NextResponse.json(
      { error: 'El servidor no tiene configurado STAFF_ACCESS_CODE. Revisa las variables de entorno en Vercel.' },
      { status: 500 }
    );
  }

  if (codigo !== process.env.STAFF_ACCESS_CODE) {
    return NextResponse.json({ error: 'Código de acceso incorrecto.' }, { status: 401 });
  }

  const token = buildSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 horas
  });
  return response;
}
