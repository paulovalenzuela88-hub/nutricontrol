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
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try { return JSON.parse(text.slice(jsonStart, jsonEnd + 1)); } catch {}
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

async function runVision(env: Env, image: string, prompt: string, schema: any) {
  const dataUri = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
  let lastError: unknown;

  // Primary: Gemma 4 26B A4B. It is a newer multimodal reasoning model with
  // stronger visual understanding than the previous Scout-only path.
  try {
    const result = await (env.AI as any).run(PRIMARY_MODEL, {
      messages: [
        {
          role: 'system',
          content: 'Eres un analista nutricional visual extremadamente detallista. Debes inspeccionar toda la imagen, no solo el alimento principal. Busca componentes pequeños, acompañamientos, salsas, aderezos, guarniciones y bebidas visibles. No inventes elementos fuera de la imagen.',
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
      chat_template_kwargs: { enable_thinking: true },
    });
    const parsed = parseJson(getModelPayload(result));
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    lastError = error;
  }

  // Fallback: keep the proven Scout + guided JSON path if Gemma is unavailable.
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

