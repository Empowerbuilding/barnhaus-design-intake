import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { bubblePositions, state } = await req.json()

  const roomList = Object.entries(bubblePositions as Record<string, { x: number; y: number }>)
    .map(([id, pos]) => `- ${id}: center (${Math.round(pos.x)}, ${Math.round(pos.y)})`).join('\n')

  const prompt = `You are an expert residential architect. A client has arranged room bubbles showing their desired floor plan layout.

House specs:
- Size: ${state.sqft || 2500} SF, ${state.bedrooms || 3} bed, ${state.bathrooms || 2} bath
- Shape: ${state.shape || 'rectangle'}
- Style: ${state.style || 'Hill Country'}
- Stories: ${state.stories || 1}
- Garage: ${state.garageCount || 'none'}

Room bubble positions (SVG viewport 500x360):
${roomList}

Convert this into a clean, squared-up schematic floor plan SVG.

Rules:
- Output ONLY the SVG element — no markdown, no explanation, no code fences
- SVG viewBox="0 0 500 360", dark background rect fill="#111"
- Exterior walls: stroke="#CCC" stroke-width="2.5", room fills warm off-whites
- Interior walls: stroke="#888" stroke-width="1.2"
- Label each room (font-size 9px, bold, dark fill)
- Add small door arc symbols at entries
- Respect the relative positions from bubbles — rooms near each other in bubbles should be adjacent in the plan
- Add a hallway corridor connecting bedrooms
- Include north arrow (top-right) and "BARNHAUS STEEL BUILDERS" watermark (bottom center, font-size 6px, fill="#444")
- Make it look like a clean architectural schematic`

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const text: string = data?.content?.[0]?.text || ''
  // Extract SVG
  const match = text.match(/<svg[\s\S]*<\/svg>/)
  const svg = match ? match[0] : text

  return NextResponse.json({ svg })
}
