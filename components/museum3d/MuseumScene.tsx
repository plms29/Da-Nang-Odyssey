"use client";

import React, {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useProgress, useTexture } from "@react-three/drei";
import { BackSide, MeshStandardMaterial } from "three";
import { GlassPanel } from "@/components/fx/Glass";
import type { Exhibit as ExhibitData, Museum3D } from "@/lib/museum3d/data";
import { Exhibit } from "./Exhibit";
import {
  ControlsHint,
  FirstPersonControls,
  MobileJoystickOverlay,
} from "./FirstPersonControls";

function SkyDome() {
  const skyTexture = useTexture("/scenes/di-san-cham/ai-sky.webp");
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[45, 24, 16]} />
      <meshBasicMaterial map={skyTexture} side={BackSide} fog={false} />
    </mesh>
  );
}

function NearestExhibitTracker({
  exhibits,
  onNearChange,
}: {
  exhibits: ExhibitData[];
  onNearChange: (id: string | null) => void;
}) {
  const lastIdRef = useRef<string | null>(null);

  useFrame(({ camera }) => {
    const cx = camera.position.x;
    const cz = camera.position.z;

    let nearestId: string | null = null;
    let minDist = 2;

    for (let i = 0; i < exhibits.length; i++) {
      const ex = exhibits[i];
      const dist = Math.hypot(cx - ex.x, cz - ex.z);
      if (dist <= minDist) {
        minDist = dist;
        nearestId = ex.id;
      }
    }

    if (nearestId !== lastIdRef.current) {
      lastIdRef.current = nearestId;
      onNearChange(nearestId);
    }
  });

  return null;
}

function SceneLoader() {
  const { active, progress } = useProgress();
  if (!active || progress >= 100) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#f3d9b8] text-sm font-medium text-stone-800"
    >
      Đang tải không gian 3D… ({Math.round(progress)}%)
    </div>
  );
}

export function MuseumScene({ museum }: { museum: Museum3D }) {
  const joyRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(true);
  const [nearId, setNearId] = useState<string | null>(null);

  const handleCloseHint = useCallback(() => {
    setShowHint(false);
  }, []);

  const { width: w, depth: d, height: h } = museum.hall;
  const t = 0.4;

  const brickMaterial = useMemo(
    () => new MeshStandardMaterial({ color: "#9c4a32", roughness: 0.85 }),
    [],
  );

  const bounds = useMemo(
    () => ({
      minX: -w / 2 + 0.3,
      maxX: w / 2 - 0.3,
      minZ: -d / 2 + 0.3,
      maxZ: d / 2 - 0.3,
    }),
    [w, d],
  );

  const columns = useMemo(() => {
    const colX = w / 2 - 0.5;
    const zOffsets = [-d / 3, 0, d / 3];
    const list: [number, number, number][] = [];
    for (const z of zOffsets) {
      list.push([-colX, h / 2, z]);
      list.push([colX, h / 2, z]);
    }
    return list;
  }, [w, d, h]);

  const activeExhibit = useMemo(
    () => museum.exhibits.find((ex) => ex.id === nearId) ?? null,
    [museum.exhibits, nearId],
  );

  return (
    <div className="relative h-full w-full">
      <Canvas
        role="img"
        aria-label="Không gian 3D Bảo tàng Chăm"
        camera={{ fov: 70, position: [0, 1.6, 9] }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#f3d9b8"]} />
        <fog attach="fog" args={["#f3d9b8", 8, 30]} />

        <hemisphereLight args={["#ffe6c7", "#8c523a", 0.85]} />
        <directionalLight
          position={[6, 12, 8]}
          intensity={1.1}
          color="#ffd9a8"
        />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#b9654a" roughness={0.9} />
        </mesh>

        {/* 4 Cham brick walls */}
        <mesh
          position={[0, h / 2, -(d / 2 + t / 2)]}
          material={brickMaterial}
        >
          <boxGeometry args={[w + 2 * t, h, t]} />
        </mesh>
        <mesh
          position={[0, h / 2, d / 2 + t / 2]}
          material={brickMaterial}
        >
          <boxGeometry args={[w + 2 * t, h, t]} />
        </mesh>
        <mesh
          position={[-(w / 2 + t / 2), h / 2, 0]}
          material={brickMaterial}
        >
          <boxGeometry args={[t, h, d]} />
        </mesh>
        <mesh
          position={[w / 2 + t / 2, h / 2, 0]}
          material={brickMaterial}
        >
          <boxGeometry args={[t, h, d]} />
        </mesh>

        {/* 6 square low-poly columns along two walls */}
        {columns.map((pos, idx) => (
          <mesh key={idx} position={pos} material={brickMaterial}>
            <boxGeometry args={[0.6, h, 0.6]} />
          </mesh>
        ))}

        <Suspense fallback={null}>
          <SkyDome />
          {museum.exhibits.map((exhibit) => (
            <Exhibit
              key={exhibit.id}
              exhibit={exhibit}
              active={exhibit.id === nearId}
            />
          ))}
        </Suspense>

        <FirstPersonControls bounds={bounds} joystick={joyRef} />
        <NearestExhibitTracker
          exhibits={museum.exhibits}
          onNearChange={setNearId}
        />
      </Canvas>

      <SceneLoader />

      <MobileJoystickOverlay joystick={joyRef} />

      {showHint && <ControlsHint onClose={handleCloseHint} />}

      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 [@media(pointer:coarse)]:bottom-[13rem]"
      >
        {activeExhibit && (
          <GlassPanel
            tone="dark"
            className="pointer-events-auto max-h-[30vh] w-full max-w-md overflow-auto rounded-2xl border border-amber-200/30 bg-neutral-900/80 p-4 text-white shadow-xl"
          >
            <h2 className="text-base font-semibold text-amber-200">
              {activeExhibit.name}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-white/90">
              {activeExhibit.description}
            </p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
