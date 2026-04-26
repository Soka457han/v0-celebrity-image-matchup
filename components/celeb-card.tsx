"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Celeb } from "@/lib/matchups"
import { Check } from "lucide-react"

type Props = {
  celeb: Celeb
  side: "left" | "right"
  voted: boolean
  isPicked: boolean
  isWinner: boolean
  pct: number
  onPick: () => void
}

export function CelebCard({ celeb, side, voted, isPicked, isWinner, pct, onPick }: Props) {
  const accentColor = side === "left" ? "bg-primary" : "bg-accent"
  const accentText = side === "left" ? "text-primary" : "text-accent"

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={voted}
      aria-label={`Vote for ${celeb.name}`}
      className={cn(
        "group relative flex-1 overflow-hidden rounded-2xl border-2 border-border bg-card text-left transition-all duration-300",
        !voted && "cursor-pointer hover:scale-[1.02] hover:border-foreground/40 active:scale-[0.99]",
        voted && isPicked && "border-foreground",
        voted && !isPicked && "opacity-50",
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={celeb.image || "/placeholder.svg"}
          alt={`Portrait of ${celeb.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-500",
            !voted && "group-hover:scale-105",
            voted && !isPicked && "grayscale",
          )}
          priority
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Tag chip */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase",
              side === "left" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
            )}
          >
            {celeb.tag}
          </span>
        </div>

        {/* Picked checkmark */}
        {voted && isPicked && (
          <div className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
        )}

        {/* Winner crown badge */}
        {voted && isWinner && (
          <div
            className={cn(
              "absolute top-4 right-4 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-widest uppercase",
              isPicked ? "translate-y-12 bg-accent text-accent-foreground" : "bg-accent text-accent-foreground",
            )}
          >
            CROWD FAVE
          </div>
        )}
      </div>

      {/* Name + percentage */}
      <div className="relative space-y-3 px-5 pt-3 pb-5">
        <h3 className="font-display text-4xl leading-none tracking-tight uppercase md:text-5xl">{celeb.name}</h3>

        {voted && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={cn("font-display text-3xl tracking-tight", accentText)}>{pct}%</span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">of votes</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", accentColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {!voted && (
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Tap to vote</p>
        )}
      </div>
    </button>
  )
}
