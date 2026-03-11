import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })

  // 1. Try OpenStreetMap (free, no key needed)
  try {
    const query = `[out:json];(way["landuse"](around:80,${lat},${lng});relation["landuse"](around:80,${lat},${lng}););out geom;`
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      signal: AbortSignal.timeout(5000),
    })
    const data = await r.json()
    if (data.elements?.length > 0) {
      const el = data.elements[0]
      const coords = el.geometry?.map((n: { lon: number; lat: number }) => [n.lon, n.lat])
      if (coords?.length > 2) {
        return NextResponse.json({
          success: true,
          source: 'OpenStreetMap',
          boundary: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] },
            properties: {},
          },
          lotSize: null,
          parcelId: null,
        })
      }
    }
  } catch {}

  // 2. Fallback: estimated ~0.5 acre box
  const latOff = 0.0014
  const lngOff = 0.002
  const latN = parseFloat(lat), lngN = parseFloat(lng)
  return NextResponse.json({
    success: true,
    source: 'Estimated',
    boundary: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lngN - lngOff, latN - latOff],
          [lngN + lngOff, latN - latOff],
          [lngN + lngOff, latN + latOff],
          [lngN - lngOff, latN + latOff],
          [lngN - lngOff, latN - latOff],
        ]],
      },
      properties: {},
    },
    lotSize: null,
    parcelId: null,
  })
}
