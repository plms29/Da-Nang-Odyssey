export type ShaderPreset = "aurora" | "river" | "sunset" | "night";

export interface PresetPalette {
  base: string;
  blob1: string;
  blob2: string;
  blob3: string;
  accent: string;
}

// Brand tokens: sand #F6EFE4, terracotta #A84825, river #1F4E6B, gold #C99A2E, ink #1F1A17
export const PRESET_PALETTES: Record<ShaderPreset, PresetPalette> = {
  sunset: {
    base: "#2B142C",
    blob1: "#6A2537",
    blob2: "#A84825",
    blob3: "#C99A2E",
    accent: "#F6EFE4",
  },
  river: {
    base: "#13354A",
    blob1: "#1F4E6B",
    blob2: "#2B7A86",
    blob3: "#C99A2E",
    accent: "#F6EFE4",
  },
  night: {
    base: "#1F1A17",
    blob1: "#14263D",
    blob2: "#1F4E6B",
    blob3: "#A84825",
    accent: "#C99A2E",
  },
  aurora: {
    base: "#F6EFE4",
    blob1: "#DFB86C",
    blob2: "#D17B5C",
    blob3: "#5C8FA8",
    accent: "#C99A2E",
  },
};

export const PRESET_FALLBACK_CSS: Record<ShaderPreset, string> = {
  sunset: [
    "radial-gradient(65% 58% at 24% 22%, rgba(201, 154, 46, 0.58) 0%, transparent 72%)",
    "radial-gradient(62% 55% at 76% 48%, rgba(168, 72, 37, 0.65) 0%, transparent 74%)",
    "radial-gradient(70% 60% at 42% 82%, rgba(106, 37, 55, 0.68) 0%, transparent 76%)",
    "linear-gradient(160deg, #3D1A35 0%, #6A2537 36%, #A84825 72%, #C99A2E 100%)",
  ].join(", "),
  river: [
    "radial-gradient(68% 52% at 68% 24%, rgba(246, 239, 228, 0.52) 0%, transparent 70%)",
    "radial-gradient(64% 56% at 25% 58%, rgba(43, 122, 134, 0.62) 0%, transparent 74%)",
    "radial-gradient(75% 42% at 52% 88%, rgba(201, 154, 46, 0.28) 0%, transparent 72%)",
    "linear-gradient(180deg, #F6EFE4 0%, #58899E 34%, #2B7A86 66%, #1F4E6B 100%)",
  ].join(", "),
  night: [
    "radial-gradient(38% 36% at 28% 64%, rgba(201, 154, 46, 0.42) 0%, transparent 70%)",
    "radial-gradient(34% 34% at 74% 46%, rgba(168, 72, 37, 0.36) 0%, transparent 70%)",
    "radial-gradient(68% 60% at 56% 24%, rgba(31, 78, 107, 0.58) 0%, transparent 76%)",
    "linear-gradient(175deg, #121015 0%, #1F1A17 38%, #162A42 74%, #1F4E6B 100%)",
  ].join(", "),
  aurora: [
    "radial-gradient(62% 54% at 22% 30%, rgba(201, 154, 46, 0.42) 0%, transparent 72%)",
    "radial-gradient(60% 52% at 78% 36%, rgba(92, 143, 168, 0.44) 0%, transparent 72%)",
    "radial-gradient(64% 56% at 48% 76%, rgba(168, 72, 37, 0.34) 0%, transparent 74%)",
    "linear-gradient(145deg, #F6EFE4 0%, #EFE0C4 38%, #E4C9AE 70%, #D3DFE4 100%)",
  ].join(", "),
};

