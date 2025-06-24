import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenExpired } from "@/utils/jwt";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (request.nextUrl.pathname.startsWith("/authentication")) {
    if (!token || isTokenExpired(token)) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
