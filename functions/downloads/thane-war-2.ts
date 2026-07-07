interface Env {
  VISITS: KVNamespace;
  ASSETS: { fetch: (req: Request | string) => Promise<Response> };
}

/**
 * Counted download: increments the download counter, then serves the
 * self-contained game file with a filename so browsers save it directly.
 */
export const onRequest: PagesFunction<Env> = async (ctx) => {
  const raw = await ctx.env.VISITS.get('hit:thane-war-2-download');
  await ctx.env.VISITS.put('hit:thane-war-2-download', String((raw ? parseInt(raw, 10) : 0) + 1));

  const assetUrl = new URL('/downloads/thane-war-2.html', ctx.request.url);
  const asset = await ctx.env.ASSETS.fetch(assetUrl.toString());
  return new Response(asset.body, {
    status: asset.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="thane-war-2.html"',
    },
  });
};
