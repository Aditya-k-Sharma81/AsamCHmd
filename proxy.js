import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request) {
  const token = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const session = token ? await verifyToken(token) : null;

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'ADMIN') {
      // Redirect to their respective dashboards
      if (session.role === 'SELLER') {
        return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/products', request.url));
    }
  }

  // Protect Seller Routes
  if (pathname.startsWith('/seller')) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'SELLER') {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/products', request.url));
    }
  }

  // Protect User Routes (Browse Catalog, Orders, Profile)
  const isUserRoute = 
    pathname.startsWith('/products') || 
    pathname.startsWith('/orders') || 
    pathname.startsWith('/profile');

  if (isUserRoute) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'USER') {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (session.role === 'SELLER') {
        return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      }
    }
  }

  // Redirect authenticated users away from login/register pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (session.role === 'SELLER') {
        return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/products', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/seller/:path*',
    '/products/:path*',
    '/products',
    '/orders/:path*',
    '/orders',
    '/profile/:path*',
    '/profile',
    '/login',
    '/register',
  ],
};
