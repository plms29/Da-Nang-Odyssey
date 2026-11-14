"use client";

import { Billboard, useTexture } from "@react-three/drei";
import type { Exhibit as ExhibitData } from "@/lib/museum3d/data";

export function Exhibit({
  exhibit,
  active,
}: {
  exhibit: ExhibitData;
  active: boolean;
}) {
  const texture = useTexture(exhibit.image);

  return (
    <group position={[exhibit.x, 0, exhibit.z]}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshStandardMaterial
          color="#c9b79c"
          roughness={0.85}
          emissive={active ? "#d97706" : "#000000"}
          emissiveIntensity={active ? 0.35 : 0}
        />
      </mesh>
      <Billboard position={[0, 1.65, 0]}>
        <mesh>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
        </mesh>
      </Billboard>
    </group>
  );
}
