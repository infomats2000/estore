export function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Invalid six-digit colour: ${hex}`);
  const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export const ADMIN_CONTRAST_PAIRS = [
  { name: 'body text', foreground: '#334155', background: '#ffffff', minimum: 4.5 },
  { name: 'field heading', foreground: '#1d4ed8', background: '#ffffff', minimum: 4.5 },
  { name: 'section heading', foreground: '#047857', background: '#ffffff', minimum: 4.5 },
  { name: 'primary button', foreground: '#ffffff', background: '#2563eb', minimum: 4.5 },
  { name: 'danger button', foreground: '#ffffff', background: '#dc2626', minimum: 4.5 },
  { name: 'focus indicator', foreground: '#2563eb', background: '#ffffff', minimum: 3 },
] as const;
