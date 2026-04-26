import Image from "next/image"
import { StarMatcher } from "@/components/star-matcher"
import { CELEBS } from "@/lib/celebs"

export default function Page() {
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
          <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            AI Powered
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-20 pb-8 text-center flex flex-col items-center gap-5">
        <span className="text-xs tracking-[0.4em] text-accent font-bold uppercase">
          The Celebrity Look-Alike App of 2026
        </span>
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl tracking-tight leading-[0.9] text-balance">
          WHICH CELEB
          <br />
          <span className="text-primary">DO YOU LOOK LIKE</span>?
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl text-pretty">
          Drop a selfie. Our AI scans your features, vibe, and energy — then matches you to the celebrity twin you
          didn&apos;t know you had.
        </p>
      </section>

      {/* Matcher */}
      <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
        <StarMatcher />
      </section>

      {/* Celeb pool */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">THE LINEUP</h2>
            <p className="text-sm text-muted-foreground mt-1">10 icons in the pool. Who&apos;s your match?</p>
          </div>
          <span className="text-xs tracking-widest text-muted-foreground uppercase hidden sm:block">
            {CELEBS.length} stars
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CELEBS.map((c) => (
            <div
              key={c.id}
              className="group relative rounded-2xl overflow-hidden border border-border bg-card aspect-[3/4]"
            >
              <Image
                src={c.image || "/placeholder.svg"}
                alt={c.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3">
                <div className="font-display text-sm md:text-base leading-tight">{c.name.toUpperCase()}</div>
                <div className="text-[10px] tracking-wider uppercase text-muted-foreground line-clamp-1">{c.vibe}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>STARMATCH &copy; 2026 — Just for fun, not a real identity match.</span>
          <span className="tracking-widest uppercase">Powered by AI Vision</span>
        </div>
      </footer>
    </main>
  )
}
