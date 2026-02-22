'use client'
import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ParticleGrid() {
    const pointsRef = useRef<THREE.Points>(null!)
    const count = 2000

    const [particles, setParticles] = React.useState<Float32Array | null>(null)

    React.useEffect(() => {
        const positions = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10
        }
        setParticles(positions)
    }, [count])

    useFrame((state) => {
        if (!pointsRef.current || !particles) return
        const time = state.clock.getElapsedTime()
        pointsRef.current.rotation.y = time * 0.05
        pointsRef.current.rotation.x = time * 0.03

        // Suave movimiento ondulado
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < count; i++) {
            const x = positions[i * 3]
            const z = positions[i * 3 + 2]
            positions[i * 3 + 1] += Math.sin(time + x) * 0.001
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true
    })

    if (!particles) return null

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.015}
                color="#ff0000"
                transparent
                opacity={0.4}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

export function HeroBackground() {
    return (
        <div className="absolute inset-0 -z-20 bg-black pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <fog attach="fog" args={['#000', 5, 15]} />
                <ambientLight intensity={0.5} />
                <ParticleGrid />
            </Canvas>
        </div>
    )
}
