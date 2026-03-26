import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware simplificado - solo verifica cookie de sesión
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Verificar cookie de sesión de NextAuth
  const sessionCookie = request.cookies.get("next-auth.session-token") || 
                        request.cookies.get("__Secure-next-auth.session-token");
  
  console.log("[Middleware] Path:", pathname);
  console.log("[Middleware] Cookie exists:", !!sessionCookie);

  // Solo verificar si hay cookie para rutas /admin
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie) {
      console.log("[Middleware] No session cookie, redirecting to login");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "AccessDenied");
      loginUrl.searchParams.set("message", "Debes iniciar sesión");
      return NextResponse.redirect(loginUrl);
    }
    // Si hay cookie, dejar pasar - la verificación de ADMIN se hace en la página
    console.log("[Middleware] Session cookie exists, allowing");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
