export interface Env {
  VISITS: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== '/api/visits') {
      return new Response('Not found', { status: 404 });
    }

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const raw = await env.VISITS.get('count');
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    await env.VISITS.put('count', String(next));

    return new Response(JSON.stringify({ visits: next }), { headers: cors });
  },
};
