// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { get as edgeGet } from "@vercel/edge-config";
import { get as localGet } from "@/app/mocks/edge-config";

const get = edgeGet;
// const get = process.env.NODE_ENV === 'development' ? localGet : edgeGet;

type RedirectMap = Record<string, { to: string; permanent: boolean }>;
type DeletedMap = Record<string, boolean>;

let redirectCache: RedirectMap = {};
let deletedCache: DeletedMap = {};
let lastFetch = 0;
const TTL = 3600000; // 1 hour in milliseconds

async function getSEOMaps() {
  const now = Date.now();
  if (now - lastFetch > TTL || !redirectCache || !deletedCache) {
    console.log(
      "[middleware] Fetching fresh redirect/deleted data from Edge Config..."
    );
    redirectCache = (await get("redirects")) || {};
    deletedCache = (await get("deleted")) || {};
    lastFetch = now;
  }
}

export async function middleware(req: NextRequest) {
  console.log(`[middleware] Request for ${req.nextUrl.pathname}`);
  console.log('should fetch fresh seo maps:',
    Date.now() - lastFetch > TTL || !redirectCache || !deletedCache,
    {
      DateNow: Date.now(),
      lastFetch,
      TTL,
      redirectCache: Object.keys(redirectCache).length,
      deletedCache: Object.keys(deletedCache).length,
    }
  )
  const path = req.nextUrl.pathname;
  await getSEOMaps();
  if (deletedCache[path]) {
    return new NextResponse("This page has been removed.", { status: 410 });
  }

  const redirect = redirectCache[path];

  if (redirect) {
    console.log(`[middleware] Redirecting ${path} to ${redirect.to}`);
    return NextResponse.redirect(new URL(redirect.to, req.url), {
      status: redirect.permanent ? 301 : 302,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|images|fonts|api).*)"],
};
