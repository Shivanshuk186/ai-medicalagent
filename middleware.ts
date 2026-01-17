import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Temporarily make all routes public until valid Clerk keys are configured
const isPublicRoute = createRouteMatcher(['(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Authentication disabled - update Clerk keys in .env to enable
  // if (!isPublicRoute(req)) {
  //   await auth.protect()
  // }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}