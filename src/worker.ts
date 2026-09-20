interface Env {
  AI: Ai;
  ASSETS: Fetcher;
}

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function parseJson(value: unknown): any {
  const text = String(value ?? '').replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  throw new Error('La IA no devolvió un resultado válido.');
}

const microsSchema = {
  type: 'object',
  properties: {
    fiber: { type: 'number' }, sugar: { type: 'number' }, sodium: { type: 'number' },
    calcium: { type: 'number' }, iron: { type: 'number' }, potassium: { type: 'number' },
    magnesium: { type: 'number' }, vitaminC: { type: 'number' }, vitaminD: { type: 'number' },
    vitaminB12: { type: 'number' },
  },
  required: ['fiber','sugar','sodium','calcium','iron','potassium','magnesium','vitaminC','vitaminD','vitaminB12'],
  additionalProperties: false,
};

async function runVision(env: Env, image: string, prompt: string, schema: any) {
  const dataUri = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
  return await env.AI.run(MODEL, {
    prompt,
    image_url: { url: dataUri },
    guided_json: schema,
    temperature: 0.1,
    max_tokens: 900,
  }) as any;
}

async function handleAnalyzeFood(request: Request, env: Env) {
  const body = await request.json() as { image?: string };
  if (!body.image || typeof body.image !== 'string') return json({ error: 'No se recibió la imagen.' }, 400);

  const schema = {
    type: 'object',
    properties: {
      foods: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }, grams: { type: 'number' }, kcal: { type: 'number' },
            p: { type: 'number' }, c: { type: 'number' }, f: { type: 'number' },
            confidence: { type: 'number' }, micros: microsSchema,
          },
          required: ['name','grams','kcal','p','c','f','confidence','micros'],
          additionalProperties: false,
        },
      },
    },
    required: ['foods'],
    additionalProperties: false,
  };

  try {
    const result = await runVision(env, body.image,
      'Analiza esta foto de comida para una app de nutrición. Identifica SOLO los alimentos visibles. Estima la porción visible en gramos y sus calorías, proteína, carbohidratos, grasas y micronutrientes. Responde en español. No inventes alimentos. Si algo es incierto, baja confidence. Devuelve únicamente el objeto indicado por el esquema.',
      schema);
    const parsed = parseJson(result?.response ?? result?.answer ?? result);
    return json({ foods: Array.isArray(parsed?.foods) ? parsed.foods : [] });
  } catch (error) {
    console.error('Food analysis failed', error);
    return json({ error: error instanceof Error ? error.message : 'No fue posible analizar la fotografía.' }, 502);
  }
}

async function handleAnalyzeSupplement(request: Request, env: Env) {
  const body = await request.json() as { image?: string };
  if (!body.image || typeof body.image !== 'string') return json({ error: 'No se recibió la imagen.' }, 400);

  const schema = {
    type: 'object',
    properties: {
      supplement: {
        type: 'object',
        properties: {
          name: { type: 'string' }, brand: { type: 'string' }, serving: { type: 'string' },
          kcal: { type: 'number' }, p: { type: 'number' }, c: { type: 'number' }, f: { type: 'number' },
          micros: microsSchema,
        },
        required: ['name','brand','serving','kcal','p','c','f','micros'],
        additionalProperties: false,
      },
    },
    required: ['supplement'],
    additionalProperties: false,
  };

  try {
    const result = await runVision(env, body.image,
      'Lee esta etiqueta de suplemento o vitamina. Usa SOLO información legible en la etiqueta. Devuelve nombre, marca, porción, calorías, macros y micronutrientes declarados. Si un nutriente no aparece, usa 0. No inventes dosis. Devuelve únicamente el objeto indicado por el esquema.',
      schema);
    const parsed = parseJson(result?.response ?? result?.answer ?? result);
    return json({ supplement: parsed?.supplement || null });
  } catch (error) {
    console.error('Supplement analysis failed', error);
    return json({ error: error instanceof Error ? error.message : 'No fue posible leer la etiqueta.' }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (url.pathname === '/api/analyze-food' && request.method === 'POST') return handleAnalyzeFood(request, env);
    if (url.pathname === '/api/analyze-supplement' && request.method === 'POST') return handleAnalyzeSupplement(request, env);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
