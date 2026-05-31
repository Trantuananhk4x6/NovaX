'use client';
// ============================================================================
// Scene3D — Three.js Particle Field Background
// Fixed: use delta-based time (avoids THREE.Clock deprecation in r168+)
// ============================================================================

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 1500;
const _pos = new Float32Array(PARTICLE_COUNT * 3);
const _col = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  _pos[i * 3]     = (Math.random() - 0.5) * 30;
  _pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
  _pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
  const t = Math.random();
  if (t < 0.33) {
    _col[i*3]=0.545; _col[i*3+1]=0.361; _col[i*3+2]=0.965;
  } else if (t < 0.66) {
    _col[i*3]=0.024; _col[i*3+1]=0.714; _col[i*3+2]=0.831;
  } else {
    _col[i*3]=0.925; _col[i*3+1]=0.282; _col[i*3+2]=0.6;
  }
}
const PARTICLE_POSITIONS = _pos;
const PARTICLE_COLORS    = _col;

function ParticleField() {
  const meshRef  = useRef<THREE.Points>(null);
  // Accumulate elapsed time from delta — avoids THREE.Clock.getElapsedTime()
  const elapsed  = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsed.current += delta;
    const time = elapsed.current;

    meshRef.current.rotation.y = time * 0.02;
    meshRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;

    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.01) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[PARTICLE_POSITIONS, 3]} />
        <bufferAttribute attach="attributes-color"    args={[PARTICLE_COLORS,    3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03} vertexColors transparent opacity={0.6}
        sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </points>
  );
}

function FloatingOrb({ position, color, scale = 1 }: {
  position: [number, number, number]; color: string; scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const baseY   = position[1];

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsed.current += delta;
    const time = elapsed.current;
    meshRef.current.position.y = baseY + Math.sin(time * 0.5 + position[0]) * 0.5;
    meshRef.current.position.x = position[0] + Math.cos(time * 0.3 + position[2]) * 0.3;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <ParticleField />
        <FloatingOrb position={[-5,  2,  -3]} color="#8b5cf6" scale={2}   />
        <FloatingOrb position={[ 4, -1,  -5]} color="#06b6d4" scale={1.5} />
        <FloatingOrb position={[ 6,  3,  -8]} color="#ec4899" scale={2.5} />
        <FloatingOrb position={[-3, -2,  -6]} color="#8b5cf6" scale={1.8} />
        <FloatingOrb position={[ 1,  4, -10]} color="#06b6d4" scale={3}   />
      </Canvas>
    </div>
  );
}
