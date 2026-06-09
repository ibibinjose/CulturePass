/** Default placeholder gradient pairs for @default: image URIs (FIXES-001 P13). */
export const DEFAULT_IMAGE_GRADIENTS = {
  'indigo-violet': ['#4F46E5', '#7C3AED'],
  'coral-rose': ['#FF5E5B', '#E11D48'],
  'teal-cyan': ['#0F766E', '#0891B2'],
  'emerald-teal': ['#059669', '#0D9488'],
  'amber-orange': ['#00A7EF', '#00ADEF'],
  festival: ['#7C3AED', '#EC4899'],
  azure: ['#2563EB', '#4F46E5'],
  blossom: ['#F43F5E', '#EC4899'],
  harvest: ['#4DD4FF', '#00A7EF'],
  jade: ['#16A34A', '#059669'],
  stone: ['#475569', '#334155'],
  midnight: ['#9333EA', '#4F46E5'],
} as const satisfies Record<string, readonly [string, string]>;