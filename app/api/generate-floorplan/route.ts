import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { imageBase64, state } = await req.json()

  // 1. Upload bubble diagram PNG to Supabase storage
  const filename = `floor-plan-bubbles/${Date.now()}.png`
  const buffer = Buffer.from(imageBase64.replace(/^data:image\/png;base64,/, ''), 'base64')

  const { error: uploadError } = await supabase.storage
    .from('temp')
    .upload(filename, buffer, { contentType: 'image/png', upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('temp').getPublicUrl(filename)

  // 2. Call concept-card webhook with zone map prompt
  const beds  = state.bedrooms || 3
  const baths = state.bathrooms || 2
  const sqft  = state.sqft || 2500
  const style = state.style || 'Hill Country'

  const prompt = `This is a room bubble diagram for a ${sqft} SF ${style} style home with ${beds} bedrooms and ${baths} bathrooms. Convert this bubble arrangement into a clean architectural zone map. Keep the same relative positions of each zone. Draw zones as labeled rectangular areas with clean walls. Add hallway corridors connecting the bedroom zones to the living areas. Label each zone clearly. Use an architectural diagram style — dark background, white or light gray walls, zone labels in clean sans-serif font. Do not add furniture or detail. Just zones, walls, hallways, and labels.`

  const webhookRes = await fetch('https://n8n.empowerbuilding.ai/webhook/concept-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: publicUrl,
      prompt,
      approvedFloorPlanUrl: publicUrl,
      projectName: `Design-${Date.now()}`,
    }),
  })

  if (!webhookRes.ok) {
    const txt = await webhookRes.text()
    return NextResponse.json({ error: `Webhook failed: ${txt.slice(0,200)}` }, { status: 500 })
  }

  const result = await webhookRes.json()
  const imageUrl = result.conceptCard || result.enhancedFloorPlanUrl

  return NextResponse.json({ imageUrl })
}
