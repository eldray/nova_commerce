// Minimal Node dev/API server for Nova Commerce.
//
// The endpoint files under endpoints/**/*_<METHOD>.ts export an async
// `handle(request: Request, params?: Record<string,string>): Promise<Response>`
// function using the standard Fetch API (this is the convention the working
// endpoints already follow — see endpoints/auth/login_with_password_POST.ts).
//
// This server walks the endpoints/ directory, builds a route table from the
// filenames (products/list_GET.ts -> GET /api/products/list, orders/[orderId]_GET.ts
// -> GET /api/orders/:orderId), and adapts Node's raw http request/response to
// that Fetch API shape.
//
// Run with:  npx tsx server.ts   (or `npm run server` once added to package.json)

import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

// Node 20.6+/22 has this built in — loads .env into process.env without a dependency.
try {
  // @ts-ignore - available at runtime on Node 20.6+
  process.loadEnvFile?.(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional; ignore if missing.
}

const PORT = Number(process.env.API_PORT ?? 8080);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENDPOINTS_DIR = path.join(__dirname, "endpoints");

type Handler = (request: Request, params: Record<string, string>) => Promise<Response>;

interface Route {
  method: string;
  segments: string[]; // path segments; a segment starting with ":" is a param
  paramNames: string[];
  filePath: string;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function parseFileToRoute(absPath: string): Route | null {
  const rel = path.relative(ENDPOINTS_DIR, absPath).replace(/\\/g, "/");
  if (rel.endsWith(".schema.ts") || rel.endsWith(".schema.tsx")) return null;
  if (!rel.endsWith(".ts") && !rel.endsWith(".tsx")) return null;

  const withoutExt = rel.replace(/\.(ts|tsx)$/, "");
  const parts = withoutExt.split("/");
  const last = parts[parts.length - 1];

  // Match a trailing _METHOD suffix, e.g. "list_GET", "create_POST".
  const match = METHODS.map((m) => ({ m, suffix: `_${m}` })).find(({ suffix }) => last.endsWith(suffix));
  if (!match) return null;

  const nameWithoutMethod = last.slice(0, -match.suffix.length);
  const routeParts = [...parts.slice(0, -1), nameWithoutMethod].filter((p) => p !== "index" && p !== "");

  const paramNames: string[] = [];
  const segments = routeParts.map((p) => {
    const paramMatch = p.match(/^\[(.+)\]$/);
    if (paramMatch) {
      paramNames.push(paramMatch[1]);
      return `:${paramMatch[1]}`;
    }
    return p;
  });

  return { method: match.m, segments, paramNames, filePath: absPath };
}

function matchRoute(route: Route, method: string, urlSegments: string[]): Record<string, string> | null {
  if (route.method !== method) return null;
  if (route.segments.length !== urlSegments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < route.segments.length; i++) {
    const seg = route.segments[i];
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = decodeURIComponent(urlSegments[i]);
    } else if (seg !== urlSegments[i]) {
      return null;
    }
  }
  return params;
}

async function loadHandlers(): Promise<{ routes: Route[]; handlers: Map<string, Handler>; failed: string[] }> {
  const files = walk(ENDPOINTS_DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
  const routes: Route[] = [];
  const handlers = new Map<string, Handler>();
  const failed: string[] = [];

  for (const file of files) {
    const route = parseFileToRoute(file);
    if (!route) continue;

    try {
      const mod = await import(pathToFileURL(file).href);
      const handle: Handler | undefined = mod.handle;
      if (typeof handle !== "function") {
        failed.push(`${path.relative(ENDPOINTS_DIR, file)} — no exported handle() function, skipped`);
        continue;
      }
      routes.push(route);
      handlers.set(file, handle);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push(`${path.relative(ENDPOINTS_DIR, file)} — failed to load: ${message}`);
    }
  }

  return { routes, handlers, failed };
}

async function nodeRequestToFetchRequest(req: http.IncomingMessage, url: string): Promise<Request> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let body: Buffer | undefined;
  if (hasBody) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    body = Buffer.concat(chunks);
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
  });
}

async function main() {
  const { routes, handlers, failed } = await loadHandlers();

  console.log(`Loaded ${routes.length} API route(s).`);
  if (failed.length > 0) {
    console.warn(`\n${failed.length} endpoint file(s) failed to load and were skipped:`);
    for (const f of failed) console.warn(`  - ${f}`);
    console.warn("These routes will 404 until fixed. Everything else still runs.\n");
  }

  const server = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host ?? `localhost:${PORT}`;
      const fullUrl = new URL(req.url ?? "/", `http://${host}`);
      let pathname = fullUrl.pathname;

      // Both /api/* and /_api/* are proxied here per vite.config.ts; normalize.
      pathname = pathname.replace(/^\/_?api/, "");
      const urlSegments = pathname.split("/").filter(Boolean);

      let matchedParams: Record<string, string> | null = null;
      let matchedRoute: Route | null = null;
      for (const route of routes) {
        const params = matchRoute(route, req.method ?? "GET", urlSegments);
        if (params) {
          matchedParams = params;
          matchedRoute = route;
          break;
        }
      }

      if (!matchedRoute || !matchedParams) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `No route for ${req.method} ${pathname}` }));
        return;
      }

      const handle = handlers.get(matchedRoute.filePath)!;
      const fetchReq = await nodeRequestToFetchRequest(req, fullUrl.toString());
      const fetchRes = await handle(fetchReq, matchedParams);

      res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers.entries()));
      const buf = Buffer.from(await fetchRes.arrayBuffer());
      res.end(buf);
    } catch (err) {
      console.error("Unhandled server error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Nova Commerce API server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
