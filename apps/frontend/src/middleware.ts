import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define rutas públicas y privadas
const PUBLIC_PATHS = ["/authentication/login", "/authentication/register"];
const PRIVATE_PATHS = ["/dashboard", "/profile"]; // Agrega aquí tus rutas privadas

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get("is_logged_in")?.value === "true";
  const { pathname } = request.nextUrl;

  // Proteger rutas públicas: si está autenticado, redirigir a inicio
  if (PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Proteger rutas privadas: si NO está autenticado, redirigir a login
  if (PRIVATE_PATHS.some((privatePath) => pathname.startsWith(privatePath))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/authentication/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
