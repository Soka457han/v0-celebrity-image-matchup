import { generateText, Output } from "ai"
import * as z from "zod"
import { CELEBS } from "@/lib/celebs"

export const maxDuration = 30

const matchSchema = z.object({
  celebId: z.string().describe("The id of the best matching celebrity from the provided list"),
  matchPercent: z.number().min(60).max(99).describe("How close the match is, between 60 and 99"),
  reasoning: z
    .string()
    .describe("A short, fun, Gen-Z style sentence explaining what features make them a match. Max 22 words."),
  features: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("3-5 short feature tags about the uploaded photo (e.g. 'sharp jawline', 'warm undertones')"),
})

export async function POST(req: Request) {
  try {
    const { image } = (await req.json()) as { image: string }

    if (!image || typeof image !== "string") {
      return Response.json({ error: "Missing image" }, { status: 400 })
    }

    const celebList = CELEBS.map((c) => `- id: ${c.id} | ${c.name} — ${c.vibe} (${c.tags.join(", ")})`).join("\n")

    const { output } = await generateText({
      model: "openai/gpt-5-mini",
      output: Output.object({ schema: matchSchema }),
      messages: [
        {
          role: "system",
          content: `You are a fun, trendy celebrity look-alike matcher for a Gen-Z entertainment app.
You will be given a user's photo and must pick the SINGLE best celebrity match from this list:

${celebList}

Rules:
- ONLY return one of the exact ids shown above for celebId.
- Match based on overall vibe, facial features, hair, and energy — not race or specific identity claims.
- Keep reasoning playful, hype, and concise. Use lowercase, internet-y tone is fine.
- Never say the user IS the celebrity. Say they "give ___ energy" or "match ___ vibes".
- If the image doesn't clearly show a person, still pick a fun match based on whatever is visible.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Match this person to their celebrity twin from the list." },
            { type: "image", image: image },
          ],
        },
      ],
    })

    const celeb = CELEBS.find((c) => c.id === output.celebId) ?? CELEBS[0]

    return Response.json({
      celeb,
      matchPercent: output.matchPercent,
      reasoning: output.reasoning,
      features: output.features,
    })
  } catch (err) {
    console.log("[v0] match error:", err)
    return Response.json({ error: "Match failed. Try another photo." }, { status: 500 })
  }
}
