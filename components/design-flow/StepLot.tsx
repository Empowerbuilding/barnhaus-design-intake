'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { DesignState, LotData } from '@/lib/design-types'

// Mapbox loaded dynamically to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapboxgl: any = null

interface Props {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
  onNext: () => void
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

function rotationToCardinal(deg: number): string {
  // 0° = house top faces North (front door south), 90° = front faces West, etc.
  // We want to compute which direction the FRONT of the house faces
  const frontFacing = (deg + 180) % 360
  const idx = Math.round(frontFacing / 45) % 8
  return COMPASS[idx]
}

function rotationToGarageFacing(deg: number, garagePos: 'left' | 'right' | 'rear'): string {
  const offsets = { left: 270, right: 90, rear: 180 }
  const facing = (deg + offsets[garagePos]) % 360
  const idx = Math.round(facing / 45) % 8
  return COMPASS[idx]
}

const LOT_FLAGS = [
  { id: 'sloped', label: '⛰ Sloped' },
  { id: 'corner', label: '🔀 Corner lot' },
  { id: 'wooded', label: '🌳 Wooded' },
  { id: 'creek', label: '💧 Creek/pond' },
  { id: 'hoa', label: '🏘 HOA' },
  { id: 'rural', label: '🤠 Rural / no restrictions' },
]

const DRIVEWAY_OPTIONS = [
  { id: 'left_turn', label: '← Turn left off street' },
  { id: 'straight_in', label: '↑ Straight in' },
  { id: 'right_turn', label: '→ Turn right off street' },
]

export default function StepLot({ state, update, onNext }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('mapbox-gl').Map | null>(null)
  const houseMarkerRef = useRef<import('mapbox-gl').Marker | null>(null)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ place_name: string; center: [number, number] }[]>([])

  const [rotation, setRotation] = useState(state.lot?.house_rotation_deg ?? 180)
  const [driveway, setDriveway] = useState(state.lot?.driveway_approach ?? '')
  const [flags, setFlags] = useState<string[]>(state.lot?.lot_flags ?? [])
  const [notes, setNotes] = useState(state.lot?.lot_notes ?? '')
  const [lotData, setLotData] = useState<Partial<LotData>>(state.lot ?? {})
  const [showMap, setShowMap] = useState(!!state.lot?.lot_address)
  const [substep, setSubstep] = useState<'address' | 'orient' | 'driveway' | 'flags'>(
    state.lot?.lot_address ? 'orient' : 'address'
  )

