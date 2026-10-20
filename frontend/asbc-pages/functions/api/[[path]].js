// Cloudflare Pages Function: forwards /api/* to the existing backend so the planner keeps same-origin API calls
// (needed for the Steam sign-in cookie), exactly like the Vercel rewrite on juhyeonl.dev.
// ASBC_API_ORIGIN can be set in the Pages project settings; redirects (Steam start/callback) are passed through.
// The backend sees Cloudflare's addresses, shared by every visitor, so the visitor's address (CF-Connecting-IP)
// is sent with the ASBC_PROXY_SECRET secret for the backend's rate limits. Headers a visitor sent under these
// names are always dropped.
export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const target = (env.ASBC_API_ORIGIN || 'https://api.juhyeonl.dev') + url.pathname + url.search
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
  const headers = new Headers(request.headers)
  headers.delete('X-ASBC-Proxy-Secret'); headers.delete('X-ASBC-Client-IP')
  const visitor = request.headers.get('CF-Connecting-IP')
  if (env.ASBC_PROXY_SECRET && visitor) {
    headers.set('X-ASBC-Proxy-Secret', env.ASBC_PROXY_SECRET); headers.set('X-ASBC-Client-IP', visitor)
  }
  return fetch(target, { method: request.method, headers, body, redirect: 'manual' })
}
