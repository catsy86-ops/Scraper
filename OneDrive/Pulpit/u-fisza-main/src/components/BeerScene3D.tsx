import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

/* ── Funny dancing beer mug with googly eyes and foam overflow ── */
const BeerMug = () => {
  const groupRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Silly dance wobble
      groupRef.current.rotation.z = Math.sin(t * 2) * 0.12;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.4;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.15 + Math.abs(Math.sin(t * 3)) * 0.05;
      groupRef.current.position.x = Math.sin(t * 0.8) * 0.1;
    }
    // Googly eyes look around
    if (leftEyeRef.current) {
      leftEyeRef.current.position.x = -0.18 + Math.sin(t * 1.3) * 0.03;
      leftEyeRef.current.position.y = 0.65 + Math.cos(t * 1.7) * 0.03;
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.position.x = 0.18 + Math.sin(t * 1.3 + 0.5) * 0.03;
      rightEyeRef.current.position.y = 0.65 + Math.cos(t * 1.7 + 0.5) * 0.03;
    }
    // Foam overflow jiggles
    if (foamRef.current) {
      foamRef.current.children.forEach((child, i) => {
        child.position.y = 1.05 + Math.sin(t * 2 + i * 1.5) * 0.06;
        child.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.15);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Mug body */}
      <RoundedBox args={[0.9, 1.3, 0.7]} radius={0.12} position={[0, 0, 0]}>
        <meshStandardMaterial color="#c8870a" roughness={0.3} metalness={0.4} />
      </RoundedBox>

      {/* Beer liquid inside (visible top) */}
      <RoundedBox args={[0.82, 0.3, 0.62]} radius={0.08} position={[0, 0.55, 0]}>
        <meshStandardMaterial color="#e6a000" roughness={0.1} metalness={0.2} transparent opacity={0.85} />
      </RoundedBox>

      {/* Handle */}
      <group position={[0.6, 0, 0]}>
        <RoundedBox args={[0.15, 0.8, 0.2]} radius={0.06} position={[0.1, 0.1, 0]}>
          <meshStandardMaterial color="#b07808" roughness={0.4} metalness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.25, 0.15, 0.2]} radius={0.05} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#b07808" roughness={0.4} metalness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.25, 0.15, 0.2]} radius={0.05} position={[0, -0.25, 0]}>
          <meshStandardMaterial color="#b07808" roughness={0.4} metalness={0.5} />
        </RoundedBox>
      </group>

      {/* Foam overflow blobs */}
      <group ref={foamRef}>
        {[
          [0, 1.05, 0.15],
          [-0.2, 1.08, 0.1],
          [0.2, 1.03, 0.2],
          [-0.1, 1.1, -0.1],
          [0.15, 1.07, -0.15],
          [0.3, 1.0, 0.05],
          [-0.3, 1.02, 0],
          [0, 1.12, 0],
        ].map((pos, i) => (
          <Sphere key={i} args={[0.12 + i * 0.01, 12, 12]} position={pos as [number, number, number]}>
            <MeshDistortMaterial
              color="#fff8e1"
              distort={0.3}
              speed={3}
              roughness={0.2}
              metalness={0.1}
            />
          </Sphere>
        ))}
        {/* Side drip */}
        <Sphere args={[0.08, 10, 10]} position={[-0.45, 0.7, 0.2]}>
          <MeshDistortMaterial color="#fff8e1" distort={0.4} speed={4} roughness={0.2} metalness={0.1} />
        </Sphere>
        <Sphere args={[0.06, 10, 10]} position={[0.42, 0.5, 0.15]}>
          <MeshDistortMaterial color="#fff8e1" distort={0.4} speed={4} roughness={0.2} metalness={0.1} />
        </Sphere>
      </group>

      {/* Eyes - white */}
      <Sphere args={[0.12, 16, 16]} position={[-0.18, 0.6, 0.36]}>
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </Sphere>
      <Sphere args={[0.12, 16, 16]} position={[0.18, 0.6, 0.36]}>
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </Sphere>

      {/* Pupils - googly */}
      <Sphere ref={leftEyeRef} args={[0.06, 12, 12]} position={[-0.18, 0.65, 0.46]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </Sphere>
      <Sphere ref={rightEyeRef} args={[0.06, 12, 12]} position={[0.18, 0.65, 0.46]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </Sphere>

      {/* Smile */}
      {[...Array(7)].map((_, i) => {
        const angle = (Math.PI * 0.15) + (i / 6) * Math.PI * 0.35;
        return (
          <Sphere key={`smile-${i}`} args={[0.02, 8, 8]} position={[
            Math.cos(angle) * 0.2,
            0.3 - Math.sin(angle) * 0.12,
            0.36
          ]}>
            <meshStandardMaterial color="#5c2d00" roughness={0.5} />
          </Sphere>
        );
      })}

      {/* Cheeks blush */}
      <Sphere args={[0.06, 10, 10]} position={[-0.32, 0.4, 0.32]}>
        <meshStandardMaterial color="#ff8c6b" transparent opacity={0.5} roughness={0.8} />
      </Sphere>
      <Sphere args={[0.06, 10, 10]} position={[0.32, 0.4, 0.32]}>
        <meshStandardMaterial color="#ff8c6b" transparent opacity={0.5} roughness={0.8} />
      </Sphere>

      {/* Label on mug */}
      <RoundedBox args={[0.5, 0.35, 0.01]} radius={0.04} position={[0, 0.05, 0.36]}>
        <meshStandardMaterial color="#fef3c7" roughness={0.8} metalness={0.1} />
      </RoundedBox>

      {/* "F" letter on label - made of small spheres */}
      {[
        [0, 0.12], [0, 0.06], [0, 0], [0, -0.06], [0, -0.12],
        [0.06, 0.12], [0.12, 0.12],
        [0.06, 0.02], [0.1, 0.02],
      ].map(([x, y], i) => (
        <Sphere key={`f-${i}`} args={[0.02, 6, 6]} position={[-0.06 + x, 0.05 + y, 0.375]}>
          <meshStandardMaterial color="#8B4513" roughness={0.5} />
        </Sphere>
      ))}
    </group>
  );
};

