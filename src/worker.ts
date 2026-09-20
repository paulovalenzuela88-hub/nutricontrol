interface Env {
  AI: Ai;
  ASSETS: Fetcher;
}

const MODEL = '@cf/moondream/moondream3.1-9B-A2B';

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function extractJson(text: string): any {
  const cleaned = text.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    try { return JSON.parse(cleaned.slice(objectStart, objectEnd + 1)); } catch {}
  }
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    try { return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)); } catch {}
  }
  throw new Error('La IA no devolvió un resultado válido.');
}

async function runVision(env: Env, image: string, question: string) {
  const response: any = await env.AI.run(MODEL, {
    task: 'query',
    image,
    question,
    reasoning: false,
    temperature: 0.1,
    max_tokens: 700,
  });
  return String(response?.answer || '');
}

async function handleAnalyzeFood(request: Request, env: Env) {
  const body = await request.json() as { image?: string };
  if (!body.image || typeof body.image !== 'string') return json({ error: 'No se recibió la imagen.' }, 400);

  const answer = await runVision(env, body.image, `Analiza esta foto de comida para una app de nutrición. Identifica SOLO los alimentos visibles y estima sus cantidades. Responde EXCLUSIVAMENTE con JSON válido, sin markdown ni explicaciones, con esta estructura:
{"foods":[{"name":"nombre del alimento en español","grams":0,"kcal":0,"p":0,"c":0,"f":0,"confidence":0.0,"micros":{"fiber":0,"sugar":0,"sodium":0,"calcium":0,"iron":0,"potassium":0,"magnesium":0,"vitaminC":0,"vitaminD":0,"vitaminB12":0}}]}
Usa gramos y kcal aproximados por la porción visible. confidence debe estar entre 0 y 1. Si no puedes identificar comida con suficiente seguridad, devuelve {"foods":[]}. No inventes alimentos que no se vean.`);
  const parsed = extractJson(answer);
  return json({ foods: Array.isArray(parsed?.foods) ? parsed.foods : [] });
}

async function handleAnalyzeSupplement(request: Request, env: Env) {
  const body = await request.json() as { image?: string };
  if (!body.image || typeof body.image !== 'string') return json({ error: 'No se recibió la imagen.' }, 400);

  const answer = await runVision(env, body.image, `Lee esta etiqueta de suplemento o vitamina. Responde EXCLUSIVAMENTE con JSON válido, sin markdown ni explicaciones, con esta estructura:
{"supplement":{"name":"nombre","brand":"marca","serving":"porción","kcal":0,"p":0,"c":0,"f":0,"micros":{"fiber":0,"sugar":0,"sodium":0,"calcium":0,"iron":0,"potassium":0,"magnesium":0,"vitaminC":0,"vitaminD":0,"vitaminB12":0}}}
Usa solo información legible en la etiqueta. Si no puedes leerla con seguridad, devuelve {"supplement":null}.`);
  const parsed = extractJson(answer);
  return json({ supplement: parsed?.supplement || null });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

    if (url.pathname === '/api/analyze-food' && request.method === 'POST') {
      try { return await handleAnalyzeFood(request, env); }
      catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo analizar la comida.';
        return json({ error: message }, 502);
      }
    }

    if (url.pathname === '/api/analyze-supplement' && request.method === 'POST') {
      try { return await handleAnalyzeSupplement(request, env); }
      catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo analizar el suplemento.';
        return json({ error: message }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
