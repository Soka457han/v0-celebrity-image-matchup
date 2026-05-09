"use client"

import { useEffect, useRef, useState } from "react"

interface GlobeAnimationProps {
  latitude?: number
  longitude?: number
  celebName?: string
  autoRotate?: boolean
}

export function GlobeAnimation({
  latitude = 20,
  longitude = 0,
  celebName = "Your Match",
  autoRotate = true,
}: GlobeAnimationProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>()
  const stateRef = useRef({ currentX: 0, currentY: 0 })

  useEffect(() => {
    // Target rotation based on lat/lng
    const targetX = (latitude * Math.PI) / 180
    const targetY = (longitude * Math.PI) / 180

    let autoRotateAngle = 0

    const animate = () => {
      const state = stateRef.current

      // Lerp toward target
      const lerpSpeed = 0.06
      state.currentX += (targetX - state.currentX) * lerpSpeed
      state.currentY += (targetY - state.currentY) * lerpSpeed

      // Auto-rotate when arrived
      if (autoRotate && Math.abs(targetX - state.currentX) < 0.05) {
        autoRotateAngle += 0.003
        state.currentY = targetY + autoRotateAngle
      }

      setRotation({
        x: state.currentX,
        y: state.currentY,
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [latitude, longitude, autoRotate])

  // Create perspective transform for globe
  const rotX = rotation.x
  const rotY = rotation.y

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-background to-background/50 flex items-center justify-center perspective">
        {/* SVG Globe */}
        <svg
          width="280"
          height="280"
          viewBox="0 0 280 280"
          className="drop-shadow-lg"
          style={{
            transform: `rotateX(${rotX * 57.3}deg) rotateY(${rotY * 57.3}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform 0.05s ease-out",
          }}
        >
          {/* Background gradient */}
          <defs>
            <radialGradient id="globeGradient" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="50%" stopColor="#2d3748" />
              <stop offset="100%" stopColor="#1a202c" />
            </radialGradient>
            <radialGradient id="markerGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(255, 200, 0, 0.8)" />
              <stop offset="100%" stopColor="rgba(255, 200, 0, 0)" />
            </radialGradient>
          </defs>

          {/* Globe sphere */}
          <circle cx="140" cy="140" r="130" fill="url(#globeGradient)" stroke="#ec4899" strokeWidth="2" />

          {/* Latitude lines */}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <circle
              key={`lat-${lat}`}
              cx="140"
              cy={140 - (lat * 130) / 90}
              r={(130 * Math.cos((lat * Math.PI) / 180)) / 1.2}
              fill="none"
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.6"
            />
          ))}

          {/* Longitude lines */}
          {[-180, -90, 0, 90, 180].map((lng) => (
            <line
              key={`lng-${lng}`}
              x1="140"
              y1="10"
              x2="140"
              y2="270"
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.4"
              transform={`rotate(${lng} 140 140)`}
            />
          ))}

          {/* Marker for location */}
          <circle
            cx="140"
            cy="20"
            r="10"
            fill="url(#markerGlow)"
            transform={`rotate(${longitude * 57.3} 140 140)`}
          />
          <circle
            cx="140"
            cy="20"
            r="5"
            fill="#ffc800"
            transform={`rotate(${longitude * 57.3} 140 140)`}
          />

          {/* Shine effect */}
          <ellipse
            cx="105"
            cy="105"
            rx="45"
            ry="45"
            fill="white"
            opacity="0.1"
          />
        </svg>
      </div>

      {/* Location label */}
      <div className="text-center text-sm">
        <p className="text-muted-foreground text-xs">From</p>
        <p className="font-display text-base text-primary capitalize">{celebName}</p>
      </div>
    </div>
  )
}
