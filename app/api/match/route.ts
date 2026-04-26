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
      headers: { "User-Agent": "StarMatch/1.0 (celebrity-match-app)" },
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
      headers: { "User-Agent": "StarMatch/1.0 (celebrity-match-app)" },
      cache: "no-store",
    })
    if (!res.ok) return { image: null, description: null }
    const data = (await res.json()) as {
      thumbnail?: { source?: string }
      originalimage?: { source?: string }
      description?: string
    }
    const remoteUrl = data.thumbnail?.source || data.originalimage?.source || null
    if (!remoteUrl) return { image: null, description: data.description || null }
    const dataUrl = await urlToDataUrl(remoteUrl)
    return {
      image: dataUrl || remoteUrl,
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

async function callGroqVision(
  imageDataUrl: string,
  celebList: string,
  forceGender: Gender | null,
): Promise<GroqMatch | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  // System prompt branches: same-gender (default) vs forced opposite-gender.
  const systemPrompt = forceGender
    ? `You are a fun celebrity look-alike matcher.

The user wants to know which ${forceGender === "M" ? "MALE" : "FEMALE"} celebrity from the list below most resembles their face/vibe — features, bone structure, expression, energy. You MUST pick a celebrity from the list.

CELEBRITIES (all ${forceGender === "M" ? "MALE" : "FEMALE"}, format is "id | name"):
${celebList}

Respond with ONLY a raw JSON object, no markdown, no commentary:
{"celebId":"<id>","matchPercent":<70-95>,"reasoning":"<lowercase Gen-Z sentence about the resemblance>","features":["feature1","feature2","feature3"],"vibe":"<2-4 word vibe>"}`
    : `You are a fun celebrity look-alike matcher.

STEP 1: Look at the photo and determine the apparent gender presentation of the person ("male" or "female").
STEP 2: Pick ONE celebrity from the list whose face/vibe most resembles them. The celebrity's gender (shown in brackets) MUST match the gender you detected. NEVER cross-match — males match to males, females match to females.

CELEBRITIES (format is "id | name [gender]"):
${celebList}

Respond with ONLY a raw JSON object, no markdown, no commentary:
{"detectedGender":"male|female","celebId":"<id>","matchPercent":<70-95>,"reasoning":"<lowercase Gen-Z sentence about their vibe>","features":["feature1","feature2","feature3"],"vibe":"<2-4 word vibe>"}`

  const userText = forceGender
    ? `Pick the ${forceGender === "M" ? "male" : "female"} celebrity from the list this person most resembles. Return only JSON.`
    : "Match this person to their celebrity match of the SAME gender. Return only JSON."

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
              { type: "text", text: userText },
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

function pickRandomCelebOfGender(gender: Gender, excludeId?: string): Celeb {
  const pool = CELEBS.filter((c) => getCelebGender(c) === gender && c.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}

export async function POST(req: Request) {
  try {
    const { image, forceGender: forceGenderRaw, excludeId } = (await req.json()) as {
      image?: string
      forceGender?: "M" | "F"
      excludeId?: string
    }

    if (!image || typeof image !== "string") {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    const forceGender: Gender | null = forceGenderRaw === "M" || forceGenderRaw === "F" ? forceGenderRaw : null

    // Build candidate list. If forceGender is set, only include that gender.
    let candidates: Celeb[]
    if (forceGender) {
      candidates = CELEBS.filter((c) => getCelebGender(c) === forceGender && c.id !== excludeId)
        .sort(() => Math.random() - 0.5)
        .slice(0, 80)
    } else {
      const males = CELEBS.filter((c) => getCelebGender(c) === "M")
        .sort(() => Math.random() - 0.5)
        .slice(0, 40)
      const females = CELEBS.filter((c) => getCelebGender(c) === "F")
        .sort(() => Math.random() - 0.5)
        .slice(0, 40)
      candidates = [...males, ...females].sort(() => Math.random() - 0.5)
    }

    const celebList = forceGender
      ? candidates.map((c) => `${c.id} | ${c.name}`).join("\n")
      : candidates
          .map((c) => `${c.id} | ${c.name} [${getCelebGender(c) === "M" ? "male" : "female"}]`)
          .join("\n")

    let match = await callGroqVision(image, celebList, forceGender)

    // Determine the gender to enforce. If forceGender is set, that wins.
    // Otherwise we trust the AI's detectedGender (default M).
    const targetGender: Gender = forceGender || (match?.detectedGender === "female" ? "F" : "M")

    if (!match || !match.celebId) {
      console.log("[v0] using gender-aware fallback match")
      const c = pickRandomCelebOfGender(targetGender, excludeId)
      match = {
        detectedGender: targetGender === "F" ? "female" : "male",
        celebId: c.id,
        matchPercent: 78 + Math.floor(Math.random() * 15),
        reasoning: `you're giving major ${c.name} energy — the resemblance is uncanny`,
        features: ["expressive eyes", "strong bone structure", "main character vibes"],
        vibe: "iconic energy",
      }
    }

    let celeb: Celeb | undefined =
      CELEBS.find((c) => c.id === match!.celebId) ||
      CELEBS.find((c) => c.id.toLowerCase() === String(match!.celebId).toLowerCase()) ||
      CELEBS.find((c) => c.name.toLowerCase() === String(match!.celebId).toLowerCase())

    // Enforce target gender + exclusion
    if (!celeb || getCelebGender(celeb) !== targetGender || (excludeId && celeb.id === excludeId)) {
      console.log("[v0] gender mismatch / excluded — picking fallback")
      celeb = pickRandomCelebOfGender(targetGender, excludeId)
    }

    let { image: celebImage, description } = await fetchWikiPhoto(celeb.id)

    if (!celebImage) {
      const alternates: Celeb[] = CELEBS.filter(
        (c) => getCelebGender(c) === targetGender && c.id !== celeb!.id && c.id !== excludeId,
      )
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
      gender: targetGender,
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
      gender: "M" as Gender,
      matchPercent: 80,
      reasoning: `you're giving major ${celeb.name} energy`,
      features: ["mysterious", "iconic", "main character"],
      vibe: "iconic energy",
    })
  }
}
