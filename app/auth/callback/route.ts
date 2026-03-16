import { NextResponse } from "next/server";

import { getRequestOrigin } from "@/lib/request-origin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function buildLoginRedirect(origin: string, error: string, message?: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", error);

  if (message) {
    url.searchParams.set("message", message);
  }

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const providerError = requestUrl.searchParams.get("error");
  const providerErrorDescription = requestUrl.searchParams.get("error_description");

  if (providerError) {
    return buildLoginRedirect(origin, "auth_callback_failed", providerErrorDescription ?? providerError);
  }

  if (!code) {
    return buildLoginRedirect(origin, "auth_callback_failed", "Missing authorization code.");
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return buildLoginRedirect(origin, "auth_not_configured");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase auth callback exchange failed", {
      message: error.message,
    });
    return buildLoginRedirect(origin, "auth_callback_failed", error.message);
  }

  return NextResponse.redirect(new URL(next, origin));
}
