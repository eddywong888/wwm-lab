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

function isBilingual(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.en === 'string' && typeof o.zh === 'string';
}

/**
 * Minimal re-validation of the QuestionPack shape (see
 * apps/wwm-edu/src/content/schema.ts for the full client-side validator).
 * Pages Functions build independently from the app and can't import app
 * source, so the handful of structural invariants that matter for the
 * app not to crash are duplicated here, deliberately kept small.
 */
function validatePackMinimal(data: unknown): { ok: true; pack: Record<string, unknown> } | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'pack: not an object' };
  const o = data as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id.trim()) return { ok: false, error: 'pack.id: missing/invalid' };
  if (o.subject !== 'english') return { ok: false, error: "pack.subject: must be 'english'" };
  if (typeof o.topic !== 'string' || !o.topic.trim()) return { ok: false, error: 'pack.topic: missing/invalid' };
  if (!isBilingual(o.title)) return { ok: false, error: 'pack.title: invalid Bilingual' };
  if (typeof o.version !== 'number' || !Number.isFinite(o.version)) return { ok: false, error: 'pack.version: must be a number' };
  if (!Array.isArray(o.questions) || o.questions.length === 0) {
    return { ok: false, error: 'pack.questions: must be a non-empty array' };
  }
  const seenIds = new Set<string>();
  for (const [i, q] of (o.questions as unknown[]).entries()) {
    if (!q || typeof q !== 'object') return { ok: false, error: `questions[${i}]: not an object` };
    const qo = q as Record<string, unknown>;
    if (typeof qo.id !== 'string' || !qo.id.trim()) return { ok: false, error: `questions[${i}].id: missing/invalid` };
    if (seenIds.has(qo.id)) return { ok: false, error: `questions[${i}]: duplicate id "${qo.id}"` };
    seenIds.add(qo.id);
    if (qo.difficulty !== 'standard' && qo.difficulty !== 'advanced') {
      return { ok: false, error: `questions[${i}].difficulty: invalid` };
    }
    if (!isBilingual(qo.prompt)) return { ok: false, error: `questions[${i}].prompt: invalid Bilingual` };
    if (
      !Array.isArray(qo.choices)
      || qo.choices.length !== 4
      || !qo.choices.every((c) => typeof c === 'string' && (c as string).trim())
      || new Set(qo.choices as string[]).size !== 4
    ) {
      return { ok: false, error: `questions[${i}].choices: must be 4 unique non-empty strings` };
    }
    if (typeof qo.answer !== 'string' || !(qo.choices as string[]).includes(qo.answer)) {
      return { ok: false, error: `questions[${i}].answer: must be one of choices` };
    }
  }
  return { ok: true, pack: o };
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
    const result = validatePackMinimal(body);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400, headers });
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
