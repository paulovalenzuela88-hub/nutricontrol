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

function toDataUri(image: string, mimeType = 'image/jpeg') {
  if (image.startsWith('data:')) return image;
  return `data:${mimeType};base64,${image}`;
}

async function runVision(env: Env, image: string, question: string, maxTokens = 1800) {
  const response: any = await env.AI.run(MODEL, {
    task: 'query',
    image,
    question,
    reasoning: false,
    temperature: 0,
    max_tokens: maxTokens,
  });
  return String(response?.answer || '');
}

async function handleAnalyzeFood(request: Request, env: Env) {
  const body = await request.json() as { image?: string; mimeType?: string };
  if (!body.image || typeof body.image !== 'string') return json({ error: 'No se recibió la imagen.' }, 400);

  const prompt = `Analiza esta foto de comida para una app de nutrición. Identifica SOLO los alimentos claramente visibles y estima la porción que se ve.
Responde SOLO con una línea por alimento, sin títulos, sin explicaciones y sin markdown.
Formato exacto:
FOOD|nombre en español|gramos|kcal|proteína_g|carbohidratos_g|grasas_g|fibra_g|azúcar_g|sodio_mg|calcio_mg|hierro_mg|potasio_mg|magnesio_mg|vitaminaC_mg|vitaminaD_mcg|vitaminaB12_mcg|confianza
Ejemplo:
FOOD|pechuga de pollo a la plancha|180|297|56|0|7|0|0|120|20|1|450|35|0|0|0.3|0.90
Reglas: todos los campos numéricos deben ser números. Confianza entre 0 y 1. Usa valores aproximados para la porción visible. No inventes alimentos. Si no hay comida identificable, responde exactamente: NO_FOOD.`;

  const answer = await runVision(env, toDataUri(body.image, body.mimeType), prompt, 1400);

  function parseFoodLines(text: string): any[] {
    const foods: any[] = [];
    for (const raw of text.split(/\\r?\\n/)) {
      const line = raw.trim().replace(/^\`+|\`+$/g, '');
      if (!line.toUpperCase().startsWith('FOOD|')) continue;
      const parts = line.split('|').map(x => x.trim());
      if (parts.length < 18) continue;
      const nums = parts.slice(2).map(Number);
      if (nums.some(n => !Number.isFinite(n))) continue;
      const [grams,kcal,p,c,f,fiber,sugar,sodium,calcium,iron,potassium,magnesium,vitaminC,vitaminD,vitaminB12,confidence] = nums;
      foods.push({
        name: parts[1],
        grams, kcal, p, c, f, confidence,
        micros: { fiber, sugar, sodium, calcium, iron, potassium, magnesium, vitaminC, vitaminD, vitaminB12 }
      });
    }
    return foods;
  }

  let foods = parseFoodLines(answer);
  if (!foods.length) {
    const retry = await runVision(env, toDataUri(body.image, body.mimeType), `Mira nuevamente esta foto. Responde ÚNICAMENTE con líneas FOOD separadas por saltos de línea. NO escribas explicaciones.
FOOD|nombre|gramos|kcal|proteína|carbohidratos|grasas|fibra|azúcar|sodio_mg|calcio_mg|hierro_mg|potasio_mg|magnesio_mg|vitaminaC_mg|vitaminaD_mcg|vitaminaB12_mcg|confianza
Si hay varios alimentos, una línea FOOD por cada uno. Si no puedes identificar ninguno, responde NO_FOOD. Todos los números deben ser números.`, 1400);
    foods = parseFoodLines(retry);
  }

  return json({ foods });
}

async function handleAnalyzeSupplement(request: Request, env: Env) {
  const body = await request.json() as { image?: string; mimeType?: string };
  if (!body.image || typeof body.image !== 'string') return json({ error: 'No se recibió la imagen.' }, 400);

  const answer = await runVision(env, toDataUri(body.image, body.mimeType), `Lee esta etiqueta de suplemento o vitamina. Responde EXCLUSIVAMENTE con JSON válido, sin markdown ni explicaciones, con esta estructura:
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
