const getDataUrlSizeBytes = (dataUrl) => {
  const idx = String(dataUrl || '').indexOf(',');
  if (idx === -1) return 0;
  const base64 = dataUrl.slice(idx + 1);
  return Math.floor((base64.length * 3) / 4);
};

const loadImage = (file) => {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};

const getCanvasDataUrl = (canvas, type, quality) => {
  try {
    const out = canvas.toDataURL(type, quality);
    if (type === 'image/webp' && !out.startsWith('data:image/webp')) return '';
    return out;
  } catch {
    return '';
  }
};

export const compressImageFileToDataUrl = async (
  file,
  {
    maxDimension = 300,
    maxBytes = 100 * 1024,
    preferType = 'image/webp',
    quality = 0.7,
    minQuality = 0.45,
  } = {},
) => {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('File bukan gambar.');
  }

  const img = await loadImage(file);
  const srcWidth = img.width || 0;
  const srcHeight = img.height || 0;
  if (!srcWidth || !srcHeight) throw new Error('Gagal membaca ukuran gambar.');

  let targetType = preferType;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas tidak tersedia.');

  canvas.width = 2;
  canvas.height = 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 2, 2);
  const webpTest = getCanvasDataUrl(canvas, 'image/webp', 0.7);
  if (!webpTest) targetType = 'image/jpeg';

  let scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
  let currentQuality = quality;

  for (let attempt = 0; attempt < 10; attempt++) {
    const w = Math.max(1, Math.round(srcWidth * scale));
    const h = Math.max(1, Math.round(srcHeight * scale));

    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    currentQuality = Math.min(currentQuality, 0.9);
    let dataUrl = '';
    for (let q = currentQuality; q >= minQuality; q -= 0.08) {
      const candidate = getCanvasDataUrl(canvas, targetType, q) || getCanvasDataUrl(canvas, 'image/jpeg', q);
      if (!candidate) continue;
      if (getDataUrlSizeBytes(candidate) <= maxBytes) return candidate;
      dataUrl = candidate;
    }
    scale *= 0.85;
  }

  throw new Error('Gambar terlalu besar setelah kompresi.');
};
