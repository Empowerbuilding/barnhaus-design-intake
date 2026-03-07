import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, firstName, lastName, email, phone, ...formData } = body

  // Convert frontend field names (camelCase) to database field names (snake_case)
  const record = {
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone: phone || null,
    
    // Step 1 - Style
    aesthetic_style: formData.style || null,
    
    // Step 2 - Size
    living: formData.sqft ? parseInt(formData.sqft as string) : null,
    patios: formData.patios ? parseInt(formData.patios as string) : null,
    bedrooms: formData.bedrooms ? parseInt(formData.bedrooms as string) : null,
    bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms as string) : null,
    full_baths: formData.fullBaths ? parseInt(formData.fullBaths as string) : null,
    half_baths: formData.halfBaths ? parseInt(formData.halfBaths as string) : null,
    stories: formData.stories || null,
    
    // Step 3 - Shape
    house_shape: formData.shape || null,
    
    // Step 4 - Priorities
    priorities: formData.priorities || [],
    
    // Step 5 - Garage
    garage_cars: formData.garageCount ? parseInt(formData.garageCount as string) : null,
    garage_type: formData.garageAttachment || null,
    
    // Step 6 - Features
    desired_rooms: formData.features || {},
    
    // Additional fields from state if present
    kitchen_layout: formData.kitchenLayout || null,
    main_roof_style: formData.mainRoofStyle || null,
    garage_roof_style: formData.garageRoofStyle || null,
    hallway_type: formData.hallwayType || null,
    roof_pitch: formData.roofPitch || null,
    master_ceiling_height: formData.masterCeilingHeight ? parseInt(formData.masterCeilingHeight as string) : null,
    secondary_ceiling_height: formData.secondaryCeilingHeight ? parseInt(formData.secondaryCeilingHeight as string) : null,
    great_room_vaulted: formData.greatRoomVaulted === 'yes' || false,
    
    status: 'new',
    submitted_at: new Date().toISOString(),
  }

  try {
    if (sessionId) {
      await supabase.from('design_intake_submissions').update(record).eq('id', sessionId)
    } else {
      await supabase.from('design_intake_submissions').insert([record]).select()
    }

    // Fire n8n webhook (non-blocking)
    fetch('https://n8n.empowerbuilding.ai/webhook/barnhaus-design-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...record, ...body }),
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: sessionId || body.id })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to submit design' }, { status: 500 })
  }
}
