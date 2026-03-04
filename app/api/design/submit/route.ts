import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, firstName, lastName, email, phone } = body

  const record = {
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone: phone || null,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  }

  if (sessionId) {
    await supabase.from('design_intake_submissions').update(record).eq('id', sessionId)
  } else {
    await supabase.from('design_intake_submissions').insert(record)
  }

  // Fire n8n webhook (non-blocking)
  fetch('https://n8n.empowerbuilding.ai/webhook/barnhaus-design-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...record, ...body }),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
