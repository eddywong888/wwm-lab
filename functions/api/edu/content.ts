import { validatePack } from '../../../apps/wwm-edu/src/content/schema';

interface Env {
  VISITS: KVNamespace;
  /** Admin upload/delete auth. Set via `.dev.vars` locally, CF dashboard
   * env var in production. Endpoint is 503 (not 401) when unset so a
   * forgotten env var fails loudly rather than silently accepting no key. */
  EDU_ADMIN_KEY?: string;
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
}

/**
 * GET    /api/edu/content            → { packs: [...] } every KV content
 *   pack (public, no auth — small curated packs, no PII).
 * POST   /api/edu/content            → upsert one QuestionPack at
 *   `edu:pack:<pack.id>`. Requires header `X-Admin-Key` === env
 *   EDU_ADMIN_KEY (503 if unset server-side, 401 if wrong).
 * DELETE /api/edu/content?id=<id>    → remove one pack. Same auth.
 */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const headers = cors();

  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (ctx.request.method === 'GET') {
    const list = await ctx.env.VISITS.list({ prefix: 'edu:pack:' });
    const packs: unknown[] = [];
    for (const key of list.keys) {
      const raw = await ctx.env.VISITS.get(key.name);
      if (!raw) continue;
      try {
        packs.push(JSON.parse(raw));
      } catch {
        // Skip a corrupt KV entry rather than fail the whole listing.
      }
    }
    return new Response(JSON.stringify({ packs }), { headers });
  }

  // POST / DELETE both require admin auth.
  if (!ctx.env.EDU_ADMIN_KEY) {
    return new Response(JSON.stringify({ error: 'admin not configured' }), { status: 503, headers });
  }
  const providedKey = ctx.request.headers.get('X-Admin-Key');
  if (!providedKey || providedKey !== ctx.env.EDU_ADMIN_KEY) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }

  if (ctx.request.method === 'POST') {
    let body: unknown;
    try {
      body = await ctx.request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400, headers });
    }
    const result = validatePack(body);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.errors.join("; ") }), { status: 400, headers });
    }
    const id = result.pack.id as string;
    await ctx.env.VISITS.put(`edu:pack:${id}`, JSON.stringify(result.pack));
    return new Response(JSON.stringify({ ok: true, id }), { headers });
  }

  if (ctx.request.method === 'DELETE') {
    const id = new URL(ctx.request.url).searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'missing id' }), { status: 400, headers });
    }
    await ctx.env.VISITS.delete(`edu:pack:${id}`);
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
};
