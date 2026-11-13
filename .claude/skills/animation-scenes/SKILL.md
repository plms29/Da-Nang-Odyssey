---
name: animation-scenes
description: Build or change animated UI in the Đà Nẵng Odyssey app (Next 15, Tailwind v4, motion): themed scenes with layered parallax and shader sky, tilt, glass surfaces, kinetic text, transitions, celebrations, desktop (lg) layouts, and AI-generated scene art. Use when asked to add or tune an animation, a scene kit, a new themed screen, desktop layout of an animated page, or scene artwork.
---

# Animation and scene building (this repo)

Read `BAO-CAO-UI-HIEN-DAI.md` for the design intent and `BAO-CAO-TIEP-NOI.md` for open work before starting.

## 1. What already exists (reuse, do not rewrite)

All in `components/fx/` unless noted:

| Need | Use |
|---|---|
| Painted themed scene (static or card strip) | `SceneBackdrop({ kit, intensity: "full" \| "calm" })` |
| Scroll-driven camera intro through a scene | `ParallaxScene({ kit, panels, cta })` |
| Animated sky | `ShaderBackdrop({ preset: "aurora" \| "river" \| "sunset" \| "night" })` (mounted by SceneBackdrop/ParallaxScene, not directly) |
| Ambient motion (dust, smoke, waves, drift, sway, fireflies, fireworks) | `Ambient({ kind })`; layer self-animation via `layerAnimClass(kind)`; canvas particles via `ParticleCanvas` |
| Pointer / gyroscope parallax | `useTilt()` (x,y in -1..1), `TiltCard`, `MotionPermissionButton` (iOS permission) |
| Glass surfaces / glowing CTA | `GlassPanel`, `GlowButton`, `GlowLink`; `GlassFilterDefs` is rendered ONCE (in `BottomNav`) |
| Headings | `KineticText` (letters spring in, shimmer overlay), `TextReveal` (`fade-up`/`blur` are CSS; `scramble`/`glitch`) |
| Phase change cover | `PhaseTransition({ kind, play, onCovered, onDone })` (parent sets `play=false` in `onDone`) |
| Reward | `Celebrate({ kind, play })` (parent must be `relative`), `StampPress`, `haptic("tap" \| "success" \| "error")` in `lib/haptics.ts` |
| Card zooms into the next page | `ZoomNavigate` + `ZoomOverlayHost` (mounted once in `app/layout.tsx`) |

Scene data lives in `lib/scene/` (`types.ts` contract: `SceneKit` with `sky`, ordered `layers`, `ambient`, `transition`, `celebrate`, `ink`). `getSceneKit(id)` and `sceneIdForLevel(level)` pick the kit. Kits are in `lib/scene/kits/*.ts` and registered in `lib/scene/kits/index.ts`.

## 2. Rules that every animation must follow

- Animate only `transform`, `opacity`, `filter`, `background-position`. Never width/height/top/left.
- Respect `prefers-reduced-motion`: no loops, no parallax, no tilt, no shader motion, no haptics; content stays complete. `app/fx.css` neutralises CSS loops; JS-driven motion must check `useReducedMotion`.
- `useReducedMotion()` is `null` on the server. Gate the reduced branch on a `mounted` flag so the first client render equals the server render (no hydration warning).
- Pause off-screen work: `useInView` (`components/fx/useInView.ts`) returns `[ref, active]`; set `data-paused={!active}` on the root.
- Content must be visible in server HTML. Never ship `opacity:0` in SSR for headings or cards; entrance animations are CSS keyframes with `both` fill or start from the final state.
- One WebGL canvas per screen. `intensity="calm"` never mounts the shader (use `kit.sky` CSS).
- Decorative layers: `aria-hidden="true"` and `pointer-events-none`. Real text never lives only in canvas or images.
- No hooks inside loops: one child component per layer / per item that calls `useTransform`.
- `ParallaxScene`'s `PanelCard` writes opacity/transform straight to its DOM node via `useMotionValueEvent` (binding through motion `style` stopped updating panel 0). Keep that approach there.
- Tailwind v4 implements `-translate-y-*` and `-rotate-*` with the CSS `translate` / `rotate` properties. `transition-[transform]` does NOT cover them: use `transition-[translate]`. They also stack with a `transform` set by keyframes.
- Do not retrigger a shake by changing `key` (remounts inputs, loses focus). Use `useAnimate`.
- Answers are never shown as correct/wrong before the player presses "Kiểm tra". Feedback animations run only after the check.
- Do not change scoring, attempts, hint counting, judge requests, or `onDone` payloads when polishing stations.
- Particle cap 60, DPR cap 2 (1.5 for WebGL). Extra JS budget for a feature ≤ 25KB gzip. Check First Load JS in a build.

