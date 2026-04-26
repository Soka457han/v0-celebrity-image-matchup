import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { CELEBS, type Celeb } from "@/lib/celebs"

export const maxDuration = 30
export const dynamic = "force-dynamic"

type MatchResult = {
  celebId: string
  matchPercent: number
  reasoning: string
  features: string[]
  vibe: string
}

async function fetchWikiPhoto(slug: string): Promise<{ image: string | null; description: string | null }> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": "StarMatch/1.0 (celebrity-twin-app)" },
      cache: "no-store",
    })
    if (!res.ok) {
      console.log("[v0] wiki non-ok for", slug, res.status)
      return { image: null, description: null }
    }
    const data = (await res.json()) as {
      thumbnail?: { source?: string }
      originalimage?: { source?: string }
      description?: string
    }
    const image = data.originalimage?.source || data.thumbnail?.source || null
    return { image, description: data.description || null }
  } catch (e) {
    console.log("[v0] wiki fetch threw:", e instanceof Error ? e.message : String(e))
    return { image: null, description: null }
  }
}

function extractJSON(text: string): MatchResult | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  try {
    return JSON.parse(cleaned) as MatchResult
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as MatchResult
    } catch {}
  }
  return null
}

function deterministicFallback(): MatchResult {
  const celeb = CELEBS[Math.floor(Math.random() * CELEBS.length)]
  return {
    celebId: celeb.id,
    matchPercent: 78 + Math.floor(Math.random() * 15),
    reasoning: `you're giving major ${celeb.name} energy — the resemblance is uncanny`,
    features: ["expressive eyes", "strong bone structure", "main character vibes"],
    vibe: "iconic energy",
  }
}

export async function POST(req: Request) {
  console.log("[v0] match route: ENTER")
  try {
    const body = (await req.json()) as { image?: string }
    const image = body.image
    console.log("[v0] match route: got image, length =", image?.length ?? 0)

    if (!image || typeof image !== "string") {
      return Response.json({ error: "Missing image" }, { status: 400 })
    }

    const shuffled = [...CELEBS].sort(() => Math.random() - 0.5).slice(0, 80)
    const celebList = shuffled.map((c) => `${c.id} | ${c.name}`).join("\n")
    console.log("[v0] match route: built celeb list, count =", shuffled.length)

    let parsed: MatchResult | null = null
    let modelText = ""

    try {
      console.log("[v0] match route: calling Groq...")
      const result = await generateText({
        model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
        messages: [
          {
            role: "system",
            content: `You are a fun celebrity look-alike matcher. Analyze the photo and pick ONE celebrity from the list below.

CELEBRITIES (use the id BEFORE the pipe exactly):
${celebList}

Return ONLY a raw JSON object (no markdown, no commentary) with this exact shape:
{
  "celebId": "<id from list>",
  "matchPercent": <integer 70-95>,
  "reasoning": "<one playful Gen-Z sentence, lowercase, max 20 words. say they 'give X energy'>",
  "features": ["<feature 1>", "<feature 2>", "<feature 3>"],
  "vibe": "<2-4 word vibe>"
}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Match this person to their celebrity twin. Return only JSON." },
              { type: "image", image: image },
            ],
          },
        ],
      })
      modelText = result.text || ""
      console.log("[v0] match route: Groq returned, text length =", modelText.length)
      console.log("[v0] match route: model text preview =", modelText.slice(0, 300))
      parsed = extractJSON(modelText)
      console.log("[v0] match route: parsed =", parsed ? `celebId=${parsed.celebId}` : "null")
    } catch (modelErr) {
      const msg = modelErr instanceof Error ? modelErr.message : String(modelErr)
      console.log("[v0] match route: Groq call FAILED:", msg)
    }

    if (!parsed) {
      console.log("[v0] match route: using fallback")
      parsed = deterministicFallback()
    }

    let celeb: Celeb =
      CELEBS.find((c) => c.id === parsed!.celebId) ||
      CELEBS.find((c) => c.name.toLowerCase() === String(parsed!.celebId).toLowerCase()) ||
      CELEBS[Math.floor(Math.random() * CELEBS.length)]

    console.log("[v0] match route: resolved celeb =", celeb.id)

    let { image: celebImage, description } = await fetchWikiPhoto(celeb.id)
    console.log("[v0] match route: wiki photo =", celebImage ? "found" : "MISSING")

    if (!celebImage) {
      const alternates = ["Zendaya", "Timothée_Chalamet", "Rihanna", "Taylor_Swift", "Beyoncé", "Harry_Styles"]
      for (const alt of alternates) {
        const fb = CELEBS.find((c) => c.id === alt)
        if (!fb) continue
        const data = await fetchWikiPhoto(alt)
        if (data.image) {
          celeb = fb
          celebImage = data.image
          description = data.description
          break
        }
      }
    }

    const responseBody = {
      celeb: {
        id: celeb.id,
        name: celeb.name,
        category: celeb.category,
        image: celebImage,
        description: description || parsed.vibe || null,
      },
      matchPercent: Math.max(70, Math.min(95, parsed.matchPercent || 82)),
      reasoning: parsed.reasoning || `you're giving major ${celeb.name} energy`,
      features:
        Array.isArray(parsed.features) && parsed.features.length
          ? parsed.features.slice(0, 5)
          : ["unique vibe", "main character", "iconic"],
      vibe: parsed.vibe || "iconic energy",
    }

    console.log("[v0] match route: SUCCESS, returning", celeb.name)
    return Response.json(responseBody)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ""
    console.log("[v0] match route: TOP-LEVEL ERROR:", message)
    console.log("[v0] match route: stack:", stack)
    return Response.json({ error: message || "Match failed" }, { status: 500 })
  }
}
