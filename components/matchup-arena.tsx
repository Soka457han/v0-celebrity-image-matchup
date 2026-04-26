"use client"

import { useMemo, useState } from "react"
import { matchups } from "@/lib/matchups"
import { CelebCard } from "@/components/celeb-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, RotateCcw, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type Pick = {
  matchupId: string
  pickedId: string
  winnerId: string
}

export function MatchupArena() {
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<Pick[]>([])
  const [seed] = useState(() => Math.random())

  const total = matchups.length
  const current = matchups[index]
  const isComplete = index >= total
  const currentPick = picks.find((p) => p.matchupId === current?.id)
  const voted = Boolean(currentPick)

  // Slightly randomize the percentages around baseline so it feels alive,
  // but keep them deterministic per session+matchup.
  const { leftPct, rightPct } = useMemo(() => {
    if (!current) return { leftPct: 50, rightPct: 50 }
    const jitter = ((seed * 1000 + index * 37) % 9) - 4 // -4..+4
    let left = Math.round(current.left.baselinePct + jitter)
    left = Math.max(15, Math.min(85, left))
    return { leftPct: left, rightPct: 100 - left }
  }, [current, index, seed])

  const winnerId = current ? (leftPct >= rightPct ? current.left.id : current.right.id) : ""

  function vote(side: "left" | "right") {
    if (!current || voted) return
    const pickedId = side === "left" ? current.left.id : current.right.id
    setPicks((prev) => [...prev, { matchupId: current.id, pickedId, winnerId }])
  }

  function next() {
    setIndex((i) => i + 1)
  }

  function reset() {
    setPicks([])
    setIndex(0)
  }

  // Score: how many times user agreed with the crowd
  const inSyncCount = picks.filter((p) => p.pickedId === p.winnerId).length

  if (isComplete) {
    const pct = Math.round((inSyncCount / total) * 100)
    const verdict =
      pct >= 80
        ? { title: "Main Character", sub: "You ARE the algorithm." }
        : pct >= 50
          ? { title: "Certified Tastemaker", sub: "Mostly aligned with the timeline." }
          : pct >= 20
            ? { title: "Underground Energy", sub: "Niche picks. Respect." }
            : { title: "Total Outlier", sub: "You hate every popular thing — iconic." }

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-12 text-center">
        <span className="rounded-full border border-border bg-card px-4 py-1.5 font-mono text-[11px] font-bold tracking-widest uppercase">
          Final Verdict
        </span>

        <div className="space-y-4">
          <h1 className="font-display text-7xl leading-[0.9] tracking-tight text-balance uppercase md:text-8xl">
            <span className="text-primary">{verdict.title}</span>
          </h1>
          <p className="text-lg text-muted-foreground text-pretty md:text-xl">{verdict.sub}</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 rounded-2xl border-2 border-border bg-card p-6">
          <Stat label="Battles" value={String(total)} />
          <Stat label="In Sync" value={String(inSyncCount)} accent />
          <Stat label="Match" value={`${pct}%`} />
        </div>

        <Button
          onClick={reset}
          size="lg"
          className="h-14 rounded-full px-8 font-mono text-sm font-bold tracking-widest uppercase"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Run It Back
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-10">
      {/* Header / progress */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 fill-accent text-accent" />
          <span className="font-display text-2xl leading-none tracking-tight uppercase md:text-3xl">Celeb Clash</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          <span className="text-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {matchups.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < index ? "bg-primary" : i === index ? "bg-foreground" : "bg-border",
            )}
          />
        ))}
      </div>

      {/* Category tag */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-[11px] font-bold tracking-widest uppercase">{current.category}</span>
        </div>
      </div>

      {/* Matchup */}
      <div className="relative">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <CelebCard
            celeb={current.left}
            side="left"
            voted={voted}
            isPicked={currentPick?.pickedId === current.left.id}
            isWinner={winnerId === current.left.id}
            pct={leftPct}
            onPick={() => vote("left")}
          />
          <CelebCard
            celeb={current.right}
            side="right"
            voted={voted}
            isPicked={currentPick?.pickedId === current.right.id}
            isWinner={winnerId === current.right.id}
            pct={rightPct}
            onPick={() => vote("right")}
          />
        </div>

        {/* VS badge */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-foreground font-display text-2xl tracking-tight text-background uppercase transition-transform duration-300 md:h-20 md:w-20 md:text-3xl",
              voted && "scale-90 opacity-70",
            )}
          >
            VS
          </div>
        </div>
      </div>

      {/* Footer / next button */}
      <div className="flex min-h-14 items-center justify-center">
        {voted ? (
          <Button
            onClick={next}
            size="lg"
            className="h-14 rounded-full bg-foreground px-8 font-mono text-sm font-bold tracking-widest text-background uppercase hover:bg-foreground/90"
          >
            {index === total - 1 ? "See Results" : "Next Battle"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Pick your fave →</p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn("font-display text-4xl leading-none tracking-tight md:text-5xl", accent && "text-accent")}>
        {value}
      </span>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{label}</span>
    </div>
  )
}
