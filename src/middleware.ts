import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Redirect unauthenticated users from main page to landing page
    if (req.nextUrl.pathname === "/" && !req.nextauth.token) {
      return NextResponse.redirect(new URL("/landing", req.url));
    }

    // Redirect authenticated users from landing page to main page
    if (req.nextUrl.pathname === "/landing" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard and other authenticated routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        // Allow access to landing page and auth pages
        if (
          req.nextUrl.pathname === "/landing" ||
          req.nextUrl.pathname.startsWith("/auth/")
        ) {
          return true;
        }
        // Protect main page - require authentication
        if (req.nextUrl.pathname === "/") {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/", "/landing", "/dashboard/:path*", "/api/user/:path*"],
};
