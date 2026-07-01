'use client';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// kotak yang merepresentasikan rompi
// tiap frame berdasarkan roll/pitch terbaru dari props.
function VestModel({ roll, pitch }: { roll: number; pitch: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.order = 'ZXY';
    groupRef.current.rotation.z = THREE.MathUtils.degToRad(roll);
    groupRef.current.rotation.x = THREE.MathUtils.degToRad(pitch);
  });

  return (
    <group ref={groupRef}>
      {/* Badan rompi — TEGAK saat roll=pitch=0 (Y=tinggi, X=lebar, Z=tebal) */}
      <mesh>
        <boxGeometry args={[0.8, 1.4, 0.25]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>

      {/* Garis tengah vertikal untukj patokan orientasi */}
      <mesh position={[0, 0, 0.13]}>
        <boxGeometry args={[0.05, 1.2, 0.01]} />
        <meshStandardMaterial color="#92400E" />
      </mesh>

      {/* Titik merah di puncak anggap kelapa */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#EF4444" />
      </mesh>
    </group>
  );
}

type Orientation3DProps = {
  roll: number;
  pitch: number;
};

export function Orientation3D({ roll, pitch }: Orientation3DProps) {
  return (
    <div className="h-56 overflow-hidden rounded-lg bg-ink-900">
      <Canvas
        camera={{ position: [0, 1.5, 3.5], fov: 45 }}
        frameloop="always"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={1} />
        <directionalLight position={[-3, 2, -2]} intensity={0.3} />
        <VestModel roll={roll} pitch={pitch} />
        <gridHelper args={[4, 8, '#374151', '#1F2937']} />
      </Canvas>
    </div>
  );
}
