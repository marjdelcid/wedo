import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Canonical host: redirect the production .vercel.app aliases to wedo.gifts.
// Only exact production aliases are redirected — preview deploys (random
// *.vercel.app hosts) are left untouched.
const REDIRECT_HOSTS = new Set([
  "wedo-livid.vercel.app",
  "wedo-marjdelcids-projects.vercel.app",
  "wedo-git-main-marjdelcids-projects.vercel.app",
]);

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  if (REDIRECT_HOSTS.has(host)) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.host = "wedo.gifts";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}
