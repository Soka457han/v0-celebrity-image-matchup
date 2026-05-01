"use client"

import { useEffect, useRef, useState } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    console.log("[v0] globe props:", { latitude, longitude, celebName })
    if (!canvasRef.current || !containerRef.current) {
      console.log("[v0] canvas or container ref missing")
      return
    }

    // Get container dimensions
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight
    console.log("[v0] globe dimensions:", width, height)

    if (width === 0 || height === 0) {
      console.log("[v0] container has no dimensions yet")
      return
    }

    // Convert lat/lng to phi/theta
    const phi = Math.PI / 2 - (latitude * Math.PI) / 180
    const theta = (longitude * Math.PI) / 180

    let currentPhi = Math.PI
    let currentTheta = 0.3

    try {
      const globe = cobe({
        canvas: canvasRef.current,
        devicePixelRatio: 2,
        width: width * 2,
        height: height * 2,
        phi: currentPhi,
        theta: currentTheta,
        dark: 1,
        diffuse: 1.2,
        scale: 1,
        atmosphere: true,
        offset: [0, 0],
        basColor: [0.35, 0.35, 0.35],
        markerColor: [1, 0.73, 0],
        glowColor: [1, 0.73, 0],
        markers: [{ location: [latitude, longitude], size: 0.12 }],
        onRender: (state: any) => {
          const lerpSpeed = 0.06
          currentPhi += (phi - currentPhi) * lerpSpeed
          currentTheta += (theta - currentTheta) * lerpSpeed

          if (autoRotate && Math.abs(phi - currentPhi) < 0.02) {
            currentTheta += 0.0003
          }

          state.phi = currentPhi
          state.theta = currentTheta
        },
      })

      globeRef.current = globe
      setIsReady(true)
      console.log("[v0] globe initialized successfully")

      const handleResize = () => {
        if (!containerRef.current || !globeRef.current) return
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        globeRef.current.resize(w * 2, h * 2)
      }

      window.addEventListener("resize", handleResize)
      return () => {
        window.removeEventListener("resize", handleResize)
        if (globeRef.current) {
          globeRef.current.destroy()
        }
      }
    } catch (err) {
      console.log("[v0] globe error:", err)
    }
  }, [latitude, longitude, autoRotate])

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border border-primary/30 bg-background"
        style={{ minHeight: "280px" }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Loading globe...</div>
          </div>
        )}
      </div>
      <div className="text-center text-sm">
        <p className="text-muted-foreground">Matched from</p>
        <p className="font-display text-base text-primary capitalize">{celebName}</p>
      </div>
    </div>
  )
}
