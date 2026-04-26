import { MatchupArena } from "@/components/matchup-arena"

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      {/* Decorative blurred backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-accent/15 blur-3xl"
      />

      <MatchupArena />
    </main>
  )
}
