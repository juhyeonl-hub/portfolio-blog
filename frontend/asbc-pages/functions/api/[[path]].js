// Cloudflare Pages Function: forwards /api/* to the existing backend so the planner keeps same-origin API calls
// (needed for the Steam sign-in cookie), exactly like the Vercel rewrite on juhyeonl.dev.
// ASBC_API_ORIGIN can be set in the Pages project settings; redirects (Steam start/callback) are passed through.
export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const target = (env.ASBC_API_ORIGIN || 'https://api.juhyeonl.dev') + url.pathname + url.search
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
  return fetch(target, { method: request.method, headers: request.headers, body, redirect: 'manual' })
}
