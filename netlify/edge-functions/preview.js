// Whensday dynamic link preview.
// For requests to /?plan=<slug>, replace the page's og/twitter description + image
// with the plan's own name and cover photo (falls back to the branded defaults).
const SUPABASE_URL = "https://gqorpmgvqncfutejvdlj.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxb3JwbWd2cW5jZnV0ZWp2ZGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MDc2MzQsImV4cCI6MjEwMTE4MzYzNH0.8nDlGULePDCaR9IRms7bwAf5gFGz-wXDCvqNyBRfdos";

export default async (request, context) => {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");
  const res = await context.next();
  if (!plan) return res;
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;

  let name = null, image = null;
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_plan_preview", {
      method: "POST",
      headers: { "content-type": "application/json", apikey: ANON, authorization: "Bearer " + ANON },
      body: JSON.stringify({ p_key: plan }),
    });
    if (r.ok) {
      const rows = await r.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row) { name = row.title || null; image = row.cover_photo_url || null; }
    }
  } catch (_) { /* fall back to defaults */ }

  if (!name && !image) return res;

  let html = await res.text();
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (name) {
    const d = esc(name);
    html = html
      .replace(/(<meta property="og:description" content=")[^"]*(")/, "$1" + d + "$2")
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, "$1" + d + "$2")
      .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, "$1" + d + "$2");
  }
  if (image) {
    const im = esc(image);
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*(")/, "$1" + im + "$2")
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, "$1" + im + "$2");
  }

  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(html, { status: res.status, headers });
};
