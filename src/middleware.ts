import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

let exportedMiddleware = (request: NextRequest) => NextResponse.next();

if (isClerkConfigured) {
  try {
    const { clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server');
    const isPublicRoute = createRouteMatcher(['/', '/login(.*)', '/signup(.*)', '/api/users/sync-clerk']);
    
    exportedMiddleware = clerkMiddleware(async (auth: any, req: any) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    });
  } catch (e) {
    console.warn('Failed to load Clerk middleware, falling back to mock mode:', e);
  }
}

export default function middleware(request: NextRequest, event: any) {
  return (exportedMiddleware as any)(request, event);
}

export const config = {
  matcher: ['/((?!_next|[^?]*\\.[^?]*$).*)'],
};
