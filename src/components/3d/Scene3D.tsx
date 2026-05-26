'use client';
// ============================================================================
// Scene3D — Three.js Particle Field Background
// Premium animated particle system with floating orbs
// ============================================================================

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Animated particle field component */
function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 1500;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spread particles across a large volume
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;

      // Color: mix of violet, cyan, and magenta
      const t = Math.random();
      if (t < 0.33) {
        // Violet
        col[i * 3] = 0.545;
        col[i * 3 + 1] = 0.361;
        col[i * 3 + 2] = 0.965;
      } else if (t < 0.66) {
        // Cyan
        col[i * 3] = 0.024;
        col[i * 3 + 1] = 0.714;
        col[i * 3 + 2] = 0.831;
      } else {
        // Magenta
        col[i * 3] = 0.925;
        col[i * 3 + 1] = 0.282;
        col[i * 3 + 2] = 0.6;
      }
    }

    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Slow rotation for depth effect
    meshRef.current.rotation.y = time * 0.02;
    meshRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;

    // Gentle floating animation
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] += Math.sin(time * 0.3 + i * 0.01) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/** Floating glowing orb */
function FloatingOrb({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseY = position[1];

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
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

/** Main 3D scene wrapper */
export default function Scene3D() {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power',
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <ParticleField />
        <FloatingOrb position={[-5, 2, -3]} color="#8b5cf6" scale={2} />
        <FloatingOrb position={[4, -1, -5]} color="#06b6d4" scale={1.5} />
        <FloatingOrb position={[6, 3, -8]} color="#ec4899" scale={2.5} />
        <FloatingOrb position={[-3, -2, -6]} color="#8b5cf6" scale={1.8} />
        <FloatingOrb position={[1, 4, -10]} color="#06b6d4" scale={3} />
      </Canvas>
    </div>
  );
}
