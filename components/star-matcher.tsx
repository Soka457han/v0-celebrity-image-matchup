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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-xs tracking-[0.3em] text-accent font-bold uppercase">Match Confirmed</span>
            <h2 className="font-display text-5xl md:text-7xl tracking-tight text-balance">
              YOU GIVE <span className="text-primary">{result.celeb.name.toUpperCase()}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl text-pretty">{result.reasoning}</p>
          </div>

          {/* Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* User */}
            <div className="rounded-3xl overflow-hidden border border-border bg-card">
              <div className="relative aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={userImage || "/placeholder.svg"} alt="You" className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-bold uppercase tracking-wider">
                  You
                </div>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {result.features.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground capitalize"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Match badge */}
            <div className="flex md:flex-col items-center justify-center gap-2 py-4 md:py-0">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/40 blur-2xl rounded-full" />
                <div className="relative size-28 md:size-32 rounded-full bg-accent text-accent-foreground flex flex-col items-center justify-center font-display border-4 border-background">
                  <span className="text-4xl md:text-5xl leading-none">{result.matchPercent}</span>
                  <span className="text-xs tracking-widest mt-1">PERCENT</span>
                </div>
              </div>
              <span className="font-display text-2xl text-primary md:mt-2">MATCH</span>
            </div>

            {/* Celeb */}
            <div className="rounded-3xl overflow-hidden border border-border bg-card">
              <div className="relative aspect-[3/4] bg-secondary">
                {result.celeb.image ? (
                  // Wikipedia provides photos; using <img> avoids next/image domain config.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.celeb.image || "/placeholder.svg"}
                    alt={result.celeb.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No photo available
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                  Your Twin
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-2xl truncate">{result.celeb.name.toUpperCase()}</h3>
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground shrink-0">
                    {result.celeb.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground capitalize">{result.vibe}</p>
                {result.celeb.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{result.celeb.description}</p>
                )}
                <a
                  href={`https://en.wikipedia.org/wiki/${result.celeb.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  Read more <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold hover:scale-[1.03] transition-transform"
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
