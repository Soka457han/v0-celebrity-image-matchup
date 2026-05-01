"use client"

import { useEffect, useRef } from "react"
import cobe from "cobe"

interface GlobeAnimationProps {
  latitude?: number
  longitude?: number
  celebName?: string
  autoRotate?: boolean
}

export function GlobeAnimation({
  latitude = 0,
  longitude = 0,
  celebName = "Your Match",
  autoRotate = true,
}: GlobeAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const targetPhiRef = useRef(0)
  const targetThetaRef = useRef(0)

  useEffect(() => {
    if (!canvasRef.current) return

    // Convert lat/lng to 3D sphere coordinates (phi, theta)
    const phi = Math.PI / 2 - (latitude * Math.PI) / 180
    const theta = (longitude * Math.PI) / 180
    targetPhiRef.current = phi
    targetThetaRef.current = theta

    let currentPhi = Math.PI * 1.5
    let currentTheta = 0
    let animationFrameId: number

    const globe = cobe({
      devicePixelRatio: 2,
      width: canvasRef.current.clientWidth * 2,
      height: canvasRef.current.clientHeight * 2,
      phi: currentPhi,
      theta: currentTheta,
      dark: 1,
      diffuse: 1.2,
      scale: 1,
      atmosphere: true,
      offset: [0, 0],
      basColor: [0.3, 0.3, 0.3],
      markerColor: [1, 0.73, 0],
      glowColor: [1, 0.73, 0],
      markers: [{ location: [latitude, longitude], size: 0.15 }],
      onRender: (state) => {
        // Smoothly animate toward the target location
        const lerpSpeed = 0.08
        currentPhi += (targetPhiRef.current - currentPhi) * lerpSpeed
        currentTheta += (targetThetaRef.current - currentTheta) * lerpSpeed

        // Auto-rotate after landing
        if (autoRotate && Math.abs(targetPhiRef.current - currentPhi) < 0.01) {
          currentTheta += 0.0005
        }

        state.phi = currentPhi
        state.theta = currentTheta
      },
    })

    globeRef.current = globe

    const handleResize = () => {
      if (!canvasRef.current) return
      const w = canvasRef.current.clientWidth
      const h = canvasRef.current.clientHeight
      globe.resize(w * 2, h * 2)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      globe.destroy()
    }
  }, [latitude, longitude, autoRotate])

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden border border-primary/20">
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Matched from</p>
        <p className="font-display text-lg text-primary">{celebName}</p>
      </div>
    </div>
  )
}
