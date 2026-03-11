import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  if (!lat || !lng) return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })

  // 1. Try ReportAll (real county parcel data)
  const reportAllKey = process.env.REPORTALL_CLIENT_KEY
  if (reportAllKey) {
    try {
      const url = `https://reportallusa.com/api/parcels?client=${reportAllKey}&v=9&spatial_intersect=POINT(${lng} ${lat})&si_srid=4326`
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) })
      if (r.ok) {
        const data = await r.json()
        if (data.status === 'OK' && data.results?.length > 0) {
          const parcel = data.results[0]
          let geometry = null

          if (parcel.geom_as_wkt) {
            // Parse WKT polygon manually (basic POLYGON support)
            const wkt: string = parcel.geom_as_wkt
            const match = wkt.match(/POLYGON\s*\(\((.+)\)\)/i)
            if (match) {
              const coords = match[1].split(',').map((pair: string) => {
                const [x, y] = pair.trim().split(/\s+/)
                return [parseFloat(x), parseFloat(y)]
              })
              geometry = {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coords] },
                properties: {
                  apn: parcel.alt_id_1 || parcel.parcel_id,
                  owner: parcel.owner,
                  address: parcel.legal_desc1,
                  acreage: parcel.acreage_calc,
                  county: parcel.county_name,
                  state: parcel.state_abbr,
                },
              }
            }
          }

          if (geometry) {
            return NextResponse.json({
              success: true,
              source: 'ReportAll',
              boundary: geometry,
              lotSize: parcel.acreage_calc ? parseFloat(parcel.acreage_calc) : null,
              parcelId: parcel.alt_id_1 || parcel.parcel_id || null,
              owner: parcel.owner || null,
            })
          }
        }
      }
    } catch (e) {
      console.error('ReportAll error:', e)
    }
  }

  // 2. Try OpenStreetMap (free fallback)
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

  // 3. Estimated ~0.5 acre box
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
