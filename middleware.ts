import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/about', '/boarding'];
const PROTECTED_PATHS = ['/dashboard', '/sales', '/products', '/clients', '/commandes', '/alerts', '/users', '/update', '/depenses', '/dettes', '/fournisseurs', '/transactions', '/categories', '/periode', '/list', '/chat'];
const ADMIN_ONLY_PATHS = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userId = request.cookies.get('userId')?.value;
  const isAdmin = request.cookies.get('isAdmin')?.value === '1';

  // Not logged-in user trying to access protected routes → redirect to login
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (!userId && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Non-admin trying to access admin-only routes → redirect home
  const isAdminOnly = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p));
  if (userId && isAdminOnly && !isAdmin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|logo|lok|manifest|sw\\.js|workbox).*)'],
};