export const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Shared WebGL1 header: 2 octaves for domain warp (q) + 2 octaves for warped FBM (w) = 4 octaves total.
const SHARED_FRAGMENT_HEADER = `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_tilt;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 computeWarpedField(vec2 uv, float aspect, float t, out vec2 q) {
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) - u_tilt * vec2(0.14, 0.10);
  float n1 = vnoise(p * 1.55 + vec2(t * 0.28, -t * 0.21));
  float n2 = vnoise(p * 1.55 + vec2(-t * 0.24, t * 0.29) + vec2(5.2, 1.3));
  q = vec2(n1, n2) - 0.5;
  float n3 = vnoise(p * 2.25 + q * 1.25 + vec2(t * 0.34, t * 0.22));
  float n4 = vnoise(p * 4.10 - q * 0.95 + vec2(-t * 0.41, t * 0.31));
  float w = n3 * 0.66 + n4 * 0.34;
  return vec3(p, w);
}

vec4 computeBlobs(vec2 uv, float aspect, float t, vec2 q) {
  vec2 wuv = uv + q * 0.22 + u_tilt * vec2(0.08, -0.06);
  vec2 scale = vec2(aspect, 1.0);
  vec2 b1 = vec2(0.26 + 0.22 * sin(t * 0.54), 0.70 + 0.18 * cos(t * 0.44));
  vec2 b2 = vec2(0.74 + 0.21 * cos(t * 0.48 + 1.1), 0.36 + 0.21 * sin(t * 0.58 + 0.7));
  vec2 b3 = vec2(0.46 + 0.24 * sin(t * 0.42 + 2.4), 0.24 + 0.19 * cos(t * 0.52 + 1.8));
  vec2 b4 = vec2(0.64 + 0.19 * cos(t * 0.60 + 3.6), 0.76 + 0.17 * sin(t * 0.46 + 2.9));
  float m1 = smoothstep(0.78, 0.0, length((wuv - b1) * scale));
  float m2 = smoothstep(0.74, 0.0, length((wuv - b2) * scale));
  float m3 = smoothstep(0.70, 0.0, length((wuv - b3) * scale));
  float m4 = smoothstep(0.66, 0.0, length((wuv - b4) * scale));
  return vec4(m1, m2, m3, m4);
}

vec3 applyFinish(vec3 col, vec2 uv, float t) {
  float vig = smoothstep(1.32, 0.28, length((uv - 0.5) * vec2(1.15, 1.05)));
  col *= mix(0.76, 1.0, vig);
  float grain = (hash21(gl_FragCoord.xy + fract(t * 13.7) * 97.0) - 0.5) * 0.026;
  return clamp(col + grain, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADERS: Record<ShaderPreset, string> = {
  sunset: `${SHARED_FRAGMENT_HEADER}
void main() {
  vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
  float aspect = u_res.x / max(u_res.y, 1.0);
  float t = u_time;

  vec2 q;
  vec3 field = computeWarpedField(uv, aspect, t, q);
  float w = field.z;
  vec4 blobs = computeBlobs(uv, aspect, t, q);

  vec3 cPlum = vec3(0.169, 0.078, 0.173);
  vec3 cDeepRose = vec3(0.416, 0.145, 0.216);
  vec3 cTerracotta = vec3(0.659, 0.282, 0.145);
  vec3 cGold = vec3(0.788, 0.604, 0.180);
  vec3 cSand = vec3(0.965, 0.937, 0.894);

  vec3 col = mix(cPlum, cDeepRose, smoothstep(0.05, 0.85, uv.y + w * 0.25));
  col = mix(col, cTerracotta, blobs.x * 0.72 + w * 0.22);
  col = mix(col, cGold, blobs.y * 0.68 + blobs.w * 0.35);
  col = mix(col, cDeepRose, blobs.z * 0.45);

  // Faint diagonal god-ray streaks from the top
  float rayCoord = (uv.x - uv.y * 0.58) - u_tilt.x * 0.12 + q.x * 0.22;
  float r1 = sin(rayCoord * 16.0 + t * 0.38) * 0.5 + 0.5;
  float r2 = sin(rayCoord * 27.0 - t * 0.26 + 1.4) * 0.5 + 0.5;
  float rays = pow(r1 * 0.65 + r2 * 0.35, 3.0) * smoothstep(0.12, 0.98, uv.y);
  col += mix(cGold, cSand, 0.45) * rays * 0.22;

  gl_FragColor = vec4(applyFinish(col, uv, t), 1.0);
}
`,

  river: `${SHARED_FRAGMENT_HEADER}
void main() {
  vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
  float aspect = u_res.x / max(u_res.y, 1.0);
  float t = u_time;

  vec2 q;
  vec3 field = computeWarpedField(uv, aspect, t, q);
  float w = field.z;
  vec4 blobs = computeBlobs(uv, aspect, t, q);

  vec3 cDeepRiver = vec3(0.075, 0.208, 0.290);
  vec3 cRiver = vec3(0.122, 0.306, 0.420);
  vec3 cTeal = vec3(0.169, 0.478, 0.525);
  vec3 cSand = vec3(0.965, 0.937, 0.894);
  vec3 cGold = vec3(0.788, 0.604, 0.180);

  vec3 col = mix(cDeepRiver, cRiver, smoothstep(0.0, 0.65, uv.y));
  col = mix(col, cTeal, blobs.x * 0.65 + blobs.z * 0.42 + w * 0.20);
  float hazeMask = smoothstep(0.38, 0.98, uv.y + q.y * 0.22) * (0.55 + blobs.w * 0.45);
  col = mix(col, cSand, hazeMask * 0.68);
  col = mix(col, cGold, blobs.y * 0.22);

  // Gentle horizontal caustic shimmer in the lower third
  float lowerMask = smoothstep(0.42, 0.03, uv.y);
  float cWave1 = sin(uv.y * 46.0 + q.x * 5.5 + t * 1.15);
  float cWave2 = cos(uv.x * 18.0 + w * 4.5 - t * 0.82);
  float caustic = smoothstep(0.32, 0.95, cWave1 * cWave2 * 0.5 + 0.5) * lowerMask;
  col += mix(cTeal, cSand, 0.65) * caustic * 0.26;

  gl_FragColor = vec4(applyFinish(col, uv, t), 1.0);
}
`,

  night: `${SHARED_FRAGMENT_HEADER}
