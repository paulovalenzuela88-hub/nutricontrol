interface Env {
  AI: Ai;
  ASSETS: Fetcher;
}

const PRIMARY_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const FALLBACK_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function parseJson(value: unknown): any {
  if (value && typeof value === 'object') return value;
  const text = String(value ?? '').replace(/```json/gi, '').replace(/```/g, '').trim();
  if (!text) throw new Error('La IA no devolvió un resultado válido.');
  try { return JSON.parse(text); } catch {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  throw new Error('La IA no devolvió un resultado válido.');
}

function getModelPayload(result: any): unknown {
  if (result?.response !== undefined) return result.response;
  if (result?.answer !== undefined) return result.answer;
  if (result?.choices?.[0]?.message?.content !== undefined) return result.choices[0].message.content;
  return result;
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

async function runVision(env: Env, image: string, prompt: string, schema: any, expectedKey?: 'foods' | 'supplement') {
  const dataUri = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
  let lastError: unknown;

  try {
    const result = await (env.AI as any).run(PRIMARY_MODEL, {
      messages: [
        {
          role: 'system',
          content: 'Eres un analista nutricional visual extremadamente detallista. Inspecciona TODA la imagen antes de responder. Identifica cada alimento o componente visible, incluidos acompañamientos, salsas, aderezos, guarniciones y bebidas. No inventes elementos que no sean visualmente plausibles.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      temperature: 0.15,
      max_tokens: 1800,
      chat_template_kwargs: { enable_thinking: false },
    });
    const parsed = parseJson(getModelPayload(result));
    if (parsed && typeof parsed === 'object') {
      const usable = expectedKey === 'foods'
        ? Array.isArray(parsed.foods) && parsed.foods.length > 0
        : expectedKey === 'supplement'
          ? !!parsed.supplement
          : true;
      if (usable) return parsed;
    }
  } catch (error) {
    lastError = error;
  }

  // Gemma can occasionally return a valid JSON object with an empty foods array.
  // Retry once with JSON mode before falling back to the second vision model.
  try {
    const result = await (env.AI as any).run(PRIMARY_MODEL, {
      messages: [
        {
          role: 'system',
          content: 'Eres un analista nutricional visual. DEBES mirar la imagen y devolver datos útiles. Nunca devuelvas una lista vacía si hay comida visible. Identifica todos los componentes visibles y responde únicamente con JSON válido.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.05,
      max_tokens: 2200,
      chat_template_kwargs: { enable_thinking: false },
    });
    const parsed = parseJson(getModelPayload(result));
    if (parsed && typeof parsed === 'object') {
      const usable = expectedKey === 'foods'
        ? Array.isArray(parsed.foods) && parsed.foods.length > 0
        : expectedKey === 'supplement'
          ? !!parsed.supplement
          : true;
      if (usable) return parsed;
    }
  } catch (error) {
    lastError = error;
  }

  try {
    const result = await (env.AI as any).run(FALLBACK_MODEL, {
      prompt,
      image_url: { url: dataUri },
      guided_json: schema,
      temperature: 0.08,
      max_tokens: 1800,
    });
    return parseJson(getModelPayload(result));
  } catch (error) {
    lastError = error;
  }

  try {
    const result = await (env.AI as any).run(FALLBACK_MODEL, {
      prompt: `${prompt} IMPORTANTE: responde SOLO JSON válido, sin markdown ni explicaciones.`,
      image_url: { url: dataUri },
      temperature: 0.05,
      max_tokens: 1800,
    });
    return parseJson(getModelPayload(result));
  } catch (error) {
    throw (error || lastError);
  }
}

async function handleAnalyzeFood(request: Request, env: Env) {
  const body = await request.json() as { image?: string };
  if (!body.image || typeof body.image !== 'string') {
    return json({ error: 'No se recibió la imagen.' }, 400);
  }

  const schema = {
    type: 'object',
    properties: {
      foods: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            grams: { type: 'number' },
            kcal: { type: 'number' },
            p: { type: 'number' },
            c: { type: 'number' },
            f: { type: 'number' },
            confidence: { type: 'number' },
            micros: microsSchema,
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
    const result = await runVision(
      env,
      body.image,
      'Analiza esta foto de comida con máximo detalle. Recorre visualmente toda la imagen antes de responder. Identifica CADA alimento o componente visible por separado, aunque sea pequeño o esté parcialmente cubierto: carnes, pollo, pescado, huevos, arroz, pasta, papas, pan, verduras, ensaladas, legumbres, queso, frutas, salsas, aderezos, aceite, bebidas y guarniciones. No te quedes solo con el alimento principal. Distingue ingredientes que parezcan diferentes. Para cada elemento estima la porción visible en gramos y sus calorías, proteína, carbohidratos, grasas y micronutrientes. Si no puedes identificar algo con certeza, usa la opción visualmente más probable y reduce confidence. No inventes alimentos que no sean visualmente plausibles. Responde en español y devuelve SOLO JSON compatible con el esquema.',
      schema,
      'foods'
    );
    return json({ foods: Array.isArray(result?.foods) ? result.foods : [] });
  } catch (error) {
    console.error('Food analysis failed', error);
    return json({
      error: error instanceof Error ? error.message : 'No fue posible analizar la fotografía.'
    }, 502);
  }
}

async function handleAnalyzeSupplement(request: Request, env: Env) {
  const body = await request.json() as { image?: string };
  if (!body.image || typeof body.image !== 'string') {
    return json({ error: 'No se recibió la imagen.' }, 400);
  }

  const schema = {
    type: 'object',
    properties: {
      supplement: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          brand: { type: 'string' },
          serving: { type: 'string' },
          kcal: { type: 'number' },
          p: { type: 'number' },
          c: { type: 'number' },
          f: { type: 'number' },
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
    const result = await runVision(
      env,
      body.image,
      'Lee esta etiqueta de suplemento o vitamina con máximo detalle. Usa SOLO información visible o legible en la etiqueta. Identifica nombre, marca, porción, calorías, macros y todos los micronutrientes declarados. Si un nutriente no aparece, usa 0. No inventes dosis ni valores. Devuelve SOLO JSON compatible con el esquema.',
      schema,
      'supplement'
    );
    return json({ supplement: result?.supplement || null });
  } catch (error) {
    console.error('Supplement analysis failed', error);
    return json({
      error: error instanceof Error ? error.message : 'No fue posible leer la etiqueta.'
    }, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname === '/api/_healthcheck' && request.method === 'GET') {
      return json({ ok: true, service: 'NutriControl AI', model: PRIMARY_MODEL });
    }

    if (url.pathname === '/api/analyze-food' && request.method === 'POST') {
      return handleAnalyzeFood(request, env);
    }

    if (url.pathname === '/api/analyze-supplement' && request.method === 'POST') {
      return handleAnalyzeSupplement(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
