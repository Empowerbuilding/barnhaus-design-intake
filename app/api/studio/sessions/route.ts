import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkAuth(req: NextRequest) {
  const token = req.headers.get('x-studio-token')
  return token === (process.env.STUDIO_PASSWORD || 'barnhaus2025')
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase
    .from('design_intake_submissions')
    .select('id,name,email,phone,status,aesthetic_style,house_shape,living,bedrooms,bathrooms,created_at,submitted_at,additional_items,notes')
    .order('created_at', { ascending: false })
  return NextResponse.json(data || [])
}
