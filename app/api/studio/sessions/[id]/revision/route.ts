import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data: revisions } = await supabase
    .from('design_revisions')
    .select('revision_number')
    .eq('session_id', id)
    .order('revision_number', { ascending: false })
    .limit(1)
  const nextRev = ((revisions?.[0]?.revision_number) || 0) + 1
  await supabase.from('design_revisions').insert({
    session_id: id,
    revision_number: nextRev,
    change_description: body.description,
    requested_by: body.requestedBy || 'mitch',
  })
  return NextResponse.json({ ok: true, revision: nextRev })
}
