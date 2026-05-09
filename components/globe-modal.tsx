"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"

interface GlobeModalProps {
  isOpen: boolean
  celebName: string
  latitude: number
  longitude: number
  celebImage?: string
  onFadeComplete?: () => void
}

export function GlobeModal({
  isOpen,
  celebName,
  latitude,
  longitude,
  celebImage,
  onFadeComplete,
}: GlobeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    // Reset opacity when opening
    setOpacity(1)

    let currentPhi = Math.PI * 1.5
    let currentTheta = 0
    let phi = Math.PI / 2 - (latitude * Math.PI) / 180
    let theta = (longitude * Math.PI) / 180
    let hasArrived = false

    try {
      const globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: 800,
        height: 800,
        phi: currentPhi,
        theta: currentTheta,
        dark: 0.5,
        diffuse: 1.8,
        scale: 1,
        atmosphere: true,
        baseColor: [0.4, 0.4, 0.45],
        markerColor: [1, 0.8, 0],
        glowColor: [1, 0.8, 0],
        markers: [{ location: [latitude, longitude], size: 0.2 }],
        mapBrightness: 1.5,
        mapBaseBrightness: 0.6,
        offset: [0, 0],
        onRender: (state: any) => {
          // Smooth lerp to target
          const lerpSpeed = 0.05
          currentPhi += (phi - currentPhi) * lerpSpeed
          currentTheta += (theta - currentTheta) * lerpSpeed

          // Check if arrived
          if (!hasArrived && Math.abs(phi - currentPhi) < 0.02 && Math.abs(theta - currentTheta) < 0.02) {
            hasArrived = true
            // Start fade out after 2 seconds at destination
            setTimeout(() => {
              setOpacity(0)
              setTimeout(() => onFadeComplete?.(), 500)
            }, 2000)
          }

          state.phi = currentPhi
          state.theta = currentTheta
        },
      })

      globeRef.current = globe

      const handleResize = () => {
        if (!canvasRef.current || !globeRef.current) return
        globeRef.current.resize(800, 800)
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        if (globeRef.current) {
          globeRef.current.destroy()
        }
      }
    } catch (err) {
      console.log("[v0] globe modal error:", err)
    }
  }, [isOpen, latitude, longitude, onFadeComplete])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-500"
      style={{ opacity }}
    >
      <div className="relative flex flex-col items-center gap-4">
        {/* Globe Canvas */}
        <canvas ref={canvasRef} className="rounded-2xl" style={{ width: 400, height: 400 }} />

        {/* Celebrity Info Popup on Globe */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-card border-2 border-primary rounded-xl px-4 py-2 text-center shadow-2xl">
            {celebImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={celebImage}
                alt={celebName}
                className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
              />
            )}
            <p className="font-display text-lg text-primary font-bold">{celebName}</p>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center mt-4">
          <p className="text-white/80 text-sm">Finding your match...</p>
        </div>
      </div>
    </div>
  )
}
