"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Upload, Sparkles, RotateCcw, Loader2, Camera, ExternalLink, Download, Users } from "lucide-react"
import { toBlob } from "html-to-image"
import { GlobeModal } from "./globe-modal"

type MatchedCeleb = {
  id: string
  name: string
  category: string
  image: string | null
  description: string | null
}

type MatchResult = {
  celeb: MatchedCeleb
  gender: "M" | "F"
  matchPercent: number
  reasoning: string
  features: string[]
  vibe: string
  location?: { lat?: number; lng?: number; country?: string }
}

type Stage = "idle" | "preview" | "loading" | "result" | "error"

export function StarMatcher() {
  const inputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage>("idle")
  const [userImage, setUserImage] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [otherResult, setOtherResult] = useState<MatchResult | null>(null)
  const [activeView, setActiveView] = useState<"main" | "other">("main")
  const [otherLoading, setOtherLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showGlobeModal, setShowGlobeModal] = useState(false)
  const [globeData, setGlobeData] = useState<{
    celebName: string
    latitude: number
    longitude: number
    celebImage?: string
  } | null>(null)

  // Whichever match is currently displayed
  const displayed = activeView === "other" && otherResult ? otherResult : result

  const downloadCard = async () => {
    // Always screenshot the offscreen desktop-sized export card so the
    // downloaded image looks identical regardless of the user's device.
    const node = exportRef.current
    if (!node || !displayed) return
    setDownloading(true)
    try {
      const blob = await toBlob(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
        width: 720,
        height: node.offsetHeight,
      })
      if (!blob) throw new Error("Could not generate image")

      const safeName = displayed.celeb.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const fileName = `celebmatch-${safeName}.png`
      const file = new File([blob], fileName, { type: "image/png" })

      // Best path on mobile + in-app browsers (Messenger, Instagram, etc.):
      // open the native share/save sheet via the Web Share API.
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "My CelebMatch",
            text: `I matched with ${displayed.celeb.name} on CelebMatch!`,
          })
          return
        } catch (shareErr) {
          // User cancelled — bail out silently.
          if ((shareErr as DOMException)?.name === "AbortError") return
          // Otherwise fall through to the download fallback below.
        }
      }

      // Desktop / browsers that allow programmatic downloads.
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = fileName
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (err) {
      console.log("[v0] download error:", err)
      setError("Could not save image. Try long-pressing the card to save it instead.")
    } finally {
      setDownloading(false)
    }
  }

  const fetchOtherGenderMatch = async () => {
    if (!userImage || !result || otherResult || otherLoading) return
    setOtherLoading(true)
    try {
      const opposite: "M" | "F" = result.gender === "M" ? "F" : "M"
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: userImage, forceGender: opposite, excludeId: result.celeb.id }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Could not load opposite-gender match")
      }
      const data = (await res.json()) as MatchResult
      setOtherResult(data)
      setActiveView("other")
    } catch (err) {
      console.log("[v0] other-gender match error:", err)
      setError(err instanceof Error ? err.message : "Could not load other match")
    } finally {
      setOtherLoading(false)
    }
  }

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
      console.log("[v0] match result received:", data)
      setResult(data)
      
      // Show globe modal with location data
      if (data.location && data.location.lat !== undefined && data.location.lng !== undefined) {
        console.log("[v0] showing globe modal with location:", data.location)
        setGlobeData({
          celebName: data.celeb.name,
          latitude: data.location.lat,
          longitude: data.location.lng,
          celebImage: data.celeb.image || undefined,
        })
        setShowGlobeModal(true)
        // Close modal and show results after animation (globe fades after ~4.5s)
        setTimeout(() => {
          console.log("[v0] fading out globe modal")
          setShowGlobeModal(false)
          setStage("result")
        }, 4500)
      } else {
        console.log("[v0] no location data, skipping globe modal")
        setStage("result")
      }
    } catch (err) {
      console.log("[v0] match error:", err)
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStage("error")
    }
  }

  const reset = () => {
    setUserImage(null)
    setResult(null)
    setOtherResult(null)
    setActiveView("main")
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
              Upload a clear photo and our AI will find your celebrity match in seconds.
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
            <p className="text-muted-foreground">Ready to meet your celebrity match?</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={runMatch}
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-lg hover:scale-[1.03] transition-transform"
            >
              <Sparkles className="size-5 group-hover:rotate-12 transition-transform" />
              Find My Match
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
            {["analyzing features", "scanning 1000+ celebs", "finding your match"].map((t) => (
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

      {/* Globe Modal Overlay */}
      <GlobeModal
        isOpen={showGlobeModal}
        celebName={globeData?.celebName || ""}
        latitude={globeData?.latitude || 0}
        longitude={globeData?.longitude || 0}
        celebImage={globeData?.celebImage}
        onFadeComplete={() => setShowGlobeModal(false)}
      />

      {stage === "result" && displayed && userImage && (
        <div className="flex flex-col gap-5">
          {/* Toggle pills — only shown once both genders are loaded */}
          {result && otherResult && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-card border border-border">
                <button
                  onClick={() => setActiveView("main")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeView === "main"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {result.gender === "M" ? "Male" : "Female"} match
                </button>
                <button
                  onClick={() => setActiveView("other")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeView === "other"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {otherResult.gender === "M" ? "Male" : "Female"} match
                </button>
              </div>
            </div>
          )}

          {/* SHARE CARD — designed to screenshot perfectly on mobile */}
          <div
            ref={cardRef}
            className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl shadow-primary/10"
          >
            {/* Branded header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
              <span className="font-display text-base sm:text-xl tracking-tight whitespace-nowrap">
                CELEB<span className="text-primary">MATCH</span>
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] text-accent font-bold uppercase whitespace-nowrap">
                {activeView === "other" ? `${displayed.gender === "M" ? "Male" : "Female"} pick` : "Match Confirmed"}
              </span>
            </div>

            {/* Headline */}
            <div className="px-4 sm:px-6 pb-4 text-center">
              <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">
                You give
              </p>
              <h2 className="font-display text-3xl sm:text-5xl md:text-6xl tracking-tight text-primary text-balance leading-[0.95]">
                {displayed.celeb.name.toUpperCase()}
              </h2>
              <p className="text-[10px] sm:text-xs tracking-widest uppercase text-muted-foreground mt-1">
                {displayed.celeb.category} energy
              </p>
            </div>

            {/* Two-up photos — ALWAYS side-by-side, even on small screens */}
            <div className="relative px-3 sm:px-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* You */}
                <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary">
                  <div className="relative aspect-[4/5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={userImage || "/placeholder.svg"}
                      alt="You"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Match */}
                <div className="relative rounded-2xl overflow-hidden border border-primary/40 bg-secondary">
                  <div className="relative aspect-[4/5]">
                    {displayed.celeb.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayed.celeb.image || "/placeholder.svg"}
                        alt={displayed.celeb.name}
                        className="w-full h-full object-cover object-top"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                        No photo available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating match badge — sits perfectly centered between the two photos */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/50 blur-2xl rounded-full" />
                  <div className="relative size-14 sm:size-20 md:size-24 lg:size-28 rounded-full bg-accent text-accent-foreground flex flex-col items-center justify-center font-display border-2 sm:border-[3px] md:border-4 border-card shadow-xl">
                    <span className="text-base sm:text-2xl md:text-3xl lg:text-4xl leading-none">{displayed.matchPercent}</span>
                    <span className="text-[7px] sm:text-[9px] md:text-[10px] tracking-[0.18em] mt-0.5">PERCENT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning + features */}
            <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-5">
              <p className="text-sm sm:text-base text-foreground/90 text-pretty text-center leading-relaxed">
                {displayed.reasoning}
              </p>

              {displayed.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                  {displayed.features.slice(0, 6).map((f) => (
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
                CELEB<span className="text-primary">MATCH</span> · AI CELEBRITY MATCH
              </span>
              <span className="capitalize text-accent font-bold tracking-wider truncate ml-2">
                {displayed.vibe}
              </span>
            </div>
          </div>

          {/* OFFSCREEN EXPORT CARD — fixed desktop sizing so the downloaded image
              looks the same on every device. Hidden from view but reachable to html-to-image. */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed -left-[10000px] top-0 select-none"
            style={{ width: 720 }}
          >
            <div
              ref={exportRef}
              className="relative rounded-3xl overflow-hidden border border-border bg-card"
              style={{ width: 720 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <span className="font-display text-xl tracking-tight">
                  CELEB<span className="text-primary">MATCH</span>
                </span>
                <span className="text-[11px] tracking-[0.3em] text-accent font-bold uppercase">
                  {activeView === "other" && displayed
                    ? `${displayed.gender === "M" ? "Male" : "Female"} pick`
                    : "Match Confirmed"}
                </span>
              </div>

              {/* Headline */}
              <div className="px-6 pb-5 text-center">
                <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-1">You give</p>
                <h2 className="font-display text-6xl tracking-tight text-primary text-balance leading-[0.95]">
                  {displayed?.celeb.name.toUpperCase()}
                </h2>
                <p className="text-xs tracking-widest uppercase text-muted-foreground mt-2">
                  {displayed?.celeb.category} energy
                </p>
              </div>

              {/* Two-up photos with centered badge */}
              <div className="relative px-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative rounded-2xl overflow-hidden border border-border bg-secondary">
                    <div className="relative aspect-[4/5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={userImage || "/placeholder.svg"}
                        alt="You"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden border border-primary/40 bg-secondary">
                    <div className="relative aspect-[4/5]">
                      {displayed?.celeb.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayed.celeb.image || "/placeholder.svg"}
                          alt={displayed.celeb.name}
                          className="w-full h-full object-cover object-top"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm px-2 text-center">
                          No photo available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/50 blur-2xl rounded-full" />
                    <div className="relative size-28 rounded-full bg-accent text-accent-foreground flex flex-col items-center justify-center font-display border-4 border-card shadow-xl">
                      <span className="text-4xl leading-none">{displayed?.matchPercent}</span>
                      <span className="text-[10px] tracking-[0.2em] mt-1">PERCENT</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasoning + features */}
              <div className="px-6 pt-5 pb-5">
                <p className="text-base text-foreground/90 text-pretty text-center leading-relaxed">
                  {displayed?.reasoning}
                </p>
                {displayed && displayed.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {displayed.features.slice(0, 6).map((f) => (
                      <span
                        key={f}
                        className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground capitalize"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs">
                <span className="font-display tracking-wider text-muted-foreground">
                  CELEB<span className="text-primary">MATCH</span> · AI CELEBRITY MATCH
                </span>
                <span className="capitalize text-accent font-bold tracking-wider truncate ml-2">
                  {displayed?.vibe}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {/* Show "see opposite-gender match" only if not yet loaded */}
            {result && !otherResult && (
              <button
                onClick={fetchOtherGenderMatch}
                disabled={otherLoading}
                className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-3 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {otherLoading ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
                {otherLoading
                  ? "Finding..."
                  : `See ${result.gender === "M" ? "female" : "male"} match`}
              </button>
            )}
            <button
              onClick={downloadCard}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-sm font-bold hover:scale-[1.03] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {downloading ? "Saving..." : "Download & share"}
            </button>
            <a
              href={`https://en.wikipedia.org/wiki/${displayed.celeb.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
            >
              About {displayed.celeb.name.split(" ")[0]} <ExternalLink className="size-3.5" />
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
