import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { bubblePositions, state } = await req.json()

  const roomList = Object.entries(bubblePositions as Record<string, { x: number; y: number }>)
    .map(([id, pos]) => `- ${id}: (${Math.round(pos.x)}, ${Math.round(pos.y)})`)
    .join('\n')

  const prompt = `You are an expert residential architect creating a floor plan layout.

House specs:
- Total: ${state.sqft || 2500} SF, ${state.bedrooms || 3} bed, ${state.bathrooms || 2} bath
- Shape: ${state.shape || 'rectangle'}
- Style: ${state.style || 'Hill Country'}
- Stories: ${state.stories || 1}
- Garage: ${state.garageCount || 'none'}

The client arranged these room bubbles (SVG coords, 500x360 viewport). Use these relative positions to inform adjacency and layout:
${roomList}

Return a JSON object with this exact structure — NO markdown, NO explanation, ONLY the JSON:
{
  "footprint": { "x": number, "y": number, "width": number, "height": number },
  "rooms": [
    { "id": "string", "label": "string", "x": number, "y": number, "width": number, "height": number, "type": "living|kitchen|master|bedroom|bath|garage|service|porch|hallway" }
  ],
  "hallways": [
    { "x": number, "y": number, "width": number, "height": number }
  ]
}

Rules:
- All coordinates in SVG units within a 500x360 viewport
- Leave ~30px padding on all sides
- Rooms must NOT overlap each other
- Rooms must fit inside the footprint (except garage and porches)
- Add at least one hallway rectangle connecting bedrooms
- Master suite should be private/away from street
- Garage attaches to exterior
- Keep adjacency from the bubble positions (rooms that were close should stay close)
- Typical room sizes in this viewport: Great Room ~110x70, Kitchen ~80x60, Master Bed ~90x65, Secondary Bed ~75x55, Bath ~50x45, Garage ~90x65, Hallway ~20x80`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const text: string = data?.choices?.[0]?.message?.content || '{}'
  
  let layout
  try { layout = JSON.parse(text) } catch { return NextResponse.json({ error: 'Parse failed' }, { status: 500 }) }

  // Render the layout as clean SVG server-side
  const svg = renderFloorPlan(layout, state)
  return NextResponse.json({ svg })
}

const TYPE_FILL: Record<string, string> = {
  living: '#F5EDD6', kitchen: '#EDE8DC', master: '#EBE4D8',
  bedroom: '#E8E4DC', bath: '#E0E8EC', garage: '#E0E0DC',
  service: '#DDDBD8', porch: '#E8EDDF', hallway: '#ECECEC',
}
const TYPE_STROKE: Record<string, string> = {
  living: '#C4A35A', kitchen: '#B89B56', master: '#A08848',
  bedroom: '#9A9080', bath: '#7090A0', garage: '#888880',
  service: '#888888', porch: '#7A9060', hallway: '#AAAAAA',
}

function doorArc(x: number, y: number, w: number, side: 'top'|'bottom'|'left'|'right'): string {
  // Small quarter-circle door symbol
  const s = 12
  if (side === 'bottom') return `<path d="M${x+w/2-s/2},${y} a${s},${s} 0 0,1 ${s},0" stroke="#777" stroke-width="0.8" fill="none"/>`
  return `<path d="M${x},${y+s/2} a${s},${s} 0 0,1 0,-${s}" stroke="#777" stroke-width="0.8" fill="none"/>`
}

function renderFloorPlan(layout: { footprint?: {x:number;y:number;width:number;height:number}; rooms?: {id:string;label:string;x:number;y:number;width:number;height:number;type:string}[]; hallways?: {x:number;y:number;width:number;height:number}[] }, state: Record<string,unknown>): string {
  const rooms = layout.rooms || []
  const hallways = layout.hallways || []
  const fp = layout.footprint || { x: 30, y: 30, width: 440, height: 300 }

  const hallwaySVG = hallways.map(h =>
    `<rect x="${h.x}" y="${h.y}" width="${h.width}" height="${h.height}" fill="#E8E8E8" stroke="#AAA" stroke-width="1"/>`
  ).join('\n')

  const roomsSVG = rooms.map(r => {
    const fill = TYPE_FILL[r.type] || '#F0EEE8'
    const stroke = TYPE_STROKE[r.type] || '#999'
    const isExterior = r.type === 'garage' || r.type === 'porch'
    const sw = isExterior ? '1.2' : '1.5'
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    const lines = r.label.split(' ')
    const tspans = lines.map((ln, i) =>
      `<tspan x="${cx}" dy="${i === 0 ? -(lines.length - 1) * 5.5 : 11}">${ln}</tspan>`
    ).join('')
    const door = r.type !== 'hallway' ? doorArc(r.x, r.y + r.height, r.width, 'bottom') : ''
    return `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"
      fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
    ${door}
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
      font-size="9" font-weight="600" font-family="system-ui,sans-serif" fill="#2A2A2A">
      ${tspans}
    </text>`
  }).join('\n')

  // Exterior outline — bold
  const extStroke = `<rect x="${fp.x}" y="${fp.y}" width="${fp.width}" height="${fp.height}"
    fill="none" stroke="#CCC" stroke-width="2.5" rx="1"/>`

  // Dimension labels
  const sqft = (state.sqft as number) || 2500
  const beds  = (state.bedrooms as number) || 3
  const baths = (state.bathrooms as number) || 2
  const info = `${sqft.toLocaleString()} SF · ${beds} bed · ${baths} bath`

  // North arrow
  const northArrow = `<g transform="translate(472,22)">
    <circle r="10" fill="none" stroke="#555" stroke-width="0.8"/>
    <polygon points="0,-7 -2.5,2 0,0.5 2.5,2" fill="#C4A35A"/>
    <text y="18" text-anchor="middle" font-size="7" font-family="system-ui" fill="#666">N</text>
  </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 500 360">
  <rect width="500" height="360" fill="#111" rx="8"/>
  ${extStroke}
  ${hallwaySVG}
  ${roomsSVG}
  ${northArrow}
  <text x="250" y="352" text-anchor="middle" font-size="7" font-family="system-ui" fill="#555" letter-spacing="1">${info}</text>
  <text x="12" y="352" font-size="6" font-family="system-ui" fill="#333" letter-spacing="1">BARNHAUS STEEL BUILDERS</text>
</svg>`
}
