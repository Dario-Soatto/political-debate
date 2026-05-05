import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PASSWORD = 'jackson';

export function middleware(request: NextRequest) {
  const auth = request.cookies.get('auth')?.value;
  if (auth !== PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