## 3. Add or change a scene kit

1. Make layers, far → near, 960px wide, transparent WebP (≤ 150KB each; sky is a full-frame opaque 960×1720). A layer that moves (lantern, flag, boat, smoke) is its own file. Lantern top edge = hanging point (`sway`); flag pole on the left edge (`flag`).
2. Describe each layer in `lib/scene/kits/<id>.ts`: `src` under `/scenes/<id>/`, `depth` (0 far … 1 near), `className` (Tailwind absolute positioning, bottom-anchored percentages such as `bottom-[20%] left-[6%] w-[88%]`), optional `animate`.
3. Set `sky` to `url(/scenes/<id>/ai-sky.webp) center / cover no-repeat, <fallback gradient>`.
4. Pick `ambient`, `transition`, `celebrate`, `ink` (`"light"` text on dark scenes). Map the kit to a shader preset in `SceneBackdrop` / `ParallaxScene` if it is a new id.
5. Check it reads in all three crops: ~60dvh hero, 140–224px card strip, full-screen stage.

## 4. Scene artwork with AI (Gemini)

- Prompts and layer table: `scripts/gen-scene-art.mjs` (constants `STYLE`, `KEYED`, `KITS`). Keyed layers are drawn on flat pure magenta (#FF00FF) and keyed out by the script.
- The direct Gemini API key has no image quota. Images are generated by the Antigravity (`agy`) inner model through `invoke_subagent` → built-in `image-generator`; it saves JPGs under `C:\Users\ACER\.gemini\antigravity-cli\brain\<id>\`. Copy each to `.art-raw/<kit>/<layer>.jpg`, then run `node scripts/gen-scene-art.mjs --kit <kit>` (it reuses existing JPGs and writes `public/scenes/<kit>/ai-<layer>.webp`). Never let it fall through to the API call.
- When the image quota is exhausted (429), stop; it resets at the time in the error (hours). Do not retry in a loop.
- Check each image on a dark background after keying (pink halos, magenta inside subjects, text/watermarks). Heritage details (Cham towers, citadel shape, bài chòi huts) must be confirmed by the content team.

## 5. Desktop (lg) layout

Breakpoint `lg` = 1024px. Mobile stays untouched: add only `lg:` classes. At lg the column is `max-w-[1200px] px-8 pt-24`, with a floating glass top nav (same `BottomNav` component). Full-bleed on mobile is `-mx-4 -mt-5`; at lg it is `lg:-mx-8 lg:-mt-24`.

## 6. Verify (do all)

1. `npx tsc --noEmit`, `npx eslint app components lib scripts`, `npx vitest run`.
2. Never run `next build` while a dev server uses the same folder (it overwrites `.next` and the dev server breaks with `Cannot find module './NNN.js'`). Stop dev or delete `.next` first.
3. Look at it in the browser at 375×812 and 1440×900. The Browser pane must be visible; when hidden, animation frames are throttled and timings are wrong.
4. Reduced motion on (DevTools → Rendering) still gives a complete, usable page. No console errors, no hydration warnings.

## 7. Delegating to workers

- One owner per file. After each task a reviewer pass (max 2 fix rounds).
- The inner Gemini model must not run shell commands (headless denies them and the run dies silently). Put the brief in `.agy-tasks/<task>.md`, pass a short prompt pointing to it, and run `tsc`/`eslint`/`vitest` yourself afterwards.
- Argon models may be out of quota: fall back argon-high → argon → hydrogen-high, hydrogen-high → hydrogen → flash.
