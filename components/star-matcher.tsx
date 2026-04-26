"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Upload, Sparkles, RotateCcw, Loader2, Camera, ExternalLink } from "lucide-react"

type MatchedCeleb = {
  id: string
  name: string
  category: string
  image: string | null
  description: string | null
}

type MatchResult = {
  celeb: MatchedCeleb
  matchPercent: number
  reasoning: string
  features: string[]
  vibe: string
}

type Stage = "idle" | "preview" | "loading" | "result" | "error"

export function StarMatcher() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [userImage, setUserImage] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const resizeImage = (file: File, maxDim = 768): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const canvas = document.createElement("canvas")
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext("2d")
          if (!ctx) return reject(new Error("Canvas context unavailable"))
          ctx.drawImage(img, 0, 0, w, h)
          // JPEG @ 0.85 quality keeps it well under 500KB for most selfies
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.onerror = () => reject(new Error("Could not read image"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Could not read file"))
      reader.readAsDataURL(file)
    })

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.")
      setStage("error")
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image must be under 15MB.")
      setStage("error")
      return
    }

    try {
      const dataUrl = await resizeImage(file, 768)
      setUserImage(dataUrl)
      setStage("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process image")
      setStage("error")
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const runMatch = async () => {
    if (!userImage) return
    setStage("loading")
    setError(null)

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: userImage }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Match failed")
      }

      const data = (await res.json()) as MatchResult
      setResult(data)
      setStage("result")
    } catch (err) {
      console.log("[v0] match error:", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStage("error")
    }
  }

  const reset = () => {
    setUserImage(null)
    setResult(null)
    setError(null)
    setStage("idle")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <input ref={inputRef} type="file" accept="image/*" onChange={onInputChange} className="hidden" />

      {stage === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all ${
            dragActive
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border hover:border-primary/60 hover:bg-card"
          } p-12 md:p-20 flex flex-col items-center justify-center gap-6 text-center`}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
            <div className="relative size-20 rounded-2xl bg-primary flex items-center justify-center">
              <Upload className="size-10 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight text-balance">DROP YOUR SELFIE</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-md">
              Upload a clear photo and our AI will find your celebrity twin in seconds.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium">
              click to upload
            </span>
            <span className="text-muted-foreground text-sm">or drag &amp; drop</span>
          </div>
        </div>
      )}

      {stage === "preview" && userImage && (
        <div className="rounded-3xl bg-card border border-border p-6 md:p-10 flex flex-col items-center gap-6">
          <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userImage || "/placeholder.svg"} alt="Your upload" className="w-full h-full object-cover" />
          </div>
          <div className="text-center flex flex-col gap-2">
            <h3 className="font-display text-3xl md:text-4xl">LOOKING GOOD.</h3>
            <p className="text-muted-foreground">Ready to meet your celebrity twin?</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={runMatch}
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-lg hover:scale-[1.03] transition-transform"
            >
              <Sparkles className="size-5 group-hover:rotate-12 transition-transform" />
              Find My Twin
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-6 py-4 font-medium hover:bg-muted transition-colors"
            >
              <Camera className="size-4" />
              Different photo
            </button>
          </div>
        </div>
      )}

      {stage === "loading" && userImage && (
        <div className="rounded-3xl bg-card border border-border p-10 md:p-16 flex flex-col items-center gap-8">
          <div className="relative w-40 h-52 rounded-2xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={userImage || "/placeholder.svg"} alt="Your upload" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-2 bg-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="size-6 text-primary animate-spin" />
            <span className="font-display text-2xl md:text-3xl tracking-wide">SCANNING THE STARS...</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {["analyzing features", "scanning 500+ celebs", "finding your twin"].map((t) => (
              <span
                key={t}
                className="text-xs uppercase tracking-wider px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {stage === "result" && result && userImage && (
        <div className="flex flex-col gap-5">
          {/* SHARE CARD — designed to screenshot perfectly on mobile */}
          <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl shadow-primary/10">
            {/* Branded header */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
              <span className="font-display text-lg sm:text-xl tracking-tight">
                STAR<span className="text-primary">MATCH</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] text-accent font-bold uppercase">
                Match Confirmed
              </span>
            </div>

            {/* Headline */}
            <div className="px-4 sm:px-6 pb-4 text-center">
              <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">
                You give
              </p>
              <h2 className="font-display text-3xl sm:text-5xl md:text-6xl tracking-tight text-primary text-balance leading-[0.95]">
                {result.celeb.name.toUpperCase()}
              </h2>
              <p className="text-[10px] sm:text-xs tracking-widest uppercase text-muted-foreground mt-1">
                {result.celeb.category} energy
              </p>
            </div>

            {/* Two-up photos — ALWAYS side-by-side, even on small screens */}
            <div className="relative px-3 sm:px-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* You */}
                <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary">
                  <div className="relative aspect-[3/4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={userImage || "/placeholder.svg"} alt="You" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      You
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 font-display text-lg sm:text-2xl uppercase tracking-tight leading-none">
                      You
                    </div>
                  </div>
                </div>

                {/* Twin */}
                <div className="relative rounded-2xl overflow-hidden border border-primary/40 bg-secondary">
                  <div className="relative aspect-[3/4]">
                    {result.celeb.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.celeb.image || "/placeholder.svg"}
                        alt={result.celeb.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                        No photo available
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Twin
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 font-display text-base sm:text-2xl uppercase tracking-tight leading-none truncate">
                      {result.celeb.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating match badge — sits perfectly centered between the two photos */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/50 blur-2xl rounded-full" />
                  <div className="relative size-20 sm:size-24 md:size-28 rounded-full bg-accent text-accent-foreground flex flex-col items-center justify-center font-display border-[3px] sm:border-4 border-card shadow-xl">
                    <span className="text-2xl sm:text-3xl md:text-4xl leading-none">{result.matchPercent}</span>
                    <span className="text-[9px] sm:text-[10px] tracking-[0.2em] mt-0.5">PERCENT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning + features */}
            <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-5">
              <p className="text-sm sm:text-base text-foreground/90 text-pretty text-center leading-relaxed">
                {result.reasoning}
              </p>

              {result.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {result.features.slice(0, 6).map((f) => (
                    <span
                      key={f}
                      className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground capitalize"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / brand strip */}
            <div className="border-t border-border px-4 sm:px-6 py-3 flex items-center justify-between text-[10px] sm:text-xs">
              <span className="font-display tracking-wider text-muted-foreground">
                STAR<span className="text-primary">MATCH</span> · AI CELEBRITY TWIN
              </span>
              <span className="capitalize text-accent font-bold tracking-wider truncate ml-2">
                {result.vibe}
              </span>
            </div>
          </div>

          {/* Below-card secondary info (NOT inside the share frame) */}
          {result.celeb.description && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center px-4 line-clamp-3 max-w-xl mx-auto">
              {result.celeb.description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={`https://en.wikipedia.org/wiki/${result.celeb.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              About {result.celeb.name.split(" ")[0]} <ExternalLink className="size-3.5" />
            </a>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:scale-[1.03] transition-transform"
            >
              <RotateCcw className="size-4" />
              Try another photo
            </button>
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="rounded-3xl bg-card border border-destructive/50 p-10 flex flex-col items-center gap-4 text-center">
          <h3 className="font-display text-3xl text-destructive">OOPS.</h3>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-bold"
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
