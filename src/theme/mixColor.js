// Blends `accent` into `base` and returns a fully OPAQUE hex color (no alpha
// channel) -- used for the tinted-card look introduced with the background
// artwork. An alpha-transparent tint (e.g. color + '33') always lets
// whatever sits behind the card show through, including the decorative
// landscape background, which made cards look messy. Pre-mixing to a solid
// color keeps the same tinted aesthetic while staying opaque no matter what
// renders behind it.
export function mixColor(base, accent, ratio) {
  const b = hexToRgb(base)
  const a = hexToRgb(accent)
  const mix = (x, y) => Math.round(x + (y - x) * ratio)
  return rgbToHex(mix(b.r, a.r), mix(b.g, a.g), mix(b.b, a.b))
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
