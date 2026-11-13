import type { Spot } from "@/lib/types";

const COLOR_SAND = "#F6EFE4";
const COLOR_SANDSTONE = "#D9B382";
const COLOR_TERRACOTTA = "#A84825";
const COLOR_RIVER = "#1F4E6B";
const COLOR_GOLD = "#C99A2E";
const COLOR_INK = "#1F1A17";

function getBodyFontFamily(): string {
  if (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    document.body
  ) {
    const computed = window.getComputedStyle(document.body).fontFamily;
    if (computed && computed.trim().length > 0) {
      return computed;
    }
  }
  return '"Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
}

export function formatDateDdMmYyyy(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Draw the cultural photobooth frame, bottom info band, and verification stamp
 * using pure Canvas 2D primitives (CK-04: no external PNG/image assets).
 */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { spot: Spot; mode: "onsite" | "remote"; date: Date },
): void {
  const s = Math.min(w / 1080, h / 1920);
  const fontFamily = getBodyFontFamily();

  ctx.save();

  switch (opts.spot.theme) {
    case "di-san-cham":
      drawChamBorder(ctx, w, h, s);
      break;
    case "lich-su-giu-thanh":
      drawCitadelBorder(ctx, w, h, s);
      break;
    case "nghe-thuat-dan-gian":
      drawBaiChoiBorder(ctx, w, h, s);
      break;
    default:
      drawDoubleBorder(ctx, w, h, s);
      break;
  }

  drawBottomBand(ctx, w, h, s, fontFamily, opts);

  ctx.restore();
}

function drawChamBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
): void {
  const outerThickness = Math.round(30 * s);
  const innerInset = Math.round(38 * s);

  ctx.save();

  // Outer terracotta sandstone frame
  ctx.strokeStyle = COLOR_TERRACOTTA;
  ctx.lineWidth = outerThickness * 2;
  ctx.strokeRect(0, 0, w, h);

  // Inner sandstone & gold trim lines
  ctx.strokeStyle = COLOR_SANDSTONE;
  ctx.lineWidth = Math.max(2, Math.round(6 * s));
  ctx.strokeRect(
    outerThickness,
    outerThickness,
    w - outerThickness * 2,
    h - outerThickness * 2,
  );

  ctx.strokeStyle = COLOR_GOLD;
  ctx.lineWidth = Math.max(2, Math.round(3 * s));
  ctx.strokeRect(
    innerInset,
    innerInset,
    w - innerInset * 2,
    h - innerInset * 2,
  );

  // Stepped Cham-tower corner motifs at all 4 corners
  const steps = [
    { w: Math.round(150 * s), h: Math.round(42 * s) },
    { w: Math.round(112 * s), h: Math.round(76 * s) },
    { w: Math.round(76 * s), h: Math.round(112 * s) },
    { w: Math.round(42 * s), h: Math.round(150 * s) },
  ];

  const corners: { x: number; y: number; sx: 1 | -1; sy: 1 | -1 }[] = [
    { x: 0, y: 0, sx: 1, sy: 1 },
    { x: w, y: 0, sx: -1, sy: 1 },
    { x: 0, y: h, sx: 1, sy: -1 },
    { x: w, y: h, sx: -1, sy: -1 },
  ];

  for (const corner of corners) {
    ctx.save();
    ctx.translate(corner.x, corner.y);
    ctx.scale(corner.sx, corner.sy);

    for (const step of steps) {
      ctx.fillStyle = COLOR_TERRACOTTA;
      ctx.fillRect(0, 0, step.w, step.h);
      ctx.strokeStyle = COLOR_SANDSTONE;
      ctx.lineWidth = Math.max(1.5, Math.round(3 * s));
      ctx.strokeRect(0, 0, step.w, step.h);
    }

    // Inner lotus-bud diamond accent in corner
    const d = Math.round(28 * s);
    ctx.fillStyle = COLOR_GOLD;
    ctx.beginPath();
    ctx.moveTo(d, Math.round(12 * s));
    ctx.lineTo(Math.round(44 * s), d);
    ctx.lineTo(d, Math.round(44 * s));
    ctx.lineTo(Math.round(12 * s), d);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Stepped Cham pediment at top center
  const centerX = w / 2;
  const tiers = [
    { halfW: Math.round(140 * s), h: Math.round(36 * s) },
    { halfW: Math.round(96 * s), h: Math.round(54 * s) },
    { halfW: Math.round(52 * s), h: Math.round(70 * s) },
  ];
  for (const tier of tiers) {
    ctx.fillStyle = COLOR_TERRACOTTA;
    ctx.fillRect(centerX - tier.halfW, 0, tier.halfW * 2, tier.h);
    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = Math.max(1.5, Math.round(2.5 * s));
    ctx.strokeRect(centerX - tier.halfW, 0, tier.halfW * 2, tier.h);
  }

  ctx.restore();
}

function drawCitadelBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
): void {
  const baseWall = Math.round(28 * s);
  const merlonW = Math.round(36 * s);
  const crenelW = Math.round(24 * s);
  const merlonDepth = Math.round(20 * s);
  const period = merlonW + crenelW;

  ctx.save();

  // Outer deep river-blue wall
  ctx.strokeStyle = COLOR_RIVER;
  ctx.lineWidth = baseWall * 2;
  ctx.strokeRect(0, 0, w, h);

  // Crenellated (battlement) teeth along top, left, and right inner edges
  ctx.fillStyle = COLOR_RIVER;
  ctx.strokeStyle = COLOR_GOLD;
  ctx.lineWidth = Math.max(1.5, Math.round(2.5 * s));

  // Top edge battlements
  for (let x = baseWall + merlonW; x <= w - baseWall - merlonW * 2; x += period) {
    ctx.fillRect(x, baseWall, merlonW, merlonDepth);
    ctx.strokeRect(x, baseWall, merlonW, merlonDepth);
  }

  // Left and right edge battlements
  for (let y = baseWall + merlonW; y <= h - baseWall - merlonW * 2; y += period) {
    ctx.fillRect(baseWall, y, merlonDepth, merlonW);
    ctx.strokeRect(baseWall, y, merlonDepth, merlonW);

    ctx.fillRect(w - baseWall - merlonDepth, y, merlonDepth, merlonW);
    ctx.strokeRect(w - baseWall - merlonDepth, y, merlonDepth, merlonW);
  }

  // Continuous battlement line along the top parapet
  ctx.beginPath();
  ctx.moveTo(baseWall, baseWall);
  for (let x = baseWall + merlonW; x <= w - baseWall - merlonW * 2; x += period) {
    ctx.lineTo(x, baseWall);
    ctx.lineTo(x, baseWall + merlonDepth);
    ctx.lineTo(x + merlonW, baseWall + merlonDepth);
    ctx.lineTo(x + merlonW, baseWall);
  }
  ctx.lineTo(w - baseWall, baseWall);
  ctx.stroke();

  // Corner bastions (pháo đài góc thành)
  const bastion = Math.round(64 * s);
  const cornerCoords = [
    [0, 0],
    [w - bastion, 0],
    [0, h - bastion],
    [w - bastion, h - bastion],
  ] as const;

  for (const [cx, cy] of cornerCoords) {
    ctx.fillStyle = COLOR_RIVER;
    ctx.fillRect(cx, cy, bastion, bastion);
    ctx.strokeStyle = COLOR_GOLD;
    ctx.lineWidth = Math.max(2, Math.round(3 * s));
    ctx.strokeRect(
      cx + Math.round(8 * s),
      cy + Math.round(8 * s),
      bastion - Math.round(16 * s),
      bastion - Math.round(16 * s),
    );
  }

  ctx.restore();
}

function drawBaiChoiBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
): void {
  const band = Math.round(44 * s);

  ctx.save();

  // Gold outer border band
  ctx.strokeStyle = COLOR_GOLD;
  ctx.lineWidth = band * 2;
  ctx.strokeRect(0, 0, w, h);

  // Inner terracotta accent frame
  ctx.strokeStyle = COLOR_TERRACOTTA;
  ctx.lineWidth = Math.max(2, Math.round(4 * s));
  ctx.strokeRect(band, band, w - band * 2, h - band * 2);

  // Repeating playing-card (thẻ bài chòi) rectangle pattern
  const cardW = Math.round(22 * s);
  const cardH = Math.round(32 * s);
  const stepX = Math.round(48 * s);
  const stepY = Math.round(56 * s);

  const drawCard = (cx: number, cy: number, index: number) => {
    const x = cx - cardW / 2;
    const y = cy - cardH / 2;
    ctx.fillStyle = COLOR_SAND;
    ctx.fillRect(x, y, cardW, cardH);

    ctx.strokeStyle = COLOR_TERRACOTTA;
    ctx.lineWidth = Math.max(1.5, Math.round(2 * s));
    ctx.strokeRect(x, y, cardW, cardH);

    // Center pip on the bài chòi card
    ctx.fillStyle = index % 2 === 0 ? COLOR_TERRACOTTA : COLOR_INK;
    const pip = Math.max(3, Math.round(5 * s));
    ctx.fillRect(cx - pip / 2, cy - pip / 2, pip, pip);
  };

  let idx = 0;
  // Top and bottom card rows
  for (let x = band + cardW; x <= w - band - cardW; x += stepX) {
    drawCard(x, band / 2, idx++);
    drawCard(x, h - band / 2, idx++);
  }

  // Left and right card columns
  for (let y = band + cardH; y <= h - band - cardH; y += stepY) {
    drawCard(band / 2, y, idx++);
    drawCard(w - band / 2, y, idx++);
  }

  ctx.restore();
}

function drawDoubleBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
): void {
  const outerInset = Math.round(20 * s);
  const innerInset = Math.round(42 * s);

  ctx.save();

  ctx.strokeStyle = COLOR_TERRACOTTA;
  ctx.lineWidth = Math.max(4, Math.round(12 * s));
  ctx.strokeRect(
    outerInset,
    outerInset,
    w - outerInset * 2,
    h - outerInset * 2,
  );

  ctx.strokeStyle = COLOR_GOLD;
  ctx.lineWidth = Math.max(2, Math.round(5 * s));
  ctx.strokeRect(
    innerInset,
    innerInset,
    w - innerInset * 2,
    h - innerInset * 2,
  );

  ctx.restore();
}

function drawBottomBand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
  fontFamily: string,
  opts: { spot: Spot; mode: "onsite" | "remote"; date: Date },
): void {
  const margin = Math.round(36 * s);
  const bandH = Math.round(280 * s);
  const bandY = h - margin - bandH;
  const bandW = w - margin * 2;

  ctx.save();

  // Semi-opaque dark band so text stays legible on any photo
  ctx.fillStyle = "rgba(31, 26, 23, 0.84)";
  ctx.fillRect(margin, bandY, bandW, bandH);

  // Top gold accent rule on the band
  ctx.fillStyle = COLOR_GOLD;
  ctx.fillRect(margin, bandY, bandW, Math.max(3, Math.round(6 * s)));

  // Round verification stamp at bottom-right
  const stampR = Math.round(102 * s);
  const stampX = w - margin - Math.round(140 * s);
  const stampY = bandY + Math.round(bandH / 2);

  // Left column: cultural header, spot.name (bold, large), and dd/mm/yyyy date
  const textX = margin + Math.round(36 * s);
  const availableWidth = Math.max(
    1,
    stampX - stampR - textX - Math.round(24 * s),
  );

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = COLOR_GOLD;
  ctx.font = `600 ${Math.round(22 * s)}px ${fontFamily}`;
  ctx.fillText(
    "HÀNH TRÌNH VĂN HÓA ĐÀ NẴNG",
    textX,
    bandY + Math.round(62 * s),
  );

  const baseNameSize = Math.max(1, Math.round(48 * s));
  const minNameSize = Math.max(1, Math.round(baseNameSize * 0.6));
  let nameFontSize = baseNameSize;
  ctx.font = `700 ${nameFontSize}px ${fontFamily}`;
  while (
    nameFontSize > minNameSize &&
    (ctx.measureText?.(opts.spot.name)?.width ?? 0) > availableWidth
  ) {
    nameFontSize -= 1;
    ctx.font = `700 ${nameFontSize}px ${fontFamily}`;
  }

  ctx.fillStyle = COLOR_SAND;
  ctx.fillText(opts.spot.name, textX, bandY + Math.round(140 * s));

  const dateStr = formatDateDdMmYyyy(opts.date);
  ctx.fillStyle = COLOR_SANDSTONE;
  ctx.font = `600 ${Math.round(30 * s)}px ${fontFamily}`;
  ctx.fillText(dateStr, textX, bandY + Math.round(212 * s));

  const isOnsite = opts.mode === "onsite";
  const stampColor = isOnsite ? COLOR_GOLD : COLOR_RIVER;
  const stampBg = isOnsite ? "rgba(31, 26, 23, 0.94)" : COLOR_SAND;

  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.rotate(-0.08);

  // Stamp circle background
  ctx.beginPath();
  ctx.arc(0, 0, stampR, 0, Math.PI * 2);
  ctx.fillStyle = stampBg;
  ctx.fill();

  // Outer stamp ring
  ctx.lineWidth = Math.max(3, Math.round(6 * s));
  ctx.strokeStyle = stampColor;
  ctx.stroke();

  // Inner stamp ring
  ctx.beginPath();
  ctx.arc(0, 0, stampR - Math.round(12 * s), 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.5, Math.round(2.5 * s));
  ctx.strokeStyle = stampColor;
  ctx.stroke();

  // Stamp stars & main label
  ctx.fillStyle = stampColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `700 ${Math.round(20 * s)}px ${fontFamily}`;
  ctx.fillText("★ ★ ★", 0, -Math.round(44 * s));

  if (isOnsite) {
    ctx.font = `700 ${Math.round(30 * s)}px ${fontFamily}`;
    ctx.fillText("ĐÃ ĐẾN", 0, Math.round(6 * s));
  } else {
    const remoteFontSize = Math.round(26 * s);
    ctx.font = `700 ${remoteFontSize}px ${fontFamily}`;
    ctx.fillText("GHÉ THĂM", 0, -Math.round(6 * s));
    ctx.fillText("TRỰC TUYẾN", 0, Math.round(26 * s));
  }

  ctx.restore();
  ctx.restore();
}
