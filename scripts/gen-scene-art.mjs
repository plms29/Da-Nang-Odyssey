// Generate layered scene art with Gemini image models, key out the chroma background, save WebP.
// Usage: node scripts/gen-scene-art.mjs --kit di-san-cham [--layer thap] [--force] [--model gemini-3.1-flash-image]
// Needs GEMINI_API_KEY in the environment. Raw PNGs are kept in .art-raw/ (gitignored) for re-keying.
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const kitId = arg("kit");
const onlyLayer = arg("layer");
const force = args.includes("--force");
const model = arg("model", "gemini-3.1-flash-image");
const key = process.env.GEMINI_API_KEY; // only needed when a raw image has to be generated

const STYLE =
  "Modern premium mobile-game illustration, painterly soft gradients with a flat-3D feel (like Alto's Odyssey and Monument Valley), " +
  "cinematic warm lighting with rim light, atmospheric depth haze, clean shapes, rich but harmonious palette of sand #F6EFE4, " +
  "terracotta #A84825, river blue #1F4E6B, gold #C99A2E and deep ink #1F1A17. No text, no letters, no watermark, no border, no people faces in detail.";
const KEYED =
  "Draw ONLY the described element(s), isolated, on a perfectly flat solid pure magenta background (#FF00FF) filling everything else. " +
  "No magenta inside the subject, no shadows cast onto the background, crisp clean edges.";

