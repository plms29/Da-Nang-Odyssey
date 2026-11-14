import type { SceneKit } from "@/lib/scene";

export type SkyLayer =
  | { kind: "url"; src: string }
  | { kind: "linear"; angleDeg: number; stops: { color: string; pos: number }[] };

/** Split on commas outside parentheses. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Parse a scene kit's CSS `sky` (background list). First item = top layer, as in CSS. */
export function parseSky(sky: string): SkyLayer[] {
  const layers: SkyLayer[] = [];
  for (const part of splitTop(sky)) {
    const url = /^url\(\s*['"]?([^'")]+)['"]?\s*\)/.exec(part);
    if (url) {
      layers.push({ kind: "url", src: url[1] });
      continue;
    }
    const lin = /^linear-gradient\(([\s\S]*)\)$/.exec(part);
    if (!lin) continue;
    const args = splitTop(lin[1]);
    let angleDeg = 180;
    const angle = /^(-?\d+(?:\.\d+)?)deg$/.exec(args[0] ?? "");
    if (angle) {
      angleDeg = Number(angle[1]);
      args.shift();
    }
    const stops = args.map((a, i) => {
      const m = /^(.*?)\s+(-?\d+(?:\.\d+)?)%$/.exec(a);
      return m
        ? { color: m[1].trim(), pos: Number(m[2]) / 100 }
        : { color: a, pos: args.length > 1 ? i / (args.length - 1) : 0 };
    });
    if (stops.length) layers.push({ kind: "linear", angleDeg, stops });
  }
  return layers;
}

/** Bottom offset (0..1 of height) from a Tailwind `bottom-[N%]` class; 0 when absent. */
export function bottomFraction(className: string): number {
  const m = /bottom-\[(\d+(?:\.\d+)?)%\]/.exec(className);
  return m ? Number(m[1]) / 100 : 0;
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** Paint the world's sky and scene layers (far → near) onto the canvas. Broken images are skipped. */
export async function drawWorldBackground(
  ctx: CanvasRenderingContext2D,
  kit: SceneKit,
  w: number,
  h: number,
): Promise<void> {
  const sky = parseSky(kit.sky).reverse();
  const images = await Promise.all([
    ...sky.map((l) => (l.kind === "url" ? loadImage(l.src) : Promise.resolve(null))),
    ...kit.layers.map((l) => loadImage(l.src)),
  ]);

  sky.forEach((layer, i) => {
    if (layer.kind === "url") {
      const img = images[i];
      if (img) drawCover(ctx, img, w, h);
      return;
    }
    // CSS angle: 0deg points up, 180deg down.
    const rad = (layer.angleDeg * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    const g = ctx.createLinearGradient(w / 2 - dx * half, h / 2 - dy * half, w / 2 + dx * half, h / 2 + dy * half);
    for (const s of layer.stops) {
      try {
        g.addColorStop(Math.min(1, Math.max(0, s.pos)), s.color);
      } catch {
        // unknown colour syntax: skip the stop
      }
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  kit.layers.forEach((layer, i) => {
    const img = images[sky.length + i];
    if (!img || !img.naturalWidth) return;
    const dh = (img.naturalHeight / img.naturalWidth) * w;
    ctx.drawImage(img, 0, h * (1 - bottomFraction(layer.className)) - dh, w, dh);
  });
}
