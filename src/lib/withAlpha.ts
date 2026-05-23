// Robust color alpha utility for CulturePass
// Accepts hex (3/6/8), rgb(a), named colors, returns rgba() or original on error

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length === 6) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (c.length === 8) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const a = parseInt(c.slice(6, 8), 16) / 255;
    return `rgba(${r},${g},${b},${(a * alpha).toFixed(3)})`;
  }
  return hex; // fallback
}

export function withAlpha(color: string, alpha: number): string {
  if (!color) return color;
  if (color.startsWith('#')) return hexToRgba(color, alpha);
  if (color.startsWith('rgb')) {
    // Match channels: RGB as integers, alpha as int or decimal (e.g. 0.55, .55, 1).
    const parts = color.match(/\d*\.?\d+/g);
    if (!parts || parts.length < 3) return color;
    const [rRaw, gRaw, bRaw, aRaw] = parts;
    const r = Number(rRaw);
    const g = Number(gRaw);
    const b = Number(bRaw);
    if (aRaw !== undefined) {
      const a = Number(aRaw);
      return `rgba(${r},${g},${b},${(a * alpha).toFixed(3)})`;
    }
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // fallback for named colors or unknown
  return color;
}
