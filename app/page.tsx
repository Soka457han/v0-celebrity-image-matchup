import { StarMatcher } from "@/components/star-matcher"
import { CELEBS } from "@/lib/celebs"

export default function Page() {
  // group counts by category for the lineup section
  const counts = CELEBS.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1
    return acc
  }, {})
  const categories = Object.entries(counts).sort((a, b) => b[1] - a[1])

  // Pick a handful of well-known names to flash as a "featured" marquee
  const featured = [
    "Taylor Swift",
    "Zendaya",
    "Bad Bunny",
    "Timothée Chalamet",
    "Beyoncé",
    "Dua Lipa",
    "LeBron James",
    "Margot Robbie",
    "Harry Styles",
    "Rihanna",
    "Pedro Pascal",
    "Sabrina Carpenter",
    "Drake",
    "Sydney Sweeney",
    "Cristiano Ronaldo",
    "Olivia Rodrigo",
    "Ryan Gosling",
    "Billie Eilish",
    "Shah Rukh Khan",
    "Jennifer Lawrence",
  ]

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display text-primary-foreground text-lg leading-none">S</span>
            </div>
            <span className="font-display text-xl tracking-wider">STARMATCH</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              AI Powered
            </div>
            <div className="text-xs uppercase tracking-widest text-foreground font-bold">
              {CELEBS.length}+ stars
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-20 pb-6 text-center flex flex-col items-center gap-5">
        <span className="text-xs tracking-[0.4em] text-accent font-bold uppercase">
          The Celebrity Look-Alike App of 2026
        </span>
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl tracking-tight leading-[0.9] text-balance">
          WHICH CELEB
          <br />
          <span className="text-primary">DO YOU LOOK LIKE</span>?
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl text-pretty">
          Drop a selfie. Our AI scans your features against{" "}
          <span className="text-foreground font-bold">{CELEBS.length}+ real celebrities</span> and finds the twin you
          didn&apos;t know you had.
        </p>
      </section>

      {/* Marquee of famous names */}
      <section className="border-y border-border bg-card overflow-hidden mb-10">
        <div className="flex gap-8 py-4 animate-[marquee_40s_linear_infinite] whitespace-nowrap">
          {[...featured, ...featured].map((name, i) => (
            <span key={i} className="font-display text-lg tracking-wider text-muted-foreground">
              {name.toUpperCase()} <span className="text-primary mx-2">★</span>
            </span>
          ))}
        </div>
      </section>

      {/* Matcher */}
      <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
        <StarMatcher />
      </section>

      {/* Pool of stars by category */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">THE LINEUP</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {CELEBS.length} icons across {categories.length} vibes. Who&apos;s your match?
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map(([cat, count]) => (
            <div
              key={cat}
              className="rounded-2xl bg-card border border-border p-4 hover:border-primary/60 transition-colors flex flex-col gap-1"
            >
              <span className="font-display text-2xl text-primary leading-none">{count}</span>
              <span className="text-xs tracking-widest uppercase text-foreground">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>STARMATCH &copy; 2026 — Just for fun. Photos via Wikipedia.</span>
          <span className="tracking-widest uppercase">Powered by AI Vision</span>
        </div>
      </footer>
    </main>
  )
}
