// Whensday link preview: point og:image at the per-plan image generator (/og).
export default async (request, context) => {
  const url = new URL(request.url);
  const plan = url.searchParams.get("plan");
  const res = await context.next();
  if (!plan) return res;
  if (!(res.headers.get("content-type") || "").includes("text/html")) return res;

  const ogUrl = "https://whensday.co/og?plan=" + encodeURIComponent(plan);
  let html = await res.text();
  html = html
    .replace(/(<meta property="og:image" content=")[^"]*(")/, "$1" + ogUrl + "$2")
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, "$1" + ogUrl + "$2")
    .replace(/(<meta property="og:image:height" content=")[^"]*(")/, "$1540$2");

  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(html, { status: res.status, headers });
};
