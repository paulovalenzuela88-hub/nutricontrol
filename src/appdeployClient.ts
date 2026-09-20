export const api = {
  async post(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const message = (data as { error?: string } | null)?.error || 'Error del servicio de IA.';
      throw new Error(message);
    }
    return { data };
  },
};

async function fileToJpegData(file: File, maxDimension: number, maxPixels: number, quality: number) {
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    img.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight), Math.sqrt(maxPixels / (source.naturalWidth * source.naturalHeight)));
  const width = Math.max(1, Math.round(source.naturalWidth * scale));
  const height = Math.max(1, Math.round(source.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(source, 0, 0, width, height);
  URL.revokeObjectURL(source.src);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { data: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
}

export const image = {
  async resizeIfNeeded(file: File, options: { maxDimension: number; maxPixels: number; quality: number; mimeType: string }) {
    return fileToJpegData(file, options.maxDimension, options.maxPixels, options.quality);
  },
};