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

    // Step 1 - Size
    living: formData.sqft ? String(formData.sqft) : null,
    bedrooms: formData.bedrooms ? String(formData.bedrooms) : null,
    bathrooms: formData.bathrooms ? String(formData.bathrooms) : null,
    stories: formData.stories || null,

    // Step 2 - Shape & Garage
    house_shape: formData.shape || null,
    garage_cars: formData.garageCount ? parseInt(formData.garageCount as string) || 0 : null,
    garage_type: formData.garageAttachment || null,
    garage_orientation: formData.garageOrientation || null,

    // Step 3 - Rooms & Porches
    desired_rooms: formData.desiredRooms || [],
    porch_type: formData.porchSelection || 'none',

    // Step 3 - Rooms & Porches (new fields)
    front_porch_sf: formData.frontPorchSF || null,
    back_porch_sf: formData.backPorchSF || null,

    // Step 4 - Roof
    sqft: formData.sqft || null,
    main_roof_style: formData.mainRoofStyle || null,
    secondary_roof_style: formData.secondaryRoofStyle || null,
    roof_pitch: formData.roofPitch || null,
    great_room_vaulted: formData.greatRoomVaulted ?? null,
    ceiling_height: formData.ceilingHeight || null,
    wall_height: formData.wallHeight || null,
    zone_heights: formData.zoneHeights || null,
    soffit_depth: formData.soffitDepth ?? null,
    has_balcony: formData.hasBalcony ?? null,

    // Garage (new explicit fields)
    garage_count: formData.garageCount || null,
    garage_attachment: formData.garageAttachment || null,

    // Step 5 - Lot & Orientation
    street_facing: formData.streetFacing || formData.lot?.street_facing || null,
    master_location: formData.masterLocation || null,
    lot_address: formData.lot?.lot_address || null,
    lot_lat: formData.lot?.lot_lat || null,
    lot_lng: formData.lot?.lot_lng || null,
    lot_size_acres: formData.lot?.lot_size_acres || null,
    lot_parcel_id: formData.lot?.lot_parcel_id || null,
    lot_boundary_geojson: formData.lot?.lot_boundary_geojson || null,
    house_rotation_deg: formData.lot?.house_rotation_deg ?? null,
    garage_facing: formData.lot?.garage_facing || null,
    driveway_approach: formData.lot?.driveway_approach || null,
    lot_flags: formData.lot?.lot_flags || null,
    lot_notes: formData.lot?.lot_notes || null,

    // Step 6 - Bubble diagram
    bubble_data: formData.bubbles || [],
    bubble_positions: formData.bubbles ? Object.fromEntries(
      (formData.bubbles as {id:string;x:number;y:number}[]).map(b => [b.id, { x: b.x, y: b.y }])
    ) : {},

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

    // Post to #lead-alerts in Vanessa Discord (non-blocking)
    const vanessaToken = process.env.VANESSA_DISCORD_TOKEN
    if (vanessaToken) {
      const name = `${firstName} ${lastName}`.trim() || 'Unknown'
      const sqft = (record.sqft || record.living || '?') + ' SF'
      const style = (record.aesthetic_style as string || '').replace(/-/g, ' ') || 'Not specified'
      const budget = (record.construction_budget as string) || '—'
      const location = (record.lot_address as string) || (record.lot_state as string) || '—'
      const beds = record.bedrooms || '?'
      const baths = record.full_baths || record.bathrooms || '?'
      const landStatus = record.lot_address ? 'Has land' : 'Looking for land'

      const msg = [
        '🏠 **New Design Concierge Lead — Follow Up Now**',
        '',
        `**Name:** ${name}`,
        `**Email:** ${email}`,
        `**Phone:** ${phone || '—'}`,
        `**Location:** ${location}`,
        `**Budget:** ${budget}`,
        `**Size:** ${sqft} | ${beds}bd / ${baths}ba`,
        `**Style:** ${style}`,
        `**Land:** ${landStatus}`,
      ].join('\n')

      fetch(`https://discord.com/api/v10/channels/1482243978156834920/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${vanessaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: msg }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, id: submissionId })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
