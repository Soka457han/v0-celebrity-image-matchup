import { generateText, Output } from "ai"
import { createGroq } from "@ai-sdk/groq"
import * as z from "zod"
import { CELEBS, type Celeb } from "@/lib/celebs"

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export const maxDuration = 30

const matchSchema = z.object({
  celebId: z.string().describe("The exact id of the best matching celebrity from the provided list"),
  matchPercent: z.number().min(60).max(99).describe("How close the match is, between 60 and 99"),
  reasoning: z
    .string()
    .describe("A short, fun, Gen-Z style sentence explaining the match. Max 22 words. Do NOT mention race."),
  features: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3-5 short feature tags about the uploaded photo (e.g. 'sharp jawline', 'warm undertones')"),
  vibe: z
    .string()
    .describe("A 2-4 word vibe description of the celebrity twin (e.g. 'effortless it-girl', 'brooding heartthrob')"),
})

// Fetch real photo + Wikipedia summary for a celeb slug.
async function fetchWikiPhoto(slug: string): Promise<{ image: string | null; description: string | null }> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": "StarMatch/1.0 (celebrity-twin-app)" },
      next: { revalidate: 86400 }, // cache 1 day
    })
    if (!res.ok) return { image: null, description: null }
    const data = (await res.json()) as {
      thumbnail?: { source?: string }
      originalimage?: { source?: string }
      description?: string
    }
    const image = data.originalimage?.source || data.thumbnail?.source || null
    return { image, description: data.description || null }
  } catch {
    return { image: null, description: null }
  }
}

export async function POST(req: Request) {
  try {
    const { image } = (await req.json()) as { image: string }

    if (!image || typeof image !== "string") {
      return Response.json({ error: "Missing image" }, { status: 400 })
    }

    // Build a compact list for the model. We pick the FIRST 250 names so the
    // prompt stays manageable but coverage is broad.
    const celebList = CELEBS.slice(0, 250)
      .map((c) => `${c.id} | ${c.name} (${c.category})`)
      .join("\n")

    const { output } = await generateText({
      model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      output: Output.object({ schema: matchSchema }),
      messages: [
        {
          role: "system",
          content: `You are a fun, trendy celebrity look-alike matcher for a Gen-Z entertainment app.
Pick the SINGLE best celebrity match from this list. The "celebId" you return MUST be one of the exact ids before the pipe.

LIST:
${celebList}

Rules:
- Match based on overall vibe, hair, facial structure, and aesthetic. NEVER make claims about race or ethnicity.
- Reasoning should be hype, playful, lowercase Gen-Z internet tone. Never say the user IS the celebrity, say they "give ___ energy" or "match ___ vibes".
- If no clear face is visible, pick a fun match based on whatever is visible.
- celebId MUST match an id from the list EXACTLY (including underscores, parentheses, accents).`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Match this person to their celebrity twin." },
            { type: "image", image: image },
          ],
        },
      ],
    })

    let celeb: Celeb = CELEBS.find((c) => c.id === output.celebId) ?? CELEBS[0]

    // Fetch real photo from Wikipedia
    let { image: celebImage, description } = await fetchWikiPhoto(celeb.id)

    // If wiki photo missing, try a fallback celeb that's likely to have one.
    if (!celebImage) {
      console.log("[v0] no photo for", celeb.id, "— falling back")
      const fallback = CELEBS.find((c) => c.id === "Zendaya") ?? CELEBS[0]
      celeb = fallback
      const fb = await fetchWikiPhoto(fallback.id)
      celebImage = fb.image
      description = fb.description
    }

    return Response.json({
      celeb: {
        id: celeb.id,
        name: celeb.name,
        category: celeb.category,
        image: celebImage,
        description: description || output.vibe,
      },
      matchPercent: output.matchPercent,
      reasoning: output.reasoning,
      features: output.features,
      vibe: output.vibe,
    })
  } catch (err) {
    console.log("[v0] match error:", err)
    return Response.json({ error: "Match failed. Try another photo." }, { status: 500 })
  }
}
