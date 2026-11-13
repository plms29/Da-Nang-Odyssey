declare global {
  interface Window {
    __dnMapsReady?: () => void;
    gm_authFailure?: () => void;
    google?: {
      maps: typeof google.maps;
    };
  }
}

let mapsPromise: Promise<typeof google.maps> | null = null;
let isPending = false;

export function loadMaps(apiKey: string): Promise<typeof google.maps> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Google Maps chỉ có thể tải trên trình duyệt."),
    );
  }

  if (mapsPromise && isPending) {
    return mapsPromise;
  }

  if (window.google?.maps) {
    if (!mapsPromise) {
      if (
        typeof window.google.maps.importLibrary === "function" &&
        (typeof window.google.maps.Map !== "function" ||
          typeof window.google.maps.Marker !== "function")
      ) {
        isPending = true;
        const maps = window.google.maps;
        mapsPromise = (async () => {
          await maps.importLibrary("maps");
          await maps.importLibrary("marker");
          isPending = false;
          return maps;
        })().catch((err: unknown) => {
          isPending = false;
          mapsPromise = null;
          throw err;
        });
      } else {
        mapsPromise = Promise.resolve(window.google.maps);
      }
    }
    return mapsPromise;
  }

  isPending = true;
  mapsPromise = new Promise<typeof google.maps>((resolve, reject) => {
    let settled = false;
    const script = document.createElement("script");

    const cleanup = () => {
      delete window.gm_authFailure;
      delete window.__dnMapsReady;
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      isPending = false;
      cleanup();
      if (typeof script.remove === "function") {
        script.remove();
      } else if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      mapsPromise = null;
      reject(new Error(message));
    };

    const handleError = () => {
      fail("Không tải được Google Maps script.");
    };

    window.gm_authFailure = handleError;

    window.__dnMapsReady = async () => {
      if (settled) return;
      const maps = window.google?.maps;
      if (!maps) {
        fail("Không khởi tạo được Google Maps.");
        return;
      }

      try {
        await maps.importLibrary("maps");
        await maps.importLibrary("marker");
      } catch {
        fail("Không khởi tạo được Google Maps.");
        return;
      }

      if (settled) return;
      settled = true;
      isPending = false;
      cleanup();
      resolve(maps);
    };

    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&language=vi&region=VN&loading=async&callback=__dnMapsReady`;
    script.async = true;
    script.onerror = handleError;

    document.head.appendChild(script);
  });

  return mapsPromise;
}
