import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Screenshot bypass: allow access to all routes when special cookie is set
  if (request.cookies.get("nk_screenshot_bypass")?.value === "nusuk2026") {
    return NextResponse.next({ request });
  }

  // If env vars are missing (e.g. Vercel deployment without variables set),
  // skip auth and let the app handle it gracefully rather than crashing middleware.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() validates the JWT via a live network call to Supabase Auth.
  // Wrap in try-catch so a transient network failure (DNS, timeout, cold-start)
  // never produces a 500 for the entire site.  On failure we treat the user as
  // unauthenticated (fail-secure): protected routes are blocked, public routes
  // are allowed through.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Supabase Auth unreachable — fail secure: treat as unauthenticated.
    user = null;
  }

  const { pathname } = request.nextUrl;

  // Only truly public paths — no session required.
  // /pending-approval and /rejected require auth; unauthenticated users
  // attempting to reach them are redirected to /login by the guard below.
  //
  // Each entry ends with "/" to prevent startsWith from accidentally matching
  // paths like "/login-help" or "/register-admin".
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ];
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
