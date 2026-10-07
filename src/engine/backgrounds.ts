export interface BackgroundPreset {
  id: string;
  name: string;
  category: 'gradient' | 'mesh' | 'solid' | 'abstract';
  cssBackground: string;
  drawCanvas: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'studio-obsidian',
    name: 'Obsidian Dark',
    category: 'solid',
    cssBackground: 'radial-gradient(circle at 50% 30%, #171D29 0%, #0A0D13 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h));
      grad.addColorStop(0, '#171D29');
      grad.addColorStop(1, '#0A0D13');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'linear-mesh',
    name: 'Linear Indigo',
    category: 'mesh',
    cssBackground: 'linear-gradient(140deg, #181138 0%, #0F172A 50%, #082F49 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#181138');
      grad.addColorStop(0.5, '#0F172A');
      grad.addColorStop(1, '#082F49');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'emerald-jade',
    name: 'Emerald Velvet',
    category: 'mesh',
    cssBackground: 'linear-gradient(135deg, #072614 0%, #0B4222 45%, #051F10 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#072614');
      grad.addColorStop(0.45, '#0B4222');
      grad.addColorStop(1, '#051F10');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'cyber-aurora',
    name: 'Teal Aurora',
    category: 'mesh',
    cssBackground: 'linear-gradient(135deg, #022C22 0%, #0E7490 50%, #4338CA 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#022C22');
      grad.addColorStop(0.5, '#0E7490');
      grad.addColorStop(1, '#4338CA');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'sunset-peach',
    name: 'Tokyo Sunset',
    category: 'gradient',
    cssBackground: 'linear-gradient(135deg, #4A154B 0%, #7C2D12 40%, #EA580C 80%, #FB923C 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#4A154B');
      grad.addColorStop(0.4, '#7C2D12');
      grad.addColorStop(0.8, '#EA580C');
      grad.addColorStop(1, '#FB923C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'warm-cream',
    name: 'Warm Linen',
    category: 'solid',
    cssBackground: 'linear-gradient(135deg, #F8F5EE 0%, #EFE8DB 50%, #E2D7C7 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#F8F5EE');
      grad.addColorStop(0.5, '#EFE8DB');
      grad.addColorStop(1, '#E2D7C7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'rose-frost',
    name: 'Rose Glass',
    category: 'gradient',
    cssBackground: 'linear-gradient(135deg, #3B0764 0%, #831843 50%, #F43F5E 100%)',
    drawCanvas: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#3B0764');
      grad.addColorStop(0.5, '#831843');
      grad.addColorStop(1, '#F43F5E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'pure-carbon',
    name: 'Pure Carbon',
    category: 'solid',
    cssBackground: '#0F1218',
    drawCanvas: (ctx, w, h) => {
      ctx.fillStyle = '#0F1218';
      ctx.fillRect(0, 0, w, h);
    },
  },
];

export function getBackgroundPreset(id: string): BackgroundPreset {
  return BACKGROUND_PRESETS.find((p) => p.id === id) || BACKGROUND_PRESETS[0];
}
