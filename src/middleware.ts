import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const validUser = process.env.BASIC_AUTH_USER ?? "admin";
  const validPass = process.env.BASIC_AUTH_PASSWORD ?? "password";

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    // Edge Runtime では atob() を使用（Buffer は使用不可）
    const decoded = atob(authHeader.slice(6));
    const colonIdx = decoded.indexOf(":");
    if (colonIdx !== -1) {
      const user = decoded.slice(0, colonIdx);
      const pass = decoded.slice(colonIdx + 1);
      if (user === validUser && pass === validPass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Reading Tracker"',
    },
  });
}

export const config = {
  // _next/static, _next/image, favicon.ico は認証不要
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
