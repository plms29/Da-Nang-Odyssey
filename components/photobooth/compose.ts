import type { Spot } from "@/lib/types";
import { drawFrame } from "./frames";

export const OUTPUT_WIDTH = 1080;
export const OUTPUT_HEIGHT = 1920;

export interface ComposePhotoOptions {
  spot: Spot;
  mode: "onsite" | "remote";
  mirrored: boolean;
  date: Date;
}

/**
 * Compose a 1080x1920 check-in JPEG entirely on the client device (CK-06).
 * Waits for `document.fonts.ready` before drawing text (CK-05).
 */
export async function composePhoto(
  video: HTMLVideoElement,
  opts: ComposePhotoOptions,
): Promise<Blob> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || vw <= 0 || vh <= 0) {
    throw new Error("Khung hình video chưa sẵn sàng.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không thể khởi tạo khung vẽ 2D.");
  }

  const targetAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;
  const videoAspect = vw / vh;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (videoAspect > targetAspect) {
    sh = vh;
    sw = vh * targetAspect;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    sw = vw;
    sh = vw / targetAspect;
    sx = 0;
    sy = (vh - sh) / 2;
  }

  ctx.save();
  if (opts.mirrored) {
    ctx.translate(OUTPUT_WIDTH, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  ctx.restore();

  // CK-05: Wait for Be Vietnam Pro font to finish loading before drawing Vietnamese diacritics
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
    try {
      const family = getComputedStyle(document.body).fontFamily;
      await Promise.all(
        ["600 30px", "700 48px"].map((f) =>
          document.fonts.load(`${f} ${family}`, "ĐÃ ĐẾN Ặ"),
        ),
      );
    } catch {}
  }

  drawFrame(ctx, OUTPUT_WIDTH, OUTPUT_HEIGHT, {
    spot: opts.spot,
    mode: opts.mode,
    date: opts.date,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không thể xuất ảnh JPEG."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9,
    );
  });
}