// layer: { name, prompt, keyed (transparent background), aspect }
const KITS = {
  "di-san-cham": [
    { name: "sky", keyed: false, aspect: "9:16", prompt: "Full-frame sunset sky over central Vietnam: deep plum at the top fading to terracotta and glowing gold near the horizon, soft layered clouds lit from below, a few distant birds. Only sky, nothing on the ground." },
    { name: "doi-xa", keyed: true, aspect: "16:9", prompt: "A wide band of distant rolling green-blue hills and palm silhouettes seen through warm sunset haze, low contrast, spanning the full width, occupying the lower half of the image." },
    { name: "thap", keyed: true, aspect: "4:3", prompt: "A cluster of three ancient Cham kalan towers in red brick (Mỹ Sơn style): tall stepped towers tapering upward in several receding tiers, small corner miniature towers on each tier, arched niche doorways, the middle tower tallest, standing on a low stone terrace. Warm sunset rim light on the right edges, cool shadow on the left. Full width composition." },
    { name: "be-tho", keyed: true, aspect: "16:9", prompt: "A carved sandstone altar platform in Cham style, horizontal, with carved bands, lotus petal moldings and a stylised dancing apsara relief, warm sunlight, seen slightly from above, spanning the full width, sitting at the bottom of the image." },
    { name: "hoa-sen", keyed: true, aspect: "16:9", prompt: "Foreground lotus pond edge: large lotus leaves and pink-white lotus flowers with golden centres, plus a frangipani (plumeria) branch with white-yellow flowers entering from the right edge. Spanning the full width at the bottom." },
  ],
  "lich-su-giu-thanh": [
    { name: "map", keyed: false, aspect: "9:16", prompt: "Top-down bird's-eye illustrated map view of the Điện Hải citadel in Đà Nẵng: a star-shaped Vauban bastion fortress with thick walls (lit top faces, shadowed sides) and a water moat ring in the centre, green fields and dirt paths around it, the Hàn river as a wide blue band along the right side with a small wooden sailing warship, warm daylight, soft cloud shadows." },
    { name: "dai-bao", keyed: true, aspect: "4:3", prompt: "A bronze nineteenth-century Vietnamese cannon on a wooden carriage seen from above at an angle, metallic gradients and highlights." },
    { name: "co", keyed: true, aspect: "4:3", prompt: "A waving yellow-red historical Vietnamese flag on a short wooden pole, the pole on the left edge, cloth flowing to the right." },
  ],
  "nghe-thuat-dan-gian": [
    { name: "sky", keyed: false, aspect: "9:16", prompt: "Full-frame deep night sky in rural central Vietnam: ink black at the top to deep blue near the horizon, a soft full moon glow, scattered stars, faint warm festival glow at the bottom edge. Only sky." },
    { name: "day-choi", keyed: true, aspect: "16:9", prompt: "An arc of six small raised bamboo huts (bài chòi huts) on stilts with thatched roofs around a village yard at night, each hut glowing with warm golden light from inside, light spilling onto the ground, dark tree line behind, full width, in the lower half." },
    { name: "san", keyed: true, aspect: "16:9", prompt: "A night festival yard ground with woven straw mats and a small central wooden host stage lit by warm lantern light, seen slightly from above, spanning the full width at the bottom." },
    { name: "den-long", keyed: true, aspect: "3:4", prompt: "A single round red-terracotta Vietnamese paper lantern with gold trim and a gold tassel, glowing warmly from inside, hanging from a short cord that starts exactly at the top edge of the image." },
    { name: "trong", keyed: true, aspect: "1:1", prompt: "A traditional Vietnamese festival drum (trống) with a red lacquered wooden body, gold rim studs and a pale drum skin, lit warmly, seen at a slight angle." },
  ],
  "lang-nghe": [
    { name: "sky", keyed: false, aspect: "9:16", prompt: "Full-frame soft early-morning sky over the coast of central Vietnam: pale peach and warm cream near the horizon fading to clear light blue at the top, thin wispy clouds. Only sky." },
    { name: "nui-da", keyed: true, aspect: "16:9", prompt: "A wide band of distant limestone and marble karst peaks rising from flat land, pale grey-green with trees on the slopes, soft morning haze, low contrast, full width, lower half of the image." },
    { name: "xuong-da", keyed: true, aspect: "16:9", prompt: "An open-air stone carving workshop yard: rough pale marble blocks, half-finished carved stone lanterns, lions and lotus urns on wooden pallets, a simple tiled-roof workshop shed behind, chisels and stone dust, warm morning light, full width, sitting at the bottom of the image." },
    { name: "chum-mam", keyed: true, aspect: "16:9", prompt: "Foreground: a row of large dark brown glazed clay jars with wooden lids along a sandy fishing-village yard, a round woven bamboo basket boat leaning on its side at the right edge, fishing nets draped on a pole, warm light, spanning the full width at the bottom." },
  ],
  "am-thuc": [
    { name: "sky", keyed: false, aspect: "9:16", prompt: "Full-frame warm late-morning sky over a Vietnamese town: soft golden haze near the horizon fading to bright pale blue, a few puffy clouds. Only sky." },
    { name: "pho-cho", keyed: true, aspect: "16:9", prompt: "A lively Vietnamese market street of two-storey shophouses with tiled roofs, colourful awnings, hanging baskets and produce stalls, slightly hazy, no readable signs or letters, full width, lower half of the image." },
    { name: "ganh-hang", keyed: true, aspect: "4:3", prompt: "A street food vendor setup: a bamboo shoulder pole with two round woven baskets, one holding a steaming pot, the other stacked bowls, small low plastic stools beside it, gentle steam rising, warm light, no person." },
    { name: "to-mi", keyed: true, aspect: "16:9", prompt: "Foreground close-up of a bowl of mì Quảng on a wooden table: wide flat yellow rice noodles with a small amount of rich broth, shrimp, sliced pork, a quail egg, roasted peanuts, fresh herbs and a large toasted sesame rice cracker on top, a small dish of lime and chili beside it, spanning the full width at the bottom." },
  ],
  "do-thi-song-le-hoi": [
    { name: "sky", keyed: false, aspect: "9:16", prompt: "Full-frame festive night sky over a riverside city: deep indigo at the top to violet near the horizon, a few bursts of gold, red and teal fireworks with sparkling trails, warm city glow at the bottom edge. Only sky." },
    { name: "thanh-pho-dem", keyed: true, aspect: "16:9", prompt: "A modern riverside city skyline at night, mid-rise and high-rise buildings with warm and cool lit windows, soft glow and haze, full width, lower half of the image." },
    { name: "cau-rong-dem", keyed: true, aspect: "16:9", prompt: "The Đà Nẵng Dragon Bridge at night: a steel dragon sculpture undulating in five or six arches over a road deck, lit with glowing golden and colour-changing lights, a detailed dragon head with mane on the left end, reflections implied, full width side view." },
    { name: "bo-song-dem", keyed: true, aspect: "16:9", prompt: "Foreground riverside promenade at night: dark river edge with stone railing, ornate glowing lamp posts, palm tree silhouettes, small festival flags on a string, warm lights, spanning the full width at the bottom." },
  ],
  home: [
    { name: "sky", keyed: false, aspect: "9:16", prompt: "Full-frame golden-hour sky over Đà Nẵng: soft gold and peach near the horizon fading to light blue at the top, gentle clouds lit warm. Only sky." },
    { name: "son-tra", keyed: true, aspect: "16:9", prompt: "Distant Sơn Trà mountain peninsula silhouette in blue-purple haze, low contrast, full width, lower half of the image." },
    { name: "thanh-pho", keyed: true, aspect: "16:9", prompt: "Modern Đà Nẵng riverside skyline at golden hour, mid-rise buildings with warm lit windows, slightly hazy, full width, lower half." },
    { name: "cau-rong", keyed: true, aspect: "16:9", prompt: "The Đà Nẵng Dragon Bridge: a golden-yellow steel dragon sculpture undulating in five or six arches over a road deck, with a detailed dragon head with mane on the left end, glowing highlight lines, golden hour light, full width side view." },
    { name: "bo-song", keyed: true, aspect: "16:9", prompt: "Foreground riverside promenade of the Hàn river: palm trees, ornate lamp posts, a strip of grass and stone railing, warm evening light, spanning the full width at the bottom." },
  ],
};

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function generate(layer) {
  const body = {
    contents: [{ parts: [{ text: `${STYLE}\n\n${layer.prompt}\n\n${layer.keyed ? KEYED : "Fill the whole frame."}` }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: layer.aspect } },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json.error ?? json).slice(0, 400)}`);
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`no image returned: ${JSON.stringify(json).slice(0, 400)}`);
  return Buffer.from(part.inlineData.data, "base64");
}

/** Magenta → alpha with a soft edge and despill. Exported for the self-check below. */
export function keyPixel(r, g, b) {
  // "magenta-ness": how much R and B exceed G
  const m = Math.min(r, b) - g;
  const a = m > 140 ? 0 : m < 60 ? 255 : Math.round(((140 - m) / 80) * 255);
  if (a < 255 && a > 0) {
    // despill: pull R/B down toward G on the soft edge
    const k = Math.max(0, m) * 0.6;
    return [Math.max(0, r - k), g, Math.max(0, b - k), a];
  }
  return [r, g, b, a];
}

async function toWebp(png, keyed, outFile) {
  let img = sharp(png).resize({ width: 960, withoutEnlargement: false });
  if (keyed) {
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = keyPixel(data[i], data[i + 1], data[i + 2]);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = Math.min(data[i + 3], a);
    }
    img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 0 });
  }
  await img.webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(outFile);
}

// self-check of the keyer
console.assert(keyPixel(255, 0, 255)[3] === 0, "pure magenta must be transparent");
console.assert(keyPixel(200, 120, 60)[3] === 255, "warm brick must stay opaque");

if (!kitId || !KITS[kitId]) throw new Error(`--kit must be one of: ${Object.keys(KITS).join(", ")}`);
const rawDir = path.join(".art-raw", kitId);
const outDir = path.join("public", "scenes", kitId);
await mkdir(rawDir, { recursive: true });
await mkdir(outDir, { recursive: true });

for (const layer of KITS[kitId]) {
  if (onlyLayer && layer.name !== onlyLayer) continue;
  // raw art may come from the API (png) or from the Antigravity image tool (jpg)
  const jpg = path.join(rawDir, `${layer.name}.jpg`);
  const rawFile = !force && (await exists(jpg)) ? jpg : path.join(rawDir, `${layer.name}.png`);
  const outFile = path.join(outDir, `ai-${layer.name}.webp`);
  if (!force && (await exists(rawFile))) {
    console.log(`reuse ${rawFile}`);
  } else {
    console.log(`generate ${kitId}/${layer.name} with ${model}…`);
    await writeFile(rawFile, await generate(layer));
  }
  await toWebp(await readFile(rawFile), layer.keyed, outFile);
  const meta = await sharp(outFile).metadata();
  console.log(`→ ${outFile} ${meta.width}x${meta.height}`);
}
