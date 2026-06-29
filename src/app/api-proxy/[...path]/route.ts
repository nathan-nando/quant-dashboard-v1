import { NextRequest } from "next/server";

// Allow long-running SSE connections (up to 5 minutes)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const BACKEND_URL = "http://127.0.0.1:8000/api";

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] }
): Promise<Response> {
  const path = params.path.join("/");
  const { search } = new URL(request.url);
  const targetUrl = `${BACKEND_URL}/${path}${search}`;

  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  console.log(`[api-proxy] ${request.method} ${path}${search} from ${clientIp}`);

  // Forward relevant request headers
  const headers = new Headers();
  const forwardHeaders = ["content-type", "authorization", "accept", "x-requested-with"];
  for (const h of forwardHeaders) {
    const val = request.headers.get(h);
    if (val) headers.set(h, val);
  }

  const isStream =
    request.headers.get("accept")?.includes("text/event-stream") ?? false;

  const body =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.arrayBuffer()
      : undefined;

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
      // @ts-expect-error -- Node.js fetch supports duplex
      duplex: "half",
      // Disable automatic timeout for SSE connections
      ...(isStream ? { signal: undefined } : {}),
    });

    console.log(`[api-proxy] Backend responded ${backendRes.status} for ${path}${search}`);

    const responseHeaders = new Headers();
    // Forward response headers from backend
    const passthroughHeaders = [
      "content-type",
      "cache-control",
      "access-control-allow-origin",
      "access-control-allow-headers",
    ];
    for (const h of passthroughHeaders) {
      const val = backendRes.headers.get(h);
      if (val) responseHeaders.set(h, val);
    }

    // For SSE: set streaming headers and pass body directly
    if (isStream || backendRes.headers.get("content-type")?.includes("text/event-stream")) {
      responseHeaders.set("Content-Type", "text/event-stream");
      responseHeaders.set("Cache-Control", "no-cache, no-transform");
      responseHeaders.set("Connection", "keep-alive");
      responseHeaders.set("X-Accel-Buffering", "no");

      console.log(`[api-proxy] SSE stream opened for ${path}`);

      return new Response(backendRes.body, {
        status: backendRes.status,
        headers: responseHeaders,
      });
    }

    // For regular REST responses
    const data = await backendRes.arrayBuffer();
    return new Response(data, {
      status: backendRes.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[api-proxy] ERROR proxying ${request.method} ${path}${search}: ${errMsg}`);
    return new Response(
      JSON.stringify({ error: "Proxy error", detail: errMsg, target: targetUrl }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, await params);
}
