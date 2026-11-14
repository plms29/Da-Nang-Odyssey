// C4 — content check run before build. `--strict` (demo builds) also rejects anything not `verified`.
import { readFileSync } from "node:fs";

const strict = process.argv.includes("--strict");
const read = (p) => JSON.parse(readFileSync(new URL(`../content/${p}`, import.meta.url), "utf8"));
const spots = read("spots.json");
const levels = read("levels.json");
const errors = [];
const warnings = [];
const need = (cond, msg) => cond || errors.push(msg);

const THEMES = ["di-san-cham", "lich-su-giu-thanh", "lang-nghe", "nghe-thuat-dan-gian", "am-thuc", "do-thi-song-le-hoi"];
const isArea = (a) => a && typeof a.lat === "number" && typeof a.lng === "number" && a.radius_m > 0;
const checkStatus = (where, status) => {
  need(["draft", "verified"].includes(status), `${where}: status phải là draft|verified`);
  if (status !== "verified") (strict ? errors : warnings).push(`${where}: chưa verified`);
};

const spotIds = new Set();
for (const s of spots) {
  const w = `spot ${s.id}`;
  need(s.id && !spotIds.has(s.id), `${w}: id thiếu hoặc trùng`);
  spotIds.add(s.id);
  for (const k of ["name", "story", "image", "frame", "caption_fallback", "narration_fallback"])
    need(typeof s[k] === "string" && s[k], `${w}: thiếu ${k}`);
  need(s.narration_audio === undefined || (typeof s.narration_audio === "string" && s.narration_audio), `${w}: narration_audio phải là chuỗi không rỗng`);
  need(THEMES.includes(s.theme), `${w}: theme không hợp lệ`);
  need(isArea(s.checkin), `${w}: checkin cần lat, lng, radius_m > 0`);
  need(s.tour_seconds > 0 && Number.isInteger(s.route_order), `${w}: thiếu tour_seconds/route_order`);
  need(Array.isArray(s.sources) && s.sources.length > 0, `${w}: cần ít nhất một nguồn`);
  checkStatus(w, s.status);
}

const levelIds = new Set();
const ACTIVITY = ["jigsaw", "order", "match", "recipe", "spot_diff"];
for (const l of levels) {
  const w = `level ${l.id}`;
  need(l.id && !levelIds.has(l.id), `${w}: id thiếu hoặc trùng`);
  levelIds.add(l.id);
  need(Number.isInteger(l.order), `${w}: thiếu order`);
  need(l.spot_ids?.length && l.spot_ids.every((id) => spotIds.has(id)), `${w}: spot_ids trỏ tới điểm không tồn tại`);
  need(l.intro?.text, `${w}: thiếu intro.text`);
  need(l.page, `${w}: thiếu page (tên trang sổ tay)`);
  need(l.reveal?.text && l.reveal.sources?.length, `${w}: reveal cần text và nguồn`);
  const st = l.stations ?? [];
  need(st.length === 3, `${w}: cần đúng 3 trạm (Tìm, Làm, Thể hiện)`);
  const [tim, lam, the] = st;
  need(tim?.type === "map_pin" && isArea(tim.target) && tim.clue, `${w}: trạm 1 phải là map_pin có clue và target`);
  need(ACTIVITY.includes(lam?.type), `${w}: trạm 2 phải là ${ACTIVITY.join("|")}`);
  if (lam?.type === "order") need(lam.items?.length >= 2, `${w}: order cần >= 2 items`);
  if (lam?.type === "match") need(lam.pairs?.length >= 2, `${w}: match cần >= 2 pairs`);
  if (lam?.type === "recipe") need(lam.steps?.length >= 2 && lam.distractors?.length >= 1, `${w}: recipe cần >= 2 steps và >= 1 distractors`);
  if (lam?.type === "spot_diff")
    need(lam.before && lam.after && lam.spots?.length >= 1 && lam.spots.every((p) => [p.x, p.y, p.r].every((n) => n >= 0 && n <= 100)), `${w}: spot_diff cần before, after và spots có x, y, r trong 0..100`);
  if (lam?.type === "jigsaw") need(lam.image && lam.grid?.length === 2, `${w}: jigsaw cần image và grid`);
  for (const s of [tim, lam]) if (s) need(s.hints?.length === 3, `${w}/${s.id}: cần đúng 3 gợi ý`);
  need(["open_text_or_voice", "open_drawing", "learn_retell"].includes(the?.type), `${w}: trạm 3 phải là trạm Thể hiện`);
  if (the?.type === "learn_retell") {
    const ids = (the.blanks ?? []).map((b) => b.id);
    need(the.cards?.length >= 1 && ids.length >= 1, `${w}: learn_retell cần cards và blanks`);
    need(ids.every((id) => the.template?.includes(`{{${id}}}`)), `${w}: mỗi blank phải có {{id}} trong template`);
    need(the.blanks?.every((b) => b.answer && b.distractors?.length === 2 && b.explain), `${w}: blank cần answer, 2 distractors, explain`);
  } else {
    need(the?.rubric?.length === 3, `${w}: rubric cần đúng 3 tiêu chí`);
    if (the?.type === "open_drawing") need(the.sample_image, `${w}: open_drawing cần sample_image`);
    need(the?.max_chars > 0, `${w}: trạm Thể hiện cần max_chars`);
  }
  checkStatus(w, l.status);
}

const story = read("story.json");
need(story.guide?.name && story.prologue?.length && story.epilogue?.length, "story.json: cần guide.name, prologue, epilogue");

for (const m of warnings) console.warn("⚠", m);
for (const m of errors) console.error("✗", m);
if (errors.length) process.exit(1);
console.log(`✓ Nội dung hợp lệ: ${spots.length} điểm, ${levels.length} màn${warnings.length ? ` (${warnings.length} cảnh báo)` : ""}`);