  // Load mapbox dynamically
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
import('mapbox-gl').then(m => { mapboxgl = (m.default ?? m) as any })
  }, [])

  // Init map
  useEffect(() => {
    if (!showMap || !mapContainer.current || mapRef.current || !mapboxgl) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    mapboxgl.accessToken = token

    const center: [number, number] = lotData.lot_lng && lotData.lot_lat
      ? [lotData.lot_lng, lotData.lot_lat]
      : [-98.5, 29.5]

    const map = new mapboxgl!.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center,
      zoom: lotData.lot_lat ? 17 : 9,
      bearing: 0,
    })

    map.on('load', () => {
      if (lotData.lot_lat && lotData.lot_lng) {
        loadBoundary(lotData.lot_lat, lotData.lot_lng, map)
        placeHouseMarker([lotData.lot_lng!, lotData.lot_lat!], map)
      }
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [showMap])

  const loadBoundary = async (lat: number, lng: number, map: import('mapbox-gl').Map) => {
    try {
      const r = await fetch(`/api/lot/boundary?lat=${lat}&lng=${lng}`)
      const data = await r.json()
      if (data.boundary) {
        if (map.getSource('lot-boundary')) {
          (map.getSource('lot-boundary') as import('mapbox-gl').GeoJSONSource).setData(data.boundary)
        } else {
          map.addSource('lot-boundary', { type: 'geojson', data: data.boundary })
          map.addLayer({ id: 'lot-fill', type: 'fill', source: 'lot-boundary', paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.15 } })
          map.addLayer({ id: 'lot-line', type: 'line', source: 'lot-boundary', paint: { 'line-color': '#f59e0b', 'line-width': 2 } })
        }
        setLotData(prev => ({ ...prev, lot_boundary_geojson: data.boundary, lot_size_acres: data.lotSize, lot_parcel_id: data.parcelId }))
      }
    } catch {}
  }

  const placeHouseMarker = (lnglat: [number, number], map: import('mapbox-gl').Map) => {
    if (houseMarkerRef.current) houseMarkerRef.current.remove()
    const el = document.createElement('div')
    el.className = 'house-marker'
    el.innerHTML = `
      <div style="
        width:60px;height:40px;background:#1e293b;border:2px solid #f59e0b;
        border-radius:4px;transform:rotate(${rotation}deg);cursor:grab;
        display:flex;align-items:center;justify-content:center;
        font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.5);
        transform-origin:center center;
      ">🏠</div>`
    const marker = new mapboxgl!.Marker({ element: el, draggable: true })
      .setLngLat(lnglat)
      .addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLngLat()
      setLotData(prev => ({ ...prev, lot_lng: pos.lng, lot_lat: pos.lat }))
    })
    houseMarkerRef.current = marker
  }

  // Update house marker rotation
  useEffect(() => {
    if (!houseMarkerRef.current) return
    const el = houseMarkerRef.current.getElement().querySelector('div') as HTMLElement
    if (el) el.style.transform = `rotate(${rotation}deg)`
  }, [rotation])

  const handleAddressSelect = async (place: { place_name: string; center: [number, number] }) => {
    const [lng, lat] = place.center
    setQuery(place.place_name.split(',')[0])
    setSuggestions([])
    setLotData(prev => ({ ...prev, lot_address: place.place_name, lot_lat: lat, lot_lng: lng }))
    setShowMap(true)

    setTimeout(() => {
      if (!mapRef.current || !mapboxgl) return
      mapRef.current.flyTo({ center: [lng, lat], zoom: 17, essential: true })
      loadBoundary(lat, lng, mapRef.current)
      placeHouseMarker([lng, lat], mapRef.current)
      setSubstep('orient')
    }, 600)
  }

  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return }
    const r = await fetch(`/api/lot/geocode?address=${encodeURIComponent(q)}`)
    const data = await r.json()
    setSuggestions(data.features?.map((f: { place_name: string; center: [number, number] }) => ({ place_name: f.place_name, center: f.center })) ?? [])
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchAddress(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const streetFacing = rotationToCardinal(rotation)
  const garageFacing = rotationToGarageFacing(rotation, 'left') // default garage left

  const handleNext = () => {
    const finalLot: LotData = {
      ...lotData,
      house_rotation_deg: rotation,
      street_facing: streetFacing,
      garage_facing: garageFacing,
      driveway_approach: driveway,
      lot_flags: flags,
      lot_notes: notes,
    } as LotData
    update({ lot: finalLot })
    onNext()
  }

  const canProceed = !!lotData.lot_address && !!driveway

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your Lot</h2>
        <p className="text-stone-400 text-sm">We'll place your home on the actual property so the layout works with your land.</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {(['address', 'orient', 'driveway', 'flags'] as const).map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
            substep === s ? 'bg-amber-500' :
            (['address','orient','driveway','flags'].indexOf(substep) > i) ? 'bg-amber-700' : 'bg-stone-700'
          }`} />
        ))}
      </div>

      {/* Address search */}
      <div className="relative">
        <label className="block text-sm text-stone-400 mb-1">Property address</label>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="123 Ranch Road, Boerne TX"
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-stone-800 border border-stone-700 rounded-lg overflow-hidden shadow-xl">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleAddressSelect(s)}
                className="w-full text-left px-4 py-3 text-white hover:bg-stone-700 border-b border-stone-700 last:border-0 text-sm">
                {s.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="space-y-4">
          <div ref={mapContainer} className="w-full h-64 rounded-xl overflow-hidden border border-stone-700 relative" />

          {/* Orientation controls */}
          {substep !== 'address' && (
            <div className="bg-stone-800 rounded-xl p-4 space-y-3 border border-stone-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm">House orientation</p>
                  <p className="text-stone-400 text-xs mt-0.5">
                    Front door faces <span className="text-amber-400 font-bold">{streetFacing}</span>
                    {' · '}Garage faces <span className="text-amber-400 font-bold">{garageFacing}</span>
                  </p>
                </div>
                <div className="text-3xl">🧭</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setRotation(r => (r - 45 + 360) % 360)}
                  className="bg-stone-700 hover:bg-stone-600 text-white rounded-lg px-3 py-2 text-sm font-bold">↺ 45°</button>
                <input type="range" min={0} max={359} value={rotation}
                  onChange={e => setRotation(Number(e.target.value))}
                  className="flex-1 accent-amber-500" />
                <button onClick={() => setRotation(r => (r + 45) % 360)}
                  className="bg-stone-700 hover:bg-stone-600 text-white rounded-lg px-3 py-2 text-sm font-bold">45° ↻</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Driveway */}
      {(showMap && substep !== 'address') && (
        <div>
          <label className="block text-sm text-stone-400 mb-2">How do you pull in from the street?</label>
          <div className="grid grid-cols-3 gap-3">
            {DRIVEWAY_OPTIONS.map(opt => (
              <button key={opt.id}
                onClick={() => { setDriveway(opt.id); setSubstep('flags') }}
                className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                  driveway === opt.id
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-500'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lot flags */}
      {substep === 'flags' && (
        <div>
          <label className="block text-sm text-stone-400 mb-2">Lot characteristics <span className="text-stone-600">(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {LOT_FLAGS.map(f => (
              <button key={f.id}
                onClick={() => setFlags(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])}
                className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                  flags.includes(f.id)
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-600'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Anything else about your lot? (views, easements, septic location...)"
            rows={2}
            className="mt-3 w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 resize-none" />
        </div>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!canProceed}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all ${
          canProceed
            ? 'bg-amber-500 hover:bg-amber-400 text-black'
            : 'bg-stone-800 text-stone-600 cursor-not-allowed'
        }`}>
        {canProceed ? 'Continue →' : 'Enter your address to continue'}
      </button>
    </div>
  )
}
