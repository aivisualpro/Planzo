import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard", "/admin", "/inventory", "/"];
const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => 
    route === "/" ? path === "/" : path.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get("vb_session")?.value;
  let session = null;
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      // Invalid session
    }
  }

  // 4. Redirect to /login if the user is not authenticated and trying to access a protected route
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated and trying to access a public route (like /login) or the home page
  if (session && (path === "/login" || path === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Allow access to home page and login if not authenticated
  // Or if authenticated, allow access to protected routes
  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
