import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }));

  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    console.error('APP_PASSWORD is not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('auth', expected, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
