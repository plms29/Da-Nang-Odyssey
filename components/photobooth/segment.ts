import type { ImageSegmenter } from "@mediapipe/tasks-vision";

let segmenter: Promise<ImageSegmenter> | null = null;

// Lazy: the ~15 MB wasm loads only when the player first asks for a background swap. Self-hosted, no CDN.
function getSegmenter(): Promise<ImageSegmenter> {
  segmenter ??= import("@mediapipe/tasks-vision")
    .then(async ({ FilesetResolver, ImageSegmenter }) =>
      ImageSegmenter.createFromOptions(await FilesetResolver.forVisionTasks("/models/wasm"), {
        baseOptions: { modelAssetPath: "/models/selfie_segmenter.tflite" },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    )
    .catch((err: unknown) => {
      segmenter = null; // allow a retry later
      throw err;
    });
  return segmenter;
}

const MIN_PERSON_SHARE = 0.02;

/** Person mask (alpha 255 = person) the size of `source`, soft edges; null on failure or no person. */
export async function segmentPerson(source: HTMLCanvasElement): Promise<HTMLCanvasElement | null> {
  try {
    const seg = await getSegmenter();
    let small: HTMLCanvasElement | null = null;
    seg.segment(source, (result) => {
      // Two-mask models put "person" at index 1; selfie_segmenter has one mask, which is "person".
      const masks = result.confidenceMasks ?? [];
      const mask = masks[masks.length - 1];
      if (!mask) return;
      const conf = mask.getAsFloat32Array();
      const img = new ImageData(mask.width, mask.height);
      let person = 0;
      for (let i = 0; i < conf.length; i++) {
        const a = Math.round(Math.min(1, Math.max(0, conf[i])) * 255);
        img.data[i * 4 + 3] = a;
        if (a > 127) person++;
      }
      if (person / conf.length < MIN_PERSON_SHARE) return;
      small = document.createElement("canvas");
      small.width = mask.width;
      small.height = mask.height;
      small.getContext("2d")?.putImageData(img, 0, 0);
    });
    if (!small) return null;

    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = source.height;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.filter = "blur(2px)";
    ctx.drawImage(small, 0, 0, out.width, out.height);
    return out;
  } catch (err) {
    console.error("segmentPerson failed", err);
    return null;
  }
}
