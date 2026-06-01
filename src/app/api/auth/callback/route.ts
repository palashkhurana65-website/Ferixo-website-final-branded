import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/admin/products";

  if (code) {
    // 🚀 Next.js 16.2.6 requirement: cookies must be awaited
    const cookieStore = await cookies();
    
    // Create a temporary server-side client to write session cookies to the browser
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (err) {
              // Can be safely ignored if middleware handles refreshes
            }
          },
        },
      }
    );

    // 🔑 THE CRITICAL FIX: Exchanges the URL code for an active browser session cookie!
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
    
    console.error("OAuth Code Exchange Failed:", error.message);
  }

  // If anything goes sideways, bounce them to login with an error parameter
  return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth-failed`);
}