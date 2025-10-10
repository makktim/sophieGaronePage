// app/lib/foxpostClient.ts
const BASE = (
  process.env.FOXPOST_BASE_URL || "https://webapi-test.foxpost.hu/api"
).replace(/\/$/, "");
const API_KEY = process.env.FOXPOST_API_KEY!;
const BASIC_USER = process.env.FOXPOST_BASIC_USER!;
const BASIC_PASS = process.env.FOXPOST_BASIC_PASS!;

export function isSandboxFoxpost(): boolean {
  return BASE.includes("webapi-test");
}

// Sandboxban a /parcel hívásokhoz automatikusan hozzátesszük az ?isWeb=false-t
function withIsWeb(path: string): string {
  if (!isSandboxFoxpost()) return path;
  if (!path.startsWith("/parcel")) return path;
  return path.includes("?") ? `${path}&isWeb=false` : `${path}?isWeb=false`;
}

export async function foxpostFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const p = withIsWeb(path);
  const url = `${BASE}${p.startsWith("/") ? "" : "/"}${p}`;
  const headers = new Headers(init.headers as HeadersInit);

  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  headers.set("Api-key", API_KEY);
  headers.set(
    "Authorization",
    "Basic " + Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64")
  );

  return fetch(url, { ...init, headers });
}
