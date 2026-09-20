interface Env {
  ASSETS: Fetcher;
}

const APPDEPLOY_API = 'https://nutricontrol-7ll6b4.v2.appdeploy.ai';

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

async function proxy(request: Request, path: string) {
  const body = await request.text();
  const response = await fetch(`${APPDEPLOY_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': request.headers.get('Content-Type') || 'application/json' },
    body,
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: corsHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === 'POST' && (url.pathname === '/api/analyze-food' || url.pathname === '/api/analyze-supplement')) {
      try {
        return await proxy(request, url.pathname);
      } catch (error) {
        console.error('AI proxy failed', error);
        return new Response(JSON.stringify({
          error: 'No fue posible conectar con el analizador de comida.',
        }), { status: 502, headers: corsHeaders });
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
