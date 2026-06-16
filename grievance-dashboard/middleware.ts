import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // CM dashboard: only 'cm' role
    if (path.startsWith('/cm') && token?.role !== 'cm') {
      return NextResponse.redirect(new URL('/cm/login', req.url));
    }

    // Secretariat/Admin: 'admin' or 'cm' role
    if (
      path.startsWith('/secretariat') &&
      !['admin', 'cm'].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL('/secretariat/login', req.url));
    }

    // Citizen routes: only 'citizen' role
    if (path.startsWith('/citizen') && token?.role !== 'citizen') {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/citizen/:path*', '/secretariat/:path*', '/cm/dashboard/:path*'],
};