/* ── Rising beer bubbles ── */
const FloatingBubbles = () => {
  const bubblesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (bubblesRef.current) {
      bubblesRef.current.children.forEach((child, i) => {
        child.position.y = ((state.clock.elapsedTime * 0.4 + i * 0.8) % 5) - 2.5;
        child.position.x = Math.sin(state.clock.elapsedTime * 0.7 + i * 2) * (0.3 + i * 0.1);
        (child as THREE.Mesh).scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2);
      });
    }
  });

  return (
    <group ref={bubblesRef}>
      {Array.from({ length: 12 }).map((_, i) => (
        <Sphere key={i} args={[0.03 + Math.random() * 0.05, 12, 12]}
          position={[(Math.random() - 0.5) * 3, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2]}>
          <meshStandardMaterial
            color="#f5c542"
            transparent
            opacity={0.35}
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>
      ))}
    </group>
  );
};

/* ── Tiny flying foam splats ── */
const FoamSplats = () => {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const t = state.clock.elapsedTime;
        child.position.y = Math.sin(t * 0.5 + i) * 1.5 + 1;
        child.position.x = Math.sin(t * 0.3 + i * 1.5) * 2;
        child.position.z = Math.cos(t * 0.4 + i * 2) * 1;
        child.rotation.z = t * 0.5 + i;
      });
    }
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Sphere key={i} args={[0.04, 8, 8]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#fff8e1" transparent opacity={0.2} />
        </Sphere>
      ))}
    </group>
  );
};

const BeerScene3D = () => {
  return (
    <div className="w-full h-[350px] md:h-[450px]">
      <Canvas
        camera={{ position: [0, 0.3, 4.5], fov: 40 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#f5c542" />
        <pointLight position={[-3, 2, 4]} intensity={0.6} color="#ff8c00" />
        <spotLight position={[0, 5, 3]} intensity={0.4} color="#fef3c7" angle={0.5} />
        <pointLight position={[0, -2, 2]} intensity={0.3} color="#e6a000" />

        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
          <BeerMug />
        </Float>
        <FloatingBubbles />
        <FoamSplats />
      </Canvas>
    </div>
  );
};

export default BeerScene3D;
