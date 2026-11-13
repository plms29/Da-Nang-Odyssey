"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { useInView } from "@/components/fx/useInView";
import {
  FRAGMENT_SHADERS,
  PRESET_FALLBACK_CSS,
  VERTEX_SHADER,
  type ShaderPreset,
} from "@/components/fx/shaders/presets";

export type { ShaderPreset };

interface GLResources {
  program: WebGLProgram;
  vertShader: WebGLShader;
  fragShader: WebGLShader;
  buffer: WebGLBuffer;
  uTime: WebGLUniformLocation | null;
  uRes: WebGLUniformLocation | null;
  uTilt: WebGLUniformLocation | null;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initGLResources(
  gl: WebGLRenderingContext,
  fragSource: string,
): GLResources | null {
  const vertShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vertShader || !fragShader) {
    if (vertShader) gl.deleteShader(vertShader);
    if (fragShader) gl.deleteShader(fragShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return null;
  }

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return null;
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const aPos = gl.getAttribLocation(program, "a_pos");
  if (aPos >= 0) {
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  }

  return {
    program,
    vertShader,
    fragShader,
    buffer,
    uTime: gl.getUniformLocation(program, "u_time"),
    uRes: gl.getUniformLocation(program, "u_res"),
    uTilt: gl.getUniformLocation(program, "u_tilt"),
  };
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
): void {
  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, rect.width || canvas.clientWidth || 1);
  const cssH = Math.max(1, rect.height || canvas.clientHeight || 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let width = Math.max(1, Math.round(cssW * dpr));
  let height = Math.max(1, Math.round(cssH * dpr));

  // Scale by 0.75 when pixel budget exceeds 1.5M pixels
  if (width * height > 1_500_000) {
    width = Math.max(1, Math.round(width * 0.75));
    height = Math.max(1, Math.round(height * 0.75));
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

export function ShaderBackdrop(props: {
  preset: ShaderPreset;
  className?: string;
  tilt?: { x: number; y: number };
}): JSX.Element {
  const { preset, className = "absolute inset-0", tilt } = props;
  const [rootRef, active] = useInView<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const activeRef = useRef(active);
  const startLoopRef = useRef<(() => void) | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const targetTiltRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentTiltRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const hasExternalTilt = tilt !== undefined;

  useEffect(() => {
    if (tilt !== undefined) {
      targetTiltRef.current = {
        x: Math.max(-1, Math.min(1, tilt.x)),
        y: Math.max(-1, Math.min(1, tilt.y)),
      };
    }
  }, [tilt]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    setMounted(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      startLoopRef.current?.();
    } else {
      stopLoopRef.current?.();
    }
  }, [active]);

  useEffect(() => {
    if (!mounted || reducedMotion || webglFailed || hasExternalTilt) return;

    const onPointerMove = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetTiltRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [mounted, reducedMotion, webglFailed, hasExternalTilt, rootRef]);

  useEffect(() => {
    if (!mounted || reducedMotion || webglFailed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setWebglFailed(true);
      return;
    }

    let resources = initGLResources(gl, FRAGMENT_SHADERS[preset]);
    if (!resources) {
      setWebglFailed(true);
      return;
    }

    let disposed = false;
    let contextLost = false;
    let rafId: number | null = null;
    let elapsedSec = 0;
    let lastNow: number | null = null;

    const cleanupResources = (res: GLResources | null) => {
      if (!res || gl.isContextLost()) return;
      gl.deleteBuffer(res.buffer);
      gl.deleteProgram(res.program);
      gl.deleteShader(res.vertShader);
      gl.deleteShader(res.fragShader);
    };

    const renderFrame = (timeSec: number) => {
      if (disposed || contextLost || !resources) return;
      currentTiltRef.current.x +=
        (targetTiltRef.current.x - currentTiltRef.current.x) * 0.08;
      currentTiltRef.current.y +=
        (targetTiltRef.current.y - currentTiltRef.current.y) * 0.08;

      gl.useProgram(resources.program);
      if (resources.uTime) gl.uniform1f(resources.uTime, timeSec);
      if (resources.uRes) {
        gl.uniform2f(resources.uRes, canvas.width, canvas.height);
      }
      if (resources.uTilt) {
        gl.uniform2f(
          resources.uTilt,
          currentTiltRef.current.x,
          currentTiltRef.current.y,
        );
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const tick = (now: number) => {
      rafId = null;
      if (disposed || contextLost || !activeRef.current) {
        lastNow = null;
        return;
      }
      if (lastNow !== null) {
        elapsedSec += Math.min((now - lastNow) * 0.001, 0.1);
      }
      lastNow = now;
      renderFrame(elapsedSec);
      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (disposed || contextLost || rafId !== null || !activeRef.current) {
        return;
      }
      lastNow = null;
      rafId = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastNow = null;
    };

    startLoopRef.current = startLoop;
    stopLoopRef.current = stopLoop;

    resizeCanvas(canvas, gl);
    renderFrame(0);
    setReady(true);

    if (activeRef.current) {
      startLoop();
    }

    const ro = new ResizeObserver(() => {
      if (disposed || contextLost) return;
      resizeCanvas(canvas, gl);
      renderFrame(elapsedSec);
    });
    ro.observe(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      stopLoop();
      setReady(false);
    };

    const onContextRestored = () => {
      if (disposed) return;
      resources = initGLResources(gl, FRAGMENT_SHADERS[preset]);
      if (!resources) {
        setWebglFailed(true);
        return;
      }
      contextLost = false;
      resizeCanvas(canvas, gl);
      renderFrame(elapsedSec);
      setReady(true);
      if (activeRef.current) {
        startLoop();
      }
    };

    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    return () => {
      disposed = true;
      stopLoop();
      startLoopRef.current = null;
      stopLoopRef.current = null;
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
        false,
      );
      cleanupResources(resources);
      resources = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [mounted, reducedMotion, webglFailed, preset]);

  const showCanvas = mounted && !reducedMotion && !webglFailed;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: PRESET_FALLBACK_CSS[preset] }}
      />
      {showCanvas && (
        <canvas
          key={preset}
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
