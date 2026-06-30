import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .replace("https://", "")
  .split(".")[0];
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

function isAuthCookieName(name: string): boolean {
  if (name === STORAGE_KEY) return true;
  if (name.startsWith(STORAGE_KEY + ".")) {
    const suffix = name.slice(STORAGE_KEY.length + 1);
    return /^(0|[1-9][0-9]*)$/.test(suffix);
  }
  return false;
}

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const requestCookies = request.cookies.getAll();

  const response = NextResponse.redirect(new URL("/login", origin));

  // Step 1: call signOut() to revoke the token server-side.
  // Use request.cookies directly so the Supabase client can read the session —
  // next/headers cookies() may not surface request cookies in Route Handlers
  // the same way NextRequest.cookies does.
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => requestCookies,
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    await supabase.auth.signOut();
  } catch {
    // Ignore — we always clear cookies below regardless
  }

  // Step 2: directly clear auth cookies (belt-and-suspenders).
  // Runs after signOut() so it overrides any Set-Cookie from a token refresh
  // that may have happened inside __loadSession() during signOut().
  requestCookies
    .filter((c) => isAuthCookieName(c.name))
    .forEach(({ name }) => {
      response.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        httpOnly: false,
        sameSite: "lax",
      });
    });

  return response;
}
