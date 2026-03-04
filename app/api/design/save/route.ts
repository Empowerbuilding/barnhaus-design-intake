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

  const record = {
    step: step || 1,
    style: style || null,
    sqft: sqft || null,
    bedrooms: bedrooms || null,
    bathrooms: bathrooms || null,
    shape: shape || null,
    street_facing: streetFacing || null,
    view_facing: viewFacing || null,
    priorities: priorities || null,
    garage: garageCount || null,
    garage_attachment: garageAttachment || null,
    features: features || null,
    updated_at: new Date().toISOString(),
  }

  if (sessionId) {
    await supabase.from('design_sessions').update(record).eq('id', sessionId)
    return NextResponse.json({ sessionId })
  } else {
    const { data, error } = await supabase
      .from('design_sessions')
      .insert({ ...record, status: 'in_progress' })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sessionId: data.id })
  }
}
