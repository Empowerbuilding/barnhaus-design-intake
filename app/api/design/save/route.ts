import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, step, sqft, bedrooms, bathrooms, shape,
    streetFacing, garageCount, garageAttachment, garageOrientation,
    mainRoofStyle, roofPitch, greatRoomVaulted, ceilingHeight,
    masterLocation, desiredRooms, porchSelection, frontPorchSF, backPorchSF,
    secondaryRoofStyle, wallHeight, soffitDepth, hasBalcony,
    firstName, lastName, email, phone } = body

  const garageCarMap: Record<string, string> = {
    'none': '0', '1-car': '1', '2-car': '2', '3-car': '3'
  }

  const record: Record<string, unknown> = {
    status: 'in_progress',
    name: firstName && lastName ? `${firstName} ${lastName}`.trim() : null,
    email: email || null,
    phone: phone || null,
    living: sqft ? String(sqft) : null,
    bedrooms: bedrooms || null,
    bathrooms: bathrooms || null,
    stories: body.stories || null,
    house_shape: shape || null,
    pad_direction: streetFacing || null,
    street_facing: streetFacing || null,
    garage_cars: garageCount ? garageCarMap[garageCount] || null : null,
    garage_type: garageAttachment || null,
    garage_orientation: garageOrientation || null,
    main_roof_style: mainRoofStyle || null,
    roof_pitch: roofPitch || null,
    great_room_vaulted: greatRoomVaulted ?? null,
    ceiling_height: ceilingHeight || null,
    master_location: masterLocation || null,
    desired_rooms: desiredRooms && desiredRooms.length > 0 ? desiredRooms.join(',') : null,
    porch_type: porchSelection || null,
    front_porch_sf: frontPorchSF || null,
    back_porch_sf: backPorchSF || null,
    secondary_roof_style: secondaryRoofStyle || null,
    wall_height: wallHeight || null,
    soffit_depth: soffitDepth ?? null,
    has_balcony: hasBalcony ?? null,
    garage_count: garageCount || null,
    garage_attachment: garageAttachment || null,
    additional_items: JSON.stringify({ step, desiredRooms: desiredRooms || [], porchSelection }),
    updated_at: new Date().toISOString(),
  }

  if (sessionId) {
    await supabase.from('design_intake_submissions').update(record).eq('id', sessionId)
    return NextResponse.json({ sessionId })
  } else {
    const { data, error } = await supabase
      .from('design_intake_submissions')
      .insert({ ...record, submitted_at: new Date().toISOString() })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sessionId: data.id })
  }
}
