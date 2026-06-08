interface Env {
  VISITS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  const raw = await ctx.env.VISITS.get('count');
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;
  await ctx.env.VISITS.put('count', String(next));

  return new Response(JSON.stringify({ visits: next }), { headers: cors });
};
