import { NextRequest, NextResponse } from "next/server";

/**
 * Waitlist signup endpoint. Currently a stub: validates input and logs —
 * no email provider wired yet. TODO: connect Resend (or the CMS's own
 * leads table) before this goes to production. Kept intentionally simple
 * so the form UX in HeroForm / AppComingSoon works end-to-end locally.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const city = typeof body?.city === "string" ? body.city.trim() : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    console.log("[waitlist] signup", { email, city, at: new Date().toISOString() });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
