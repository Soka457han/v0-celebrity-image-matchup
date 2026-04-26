import { CELEBS, getCelebGender, type Celeb, type Gender } from "@/lib/celebs"

export const maxDuration = 30
export const dynamic = "force-dynamic"

type GroqMatch = {
  detectedGender?: "male" | "female"
  celebId?: string
  matchPercent?: number
  reasoning?: string
  features?: string[]
  vibe?: string
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "StarMatch/1.0 (celebrity-twin-app)" },
      cache: "no-store",
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const b64 = Buffer.from(buf).toString("base64")
    return `data:${contentType};base64,${b64}`
  } catch {
    return null
  }
}

async function fetchWikiPhoto(slug: string): Promise<{ image: string | null; description: string | null }> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": "StarMatch/1.0 (celebrity-twin-app)" },
      cache: "no-store",
    })
    if (!res.ok) return { image: null, description: null }
    const data = (await res.json()) as {
      thumbnail?: { source?: string }
      originalimage?: { source?: string }
      description?: string
    }
    // Prefer thumbnail (smaller, faster, plenty for share card). Fall back to original.
    const remoteUrl = data.thumbnail?.source || data.originalimage?.source || null
    if (!remoteUrl) return { image: null, description: data.description || null }
    // Inline as data URL so the client can use it inside html-to-image without CORS issues.
    const dataUrl = await urlToDataUrl(remoteUrl)
    return {
      image: dataUrl || remoteUrl, // fall back to remote URL if inlining fails
      description: data.description || null,
    }
  } catch {
    return { image: null, description: null }
  }
}

function extractJSON(text: string): GroqMatch | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  try {
    return JSON.parse(cleaned) as GroqMatch
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as GroqMatch
    } catch {}
  }
  return null
}

async function callGroqVision(imageDataUrl: string, celebList: string): Promise<GroqMatch | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const systemPrompt = `You are a fun celebrity look-alike matcher.

STEP 1: Look at the photo and determine the apparent gender presentation of the person ("male" or "female").
STEP 2: Pick ONE celebrity from the list whose face/vibe most resembles them. The celebrity's gender (shown in brackets) MUST match the gender you detected in step 1. NEVER cross-match — males match to males, females match to females.

CELEBRITIES (format is "id | name [gender]"):
${celebList}

Respond with ONLY a raw JSON object, no markdown, no commentary:
{"detectedGender":"male|female","celebId":"<id>","matchPercent":<70-95>,"reasoning":"<lowercase Gen-Z sentence about their vibe>","features":["feature1","feature2","feature3"],"vibe":"<2-4 word vibe>"}`

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Match this person to their celebrity match of the SAME gender. Return only JSON.",
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      console.log("[v0] groq non-ok:", res.status, errText.slice(0, 300))
      return null
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = data.choices?.[0]?.message?.content || ""
    console.log("[v0] groq raw text:", text.slice(0, 400))
    return extractJSON(text)
  } catch (e) {
    console.log("[v0] groq threw:", e instanceof Error ? e.message : String(e))
    return null
  }
}

function pickRandomCelebOfGender(gender: Gender): Celeb {
  const pool = CELEBS.filter((c) => getCelebGender(c) === gender)
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function POST(req: Request) {
  try {
    const { image } = (await req.json()) as { image?: string }

    if (!image || typeof image !== "string") {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    // Build a balanced shuffled subset: ~40 male + ~40 female so the AI has
    // strong candidates of both genders to choose from.
    const males = CELEBS.filter((c) => getCelebGender(c) === "M").sort(() => Math.random() - 0.5).slice(0, 40)
    const females = CELEBS.filter((c) => getCelebGender(c) === "F").sort(() => Math.random() - 0.5).slice(0, 40)
    const candidates = [...males, ...females].sort(() => Math.random() - 0.5)
    const celebList = candidates
      .map((c) => `${c.id} | ${c.name} [${getCelebGender(c) === "M" ? "male" : "female"}]`)
      .join("\n")

    let match = await callGroqVision(image, celebList)

    // Determine the detected gender (default M if missing)
    const detectedGender: Gender = match?.detectedGender === "female" ? "F" : "M"

    if (!match || !match.celebId) {
      console.log("[v0] using gender-aware fallback match")
      const c = pickRandomCelebOfGender(detectedGender)
      match = {
        detectedGender: detectedGender === "F" ? "female" : "male",
        celebId: c.id,
        matchPercent: 78 + Math.floor(Math.random() * 15),
        reasoning: `you're giving major ${c.name} energy — the resemblance is uncanny`,
        features: ["expressive eyes", "strong bone structure", "main character vibes"],
        vibe: "iconic energy",
      }
    }

    // Resolve the celeb
    let celeb: Celeb | undefined =
      CELEBS.find((c) => c.id === match!.celebId) ||
      CELEBS.find((c) => c.id.toLowerCase() === String(match!.celebId).toLowerCase()) ||
      CELEBS.find((c) => c.name.toLowerCase() === String(match!.celebId).toLowerCase())

    // Enforce same-gender: if AI picked a celeb of the opposite gender, override
    if (!celeb || getCelebGender(celeb) !== detectedGender) {
      console.log("[v0] gender mismatch or unknown celeb — picking same-gender fallback")
      celeb = pickRandomCelebOfGender(detectedGender)
    }

    // Fetch wiki photo — never block on failure
    let { image: celebImage, description } = await fetchWikiPhoto(celeb.id)

    // If no photo, try same-gender alternates so we always have something visual
    if (!celebImage) {
      const alternates: Celeb[] = CELEBS.filter((c) => getCelebGender(c) === detectedGender && c.id !== celeb!.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
      for (const alt of alternates) {
        const data = await fetchWikiPhoto(alt.id)
        if (data.image) {
          celeb = alt
          celebImage = data.image
          description = data.description
          break
        }
      }
    }

    return Response.json({
      celeb: {
        id: celeb.id,
        name: celeb.name,
        category: celeb.category,
        image: celebImage,
        description: description || null,
      },
      matchPercent: Math.max(70, Math.min(95, match.matchPercent || 82)),
      reasoning: match.reasoning || `you're giving major ${celeb.name} energy`,
      features:
        Array.isArray(match.features) && match.features.length > 0
          ? match.features.slice(0, 5)
          : ["unique vibe", "main character", "iconic"],
      vibe: match.vibe || "iconic energy",
    })
  } catch (err) {
    console.log("[v0] top-level error:", err instanceof Error ? err.message : String(err))
    // Last-resort fallback — random male match (no gender info available)
    const celeb = pickRandomCelebOfGender("M")
    const { image: celebImage, description } = await fetchWikiPhoto(celeb.id)
    return Response.json({
      celeb: {
        id: celeb.id,
        name: celeb.name,
        category: celeb.category,
        image: celebImage,
        description: description || null,
      },
      matchPercent: 80,
      reasoning: `you're giving major ${celeb.name} energy`,
      features: ["mysterious", "iconic", "main character"],
      vibe: "iconic energy",
    })
  }
}
