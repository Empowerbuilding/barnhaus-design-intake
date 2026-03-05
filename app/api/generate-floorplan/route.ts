import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { imageBase64, state, bubbles } = await req.json()

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

  const prompt = `Transform this room bubble diagram into a clean 2D architectural zone map for a ${sqft} SF ${style} home (${beds} bed / ${baths} bath). Keep the exact relative positions of each labeled bubble. Convert each bubble into a clean rectangular zone with straight walls. Connect adjacent zones edge-to-edge. Add narrow hallway corridors linking the bedroom zones to the main living area. Label each zone in bold. Style: top-down 2D floor plan, dark background, warm light-toned fills, white wall lines, no furniture no detail — only zones walls hallways and labels.`

  const webhookRes = await fetch('https://n8n.empowerbuilding.ai/webhook/zone-map-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: publicUrl, prompt, bubbles: bubbles || [] }),
  })

  if (!webhookRes.ok) {
    const txt = await webhookRes.text()
    return NextResponse.json({ error: `Webhook failed: ${txt.slice(0,200)}` }, { status: 500 })
  }

  const result = await webhookRes.json()
  const imageUrl = result.imageUrl

  return NextResponse.json({ imageUrl })
}
