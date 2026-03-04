import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, firstName, lastName, email, phone, ...rest } = body

  const record = {
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    status: 'submitted',
    updated_at: new Date().toISOString(),
  }

  if (sessionId) {
    await supabase.from('design_sessions').update(record).eq('id', sessionId)
  } else {
    await supabase.from('design_sessions').insert({ ...record, ...rest, status: 'submitted' })
  }

  // Fire n8n webhook (non-blocking)
  fetch('https://n8n.empowerbuilding.ai/webhook/barnhaus-design-submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, firstName, lastName, email, phone, ...rest }),
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
