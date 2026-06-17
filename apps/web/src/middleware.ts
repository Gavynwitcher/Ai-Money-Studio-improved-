import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedApiPrefixes = [
  "/api/assistant",
  "/api/plaid",
  "/api/money-copilot",
  "/api/ollama",
  "/api/dashboard",
  "/api/backtests",
  "/api/behavior-insights",
  "/api/paper-portfolio",
  "/api/rules",
  "/api/strategies",
  "/api/trade-gatekeeper",
  "/api/trade-journal"
];

const stagedPagePrefixes = [
  "/accounting",
  "/assets",
  "/credit",
  "/heloc-application",
  "/liabilities",
  "/marketpilot",
  "/marketing-os"
];

const protectedPagePrefixes = [
  "/account",
  "/goals-debt",
  "/actions",
  "/assistant",
  "/dashboard",
  "/accounts",
  "/transactions",
  "/cash-flow",
  "/insights",
  "/scenarios",
  "/settings",
  "/operations-dashboard",
  "/backtests",
  "/behavior-insights",
  "/paper-portfolio",
  "/rules",
  "/strategy-lab",
  "/trade-gatekeeper",
  "/trade-journal"
];

function hasProtectedPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname === "/api/plaid/webhook") {
    return NextResponse.next();
  }

  if (hasProtectedPrefix(pathname, stagedPagePrefixes)) {
    const stagedUrl = new URL("/features", req.url);
    stagedUrl.searchParams.set("status", "planned");
    return NextResponse.redirect(stagedUrl);
  }

  const requireSignin = process.env.REQUIRE_SIGNIN !== "false";
  if (!requireSignin) {
    return NextResponse.next();
  }

  const isProtectedApi = hasProtectedPrefix(pathname, protectedApiPrefixes);
  const isProtectedPage = hasProtectedPrefix(pathname, protectedPagePrefixes);

  if (!isProtectedApi && !isProtectedPage) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  if (isProtectedApi) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const signInUrl = new URL("/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/api/money-copilot/:path*",
    "/api/assistant/:path*",
    "/api/ollama/:path*",
    "/api/plaid/:path*",
    "/api/dashboard",
    "/api/backtests",
    "/api/behavior-insights",
    "/api/paper-portfolio/:path*",
    "/api/rules",
    "/api/strategies",
    "/api/trade-gatekeeper",
    "/api/trade-journal",
    "/account/:path*",
    "/accounting/:path*",
    "/assets/:path*",
    "/credit/:path*",
    "/heloc-application/:path*",
    "/liabilities/:path*",
    "/marketpilot/:path*",
    "/marketing-os/:path*",
    "/goals-debt/:path*",
    "/actions/:path*",
    "/assistant/:path*",
    "/dashboard/:path*",
    "/accounts/:path*",
    "/transactions/:path*",
    "/cash-flow/:path*",
    "/insights/:path*",
    "/scenarios/:path*",
    "/settings/:path*",
    "/operations-dashboard/:path*",
    "/backtests/:path*",
    "/behavior-insights/:path*",
    "/paper-portfolio/:path*",
    "/rules/:path*",
    "/strategy-lab/:path*",
    "/trade-gatekeeper/:path*",
    "/trade-journal/:path*"
  ]
};
