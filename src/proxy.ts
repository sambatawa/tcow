import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/api/auth/login", "/api/auth/register", "/api/auth/verify-email","/api/auth/verify-kode",
  "/api/auth/forgot-password", "/api/auth/resend-verification", "/api/auth/verification-status", "/api/auth/cleanup-expired", 
  "/api/auth/google","/api/auth/logout", "/api/sapi/scan"];
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
];
function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin : ALLOWED_ORIGINS[0] || "http://localhost:3000";

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    return addCorsHeaders(response, origin);
  }
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const response = NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
    return addCorsHeaders(response, origin);
  }

  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.uid as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-role", payload.role as string);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return addCorsHeaders(response, origin);
  } catch (error) {
    const response = NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
    return addCorsHeaders(response, origin);
  }
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
