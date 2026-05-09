'use client'

import { useEffect, useRef, useState } from 'react'
import createGlobe from 'cobe'

interface GlobeAnimationProps {
  latitude?: number
  longitude?: number
  celebName?: string
}

export function GlobeAnimation({
  latitude = 0,
  longitude = 0,
  celebName = 'Your Match',
}: GlobeAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Convert lat/lng to phi/theta for cobe
    const phi = Math.PI / 2 - (latitude * Math.PI) / 180
    const theta = (longitude * Math.PI) / 180

    let currentPhi = 0
    let currentTheta = 0
    let targetPhi = phi
    let targetTheta = theta

    try {
      const globe = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: 500,
        height: 500,
        phi: currentPhi,
        theta: currentTheta,
        dark: 0.7,
        diffuse: 1.5,
        scale: 1,
        atmosphere: true,
        baseColor: [0.35, 0.35, 0.4],
        markerColor: [1, 0.8, 0],
        glowColor: [1, 0.8, 0],
        markers: [{ location: [latitude, longitude], size: 0.15 }],
        mapBrightness: 1.4,
        mapBaseBrightness: 0.5,
        offset: [0, 0],
      })

      globeRef.current = globe
      setIsInitialized(true)

      // Animation loop
      let frameId: number
      let autoRotateAngle = 0

      const animate = () => {
        // Smooth lerp to target location
        const lerpSpeed = 0.05
        currentPhi += (targetPhi - currentPhi) * lerpSpeed
        currentTheta += (targetTheta - currentTheta) * lerpSpeed

        // Auto-rotate after arriving
        const distToPhi = Math.abs(targetPhi - currentPhi)
        const distToTheta = Math.abs(targetTheta - currentTheta)

        if (distToPhi < 0.01 && distToTheta < 0.01) {
          autoRotateAngle += 0.0005
          currentTheta = targetTheta + autoRotateAngle
        }

        globe.update({
          phi: currentPhi,
          theta: currentTheta,
        })

        frameId = requestAnimationFrame(animate)
      }

      frameId = requestAnimationFrame(animate)

      // Handle window resize
      const handleResize = () => {
        if (canvasRef.current && globeRef.current) {
          const rect = canvasRef.current.parentElement?.getBoundingClientRect()
          if (rect) {
            globe.update({
              width: Math.min(500, rect.width * 2),
              height: Math.min(500, rect.height * 2),
            })
          }
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        cancelAnimationFrame(frameId)
        window.removeEventListener('resize', handleResize)
        globe.destroy()
      }
    } catch (err) {
      console.error('[v0] Globe error:', err)
    }
  }, [latitude, longitude])

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border border-primary/30 bg-background/50">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground">Initializing globe...</div>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">From</p>
        <p className="font-display text-sm sm:text-base text-primary capitalize">{celebName}</p>
      </div>
    </div>
  )
}
