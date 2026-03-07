import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, firstName, lastName, email, phone, ...formData } = body

  const record: Record<string, unknown> = {
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone: phone || null,

    // Step 1 - Style
    aesthetic_style: formData.style || null,

    // Step 2 - Size
    living: formData.sqft ? String(formData.sqft) : null,
    bedrooms: formData.bedrooms ? String(formData.bedrooms) : null,
    bathrooms: formData.bathrooms ? String(formData.bathrooms) : null,
    full_baths: formData.fullBaths || null,
    half_baths: formData.halfBaths || null,
    bath_config: formData.bathConfig || null,
    stories: formData.stories || null,

    // Step 3 - Shape
    house_shape: formData.shape || null,

    // Step 5 - Garage
    garage_cars: formData.garageCount ? parseInt(formData.garageCount as string) : null,
    garage_type: formData.garageAttachment || null,

    // Step 6 - Features + expanded lifestyle data
    desired_rooms: {
      ...(formData.features || {}),
      bath_config: formData.bathConfig || null,
      master_suite: formData.masterSuite || null,
      lifestyle: formData.lifestyle || null,
    },

    // Revit agent fields
    kitchen_layout: formData.kitchenLayout || null,
    main_roof_style: formData.mainRoofStyle || null,
    garage_roof_style: formData.garageRoofStyle || null,
    hallway_type: formData.hallwayType || null,
    roof_pitch: formData.roofPitch || null,

    // Step 7 - Architecture
    wall_height: formData.architecture?.wall_height || 'standard',
    zone_heights: formData.architecture?.zone_heights || null,
    window_style: formData.architecture?.window_style || 'fixed',
    exterior_material: formData.architecture?.exterior_material || null,

    // Zone map + bubble diagram
    zone_map_url: formData.selectedZoneMap || null,
    bubble_positions: formData.bubblePositions || {},
    bubble_data: formData.bubbles || [],

    status: 'new',
    submitted_at: new Date().toISOString(),
  }

  try {
    let submissionId = sessionId

    if (sessionId) {
      const { error } = await supabase
        .from('design_intake_submissions')
        .update(record)
        .eq('id', sessionId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('design_intake_submissions')
        .insert([record])
        .select('id')
        .single()
      if (error) throw error
      submissionId = data.id
    }

    // Fire n8n webhook (non-blocking)
    fetch('https://n8n.empowerbuilding.ai/webhook/barnhaus-design-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: submissionId, ...record, ...body }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: submissionId })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
