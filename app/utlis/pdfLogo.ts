async function urlToBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function getPdfLogo(dbLogo?: string | null): Promise<string | null> {
  if (dbLogo) {
    // If it's already a data URL return it directly; otherwise fetch and convert
    if (dbLogo.startsWith('data:')) return dbLogo;
    return await urlToBase64(dbLogo);
  }
  return await urlToBase64('/logo.png');
}

/** Returns a circular-clipped version of the logo as a PNG data URL. */
export async function getCircularLogo(dbLogo?: string | null): Promise<string | null> {
  const src = await getPdfLogo(dbLogo);
  if (!src) return null;
  return new Promise<string>((resolve) => {
    const SIZE = 200;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(src); return; }

    const img = new Image();
    img.onload = () => {
      // White background fill
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Clip to circle then draw image
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      ctx.restore();

      // Indigo border ring
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2);
      ctx.stroke();

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
