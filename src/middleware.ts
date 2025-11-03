import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/auth") && req.nextauth.token) {
      return NextResponse.redirect(new URL("/", req.url)); // redirect to landing if logged in
    }

    // No need to handle "/" anymore since it's public landing page
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Protect dashboard and other authenticated routes
        if (pathname.startsWith("/dashboard")) {
          return !!token;
        }

        // Allow access to landing page and auth pages
        if (pathname.startsWith("/auth") || pathname === "/") {
          return true;
        }

        return !!token; // default protection for other pages if needed
      },
    },
  }
);

export const config = {
  matcher: ["/", "/dashboard/:path*", "/auth/:path*"], // no /landing anymore
};
