import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, step, style, sqft, bedrooms, bathrooms, shape,
    streetFacing, viewFacing, priorities, garageCount, garageAttachment, features } = body

  // Map new flow fields → existing design_intake_submissions columns
  const garageCarMap: Record<string, string> = {
    'none': '0', '1-car': '1', '2-car': '2', '3-car': '3'
  }

  const record: Record<string, unknown> = {
    status: 'in_progress',
    aesthetic_style: style || null,
    living: sqft ? String(sqft) : null,
    bedrooms: bedrooms || null,
    bathrooms: bathrooms || null,
    house_shape: shape || null,
    pad_direction: streetFacing || null,
    garage_cars: garageCount ? garageCarMap[garageCount] || null : null,
    garage_type: garageAttachment || null,
    garage_orientation: body.garageOrientation || null,
    // Store priorities + features as JSON in additional_items
    additional_items: JSON.stringify({ step, priorities: priorities || [], features: features || {}, viewFacing }),
    updated_at: new Date().toISOString(),
  }

  // Map features to existing columns
  if (features) {
    if (features.covered_back_porch || features.covered_front_porch) {
      const porches = []
      if (features.covered_back_porch) porches.push('back')
      if (features.covered_front_porch) porches.push('front')
      record.porch_locations = porches.join(',')
    }
    if (features.vaulted_great_room) record.great_room_vaulted = true
    if (features.home_office) {
      record.desired_rooms = (record.desired_rooms as string || '') + ' home_office'
    }
    if (features.media_room) {
      record.desired_rooms = (record.desired_rooms as string || '') + ' media_room'
    }
    if (features.inlaw_suite) {
      record.desired_rooms = (record.desired_rooms as string || '') + ' inlaw_suite'
    }
    if (features.butler_pantry) {
      record.kitchen_features = 'butler_pantry'
    }
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
