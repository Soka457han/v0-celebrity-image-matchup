import { StarMatcher } from "@/components/star-matcher"
import { CELEBS } from "@/lib/celebs"

export default function Page() {
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

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>STARMATCH &copy; 2026 — Just for fun. Photos via Wikipedia.</span>
          <span className="tracking-widest uppercase">Powered by AI Vision</span>
        </div>
      </footer>
    </main>
  )
}