void main() {
  vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
  float aspect = u_res.x / max(u_res.y, 1.0);
  float t = u_time;

  vec2 q;
  vec3 field = computeWarpedField(uv, aspect, t, q);
  float w = field.z;
  vec4 blobs = computeBlobs(uv, aspect, t, q);

  vec3 cInk = vec3(0.122, 0.102, 0.090);
  vec3 cDeepNight = vec3(0.075, 0.145, 0.235);
  vec3 cRiverBlue = vec3(0.122, 0.306, 0.420);
  vec3 cTerracotta = vec3(0.659, 0.282, 0.145);
  vec3 cGold = vec3(0.788, 0.604, 0.180);
  vec3 cWarmLight = vec3(0.965, 0.845, 0.540);

  vec3 col = mix(cInk, cDeepNight, smoothstep(0.0, 0.85, uv.y + q.y * 0.2));
  col = mix(col, cRiverBlue, blobs.x * 0.52 + w * 0.22);
  col = mix(col, cTerracotta, blobs.z * 0.26);

  // Warm lantern-gold glow spots that slowly pulse
  vec2 scale = vec2(aspect, 1.0);
  vec2 luv = uv + u_tilt * vec2(0.09, -0.07) + q * 0.08;
  vec2 l1 = vec2(0.24 + 0.10 * sin(t * 0.48), 0.34 + 0.08 * cos(t * 0.41));
  vec2 l2 = vec2(0.72 + 0.11 * cos(t * 0.44 + 1.7), 0.46 + 0.09 * sin(t * 0.52 + 1.1));
  vec2 l3 = vec2(0.48 + 0.12 * sin(t * 0.39 + 3.1), 0.62 + 0.08 * cos(t * 0.49 + 2.4));

  float p1 = 0.68 + 0.32 * sin(t * 1.45);
  float p2 = 0.68 + 0.32 * sin(t * 1.62 + 2.1);
  float p3 = 0.68 + 0.32 * sin(t * 1.28 + 4.2);

  float g1 = exp(-length((luv - l1) * scale) * 5.2) * p1;
  float g2 = exp(-length((luv - l2) * scale) * 5.6) * p2;
  float g3 = exp(-length((luv - l3) * scale) * 6.0) * p3;
  float lanternGlow = g1 + g2 + g3;
  col += mix(cTerracotta, cGold, 0.65) * lanternGlow * 0.58;
  col += cWarmLight * pow(clamp(lanternGlow, 0.0, 1.0), 2.2) * 0.36;

  // Tiny twinkling stars in upper sky
  vec2 starGrid = uv * vec2(68.0 * aspect, 46.0);
  vec2 starId = floor(starGrid);
  vec2 starF = fract(starGrid) - 0.5;
  float sh = hash21(starId);
  float starMask = step(0.962, sh) * smoothstep(0.22, 0.78, uv.y);
  float starDist = length(starF);
  float twinkle = 0.45 + 0.55 * sin(t * (2.2 + sh * 3.5) + sh * 62.83);
  float star = smoothstep(0.24, 0.02, starDist) * starMask * twinkle;
  col += cWarmLight * star * 0.75;

  gl_FragColor = vec4(applyFinish(col, uv, t), 1.0);
}
`,

  aurora: `${SHARED_FRAGMENT_HEADER}
void main() {
  vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
  float aspect = u_res.x / max(u_res.y, 1.0);
  float t = u_time;

  vec2 q;
  vec3 field = computeWarpedField(uv, aspect, t, q);
  float w = field.z;
  vec4 blobs = computeBlobs(uv, aspect, t, q);

  vec3 cSand = vec3(0.965, 0.937, 0.894);
  vec3 cGoldPastel = vec3(0.875, 0.745, 0.455);
  vec3 cTerraPastel = vec3(0.835, 0.518, 0.408);
  vec3 cRiverPastel = vec3(0.388, 0.588, 0.686);

  vec3 col = cSand;
  col = mix(col, cGoldPastel, blobs.x * 0.58 + w * 0.18);
  col = mix(col, cTerraPastel, blobs.y * 0.48);
  col = mix(col, cRiverPastel, blobs.z * 0.52 + blobs.w * 0.28);

  // Pastel aurora ribbons
  float rib1 = sin(uv.y * 6.2 + uv.x * 2.8 + w * 3.4 + t * 0.56) * 0.5 + 0.5;
  float rib2 = sin(uv.y * 5.0 - uv.x * 3.2 + q.x * 3.8 - t * 0.44) * 0.5 + 0.5;
  float ribbonA = smoothstep(0.52, 0.94, rib1);
  float ribbonB = smoothstep(0.55, 0.95, rib2);
  col = mix(col, cRiverPastel, ribbonA * 0.34);
  col = mix(col, mix(cGoldPastel, cTerraPastel, uv.x), ribbonB * 0.32);

  gl_FragColor = vec4(applyFinish(col, uv, t), 1.0);
}
`,
};
