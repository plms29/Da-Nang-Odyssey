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
  need(THEMES.includes(s.theme), `${w}: theme không hợp lệ`);
  need(isArea(s.checkin), `${w}: checkin cần lat, lng, radius_m > 0`);
  need(s.tour_seconds > 0 && Number.isInteger(s.route_order), `${w}: thiếu tour_seconds/route_order`);
  need(Array.isArray(s.sources) && s.sources.length > 0, `${w}: cần ít nhất một nguồn`);
  checkStatus(w, s.status);
}

const levelIds = new Set();
const ACTIVITY = ["jigsaw", "order", "match"];
for (const l of levels) {
  const w = `level ${l.id}`;
  need(l.id && !levelIds.has(l.id), `${w}: id thiếu hoặc trùng`);
  levelIds.add(l.id);
  need(Number.isInteger(l.order), `${w}: thiếu order`);
  need(l.spot_ids?.length && l.spot_ids.every((id) => spotIds.has(id)), `${w}: spot_ids trỏ tới điểm không tồn tại`);
  need(l.intro?.text, `${w}: thiếu intro.text`);
  need(l.reveal?.text && l.reveal.sources?.length, `${w}: reveal cần text và nguồn`);
  const st = l.stations ?? [];
  need(st.length === 3, `${w}: cần đúng 3 trạm (Tìm, Làm, Thể hiện)`);
  const [tim, lam, the] = st;
  need(tim?.type === "map_pin" && isArea(tim.target) && tim.clue, `${w}: trạm 1 phải là map_pin có clue và target`);
  need(ACTIVITY.includes(lam?.type), `${w}: trạm 2 phải là ${ACTIVITY.join("|")}`);
  if (lam?.type === "order") need(lam.items?.length >= 2, `${w}: order cần >= 2 items`);
  if (lam?.type === "match") need(lam.pairs?.length >= 2, `${w}: match cần >= 2 pairs`);
  if (lam?.type === "jigsaw") need(lam.image && lam.grid?.length === 2, `${w}: jigsaw cần image và grid`);
  for (const s of [tim, lam]) if (s) need(s.hints?.length === 3, `${w}/${s.id}: cần đúng 3 gợi ý`);
  need(["open_text_or_voice", "open_drawing"].includes(the?.type), `${w}: trạm 3 phải là trạm Thể hiện`);
  need(the?.rubric?.length === 3, `${w}: rubric cần đúng 3 tiêu chí`);
  need(the?.max_chars > 0, `${w}: trạm Thể hiện cần max_chars`);
  checkStatus(w, l.status);
}

for (const m of warnings) console.warn("⚠", m);
for (const m of errors) console.error("✗", m);
if (errors.length) process.exit(1);
console.log(`✓ Nội dung hợp lệ: ${spots.length} điểm, ${levels.length} màn${warnings.length ? ` (${warnings.length} cảnh báo)` : ""}`);
