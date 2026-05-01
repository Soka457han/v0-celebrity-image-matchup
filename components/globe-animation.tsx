"use client"

import { useEffect, useRef } from "react"

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
  const animationRef = useRef<number>()
  const rotationRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    // Convert lat/lng to rotation target
    const targetRotX = (latitude * Math.PI) / 180
    const targetRotY = (longitude * Math.PI) / 180

    let currentRotX = Math.PI / 2
    let currentRotY = 0

    const drawGlobe = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Smoothly animate toward target rotation
      const lerpSpeed = 0.05
      currentRotX += (targetRotX - currentRotX) * lerpSpeed
      currentRotY += (targetRotY - currentRotY) * lerpSpeed

      // Auto-rotate when close to target
      if (autoRotate && Math.abs(targetRotX - currentRotX) < 0.02) {
        currentRotY += 0.003
      }

      // Draw globe sphere with gradient
      const gradient = ctx.createRadialGradient(centerX - 10, centerY - 10, 0, centerX, centerY, radius)
      gradient.addColorStop(0, "#4a5568")
      gradient.addColorStop(0.5, "#2d3748")
      gradient.addColorStop(1, "#1a202c")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw some latitude/longitude lines for visual reference
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = 0.5

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath()
        for (let lng = -180; lng <= 180; lng += 10) {
          const rad = (lat * Math.PI) / 180
          const azm = (lng * Math.PI) / 180

          const x = Math.cos(rad) * Math.cos(azm - currentRotY)
          const y = Math.sin(rad - currentRotX)

          if (Math.cos(rad) * Math.sin(azm - currentRotY) > 0) {
            const px = centerX + x * radius
            const py = centerY + y * radius

            if (lng === -180) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
        }
        ctx.stroke()
      }

      // Draw marker for the celeb's location
      const radLat = (latitude * Math.PI) / 180
      const radLng = (longitude * Math.PI) / 180

      const markerX = Math.cos(radLat) * Math.cos(radLng - currentRotY)
      const markerY = Math.sin(radLat - currentRotX)
      const markerZ = Math.cos(radLat) * Math.sin(radLng - currentRotY)

      // Only draw if on visible side of globe
      if (markerZ > 0) {
        const px = centerX + markerX * radius
        const py = centerY + markerY * radius

        // Golden glow
        const glowGradient = ctx.createRadialGradient(px, py, 0, px, py, 12)
        glowGradient.addColorStop(0, "rgba(255, 200, 0, 0.6)")
        glowGradient.addColorStop(1, "rgba(255, 200, 0, 0)")
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.fill()

        // Golden dot
        ctx.fillStyle = "#ffc800"
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw outline
      ctx.strokeStyle = "#ec4899"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      animationRef.current = requestAnimationFrame(drawGlobe)
    }

    drawGlobe()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [latitude, longitude, autoRotate])

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-primary/40 bg-background">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>
      <div className="text-center text-sm">
        <p className="text-muted-foreground">From</p>
        <p className="font-display text-base text-primary capitalize">{celebName}</p>
      </div>
    </div>
  )
}
