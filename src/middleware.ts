import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/login') {
    return NextResponse.next();
  }

  const expected = process.env.APP_PASSWORD;
  const auth = request.cookies.get('auth')?.value;
  if (!expected || auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
