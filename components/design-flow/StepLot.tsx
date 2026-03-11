'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { DesignState, LotData } from '@/lib/design-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapboxgl: any = null

interface Props {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
  onNext: () => void
}

const COMPASS_DIRS = ['N','NE','E','SE','S','SW','W','NW'] as const

function rotationToCardinal(deg: number): string {
  // rotation=0 → front faces South, rotation=180 → front faces North
  const front = (deg + 180) % 360
  return COMPASS_DIRS[Math.round(front / 45) % 8]
}

function rotationToSide(deg: number, offset: number): string {
  return COMPASS_DIRS[Math.round(((deg + offset) % 360) / 45) % 8]
}

const LOT_FLAGS = [
  { id: 'sloped', label: '⛰ Sloped' },
  { id: 'corner', label: '🔀 Corner lot' },
  { id: 'wooded', label: '🌳 Wooded' },
  { id: 'creek', label: '💧 Creek/pond' },
  { id: 'hoa', label: '🏘 HOA' },
  { id: 'rural', label: '🤠 Rural' },
]

const DRIVEWAY_OPTIONS = [
  { id: 'left_turn', label: '← Left turn in' },
  { id: 'straight_in', label: '↑ Straight in' },
  { id: 'right_turn', label: '→ Right turn in' },
]

// Creates an SVG house footprint element at given pixel size
function makeHouseEl(widthPx: number, heightPx: number, rotation: number): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = `width:${widthPx}px;height:${heightPx}px;cursor:grab;position:relative;`
  wrap.innerHTML = `
    <svg width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}"
      style="transform:rotate(${rotation}deg);transform-origin:center;display:block;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6))">
      <!-- House body -->
      <rect x="2" y="${heightPx * 0.25}" width="${widthPx - 4}" height="${heightPx * 0.72}" rx="3"
        fill="#1e293b" stroke="#f59e0b" stroke-width="2.5" opacity="0.92"/>
      <!-- Roof triangle -->
      <polygon points="${widthPx/2},2 ${widthPx-4},${heightPx*0.28} 4,${heightPx*0.28}"
        fill="#f59e0b" opacity="0.9"/>
      <!-- Front door indicator -->
      <rect x="${widthPx/2 - 5}" y="${heightPx * 0.72}" width="10" height="${heightPx * 0.25}"
        fill="#f59e0b" rx="1"/>
      <!-- Garage -->
      <rect x="4" y="${heightPx * 0.55}" width="${widthPx * 0.35}" height="${heightPx * 0.4}"
        fill="#334155" stroke="#64748b" stroke-width="1.5" rx="2"/>
      <!-- Arrow showing front -->
      <text x="${widthPx/2}" y="${heightPx - 4}" text-anchor="middle"
        font-size="9" fill="#f59e0b" font-weight="bold">FRONT</text>
    </svg>
    <!-- Compass badge -->
    <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);
      background:#f59e0b;color:#000;font-size:10px;font-weight:800;
      padding:2px 6px;border-radius:4px;white-space:nowrap;pointer-events:none;">
      ← FRONT
    </div>
  `
  return wrap
}

export default function StepLot({ state, update, onNext }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const houseMarkerRef = useRef<unknown>(null)

  const [query, setQuery] = useState(state.lot?.lot_address?.split(',')[0] ?? '')
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
  const [boundarySource, setBoundarySource] = useState<string>('')
  const [lotSizeDisplay, setLotSizeDisplay] = useState<string>('')

  // Load mapbox
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import('mapbox-gl').then((m: any) => { mapboxgl = m.default ?? m })
  }, [])

  // Update house marker rotation when slider changes
  const updateHouseRotation = useCallback((deg: number) => {
    if (!houseMarkerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = (houseMarkerRef.current as any).getElement()
    const svg = el?.querySelector('svg')
    if (svg) svg.style.transform = `rotate(${deg}deg)`
    const badge = el?.querySelector('div')
    const front = rotationToCardinal(deg)
    if (badge) badge.textContent = `↑ FRONT → ${front}`
  }, [])

  useEffect(() => {
    updateHouseRotation(rotation)
  }, [rotation, updateHouseRotation])

  const loadBoundary = useCallback(async (lat: number, lng: number, map: unknown) => {
    try {
      const r = await fetch(`/api/lot/boundary?lat=${lat}&lng=${lng}`)
      const data = await r.json()
      if (data.boundary) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = map as any
        if (m.getSource('lot-boundary')) {
          m.getSource('lot-boundary').setData(data.boundary)
        } else {
          m.addSource('lot-boundary', { type: 'geojson', data: data.boundary })
          m.addLayer({ id: 'lot-fill', type: 'fill', source: 'lot-boundary',
            paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.12 } })
          m.addLayer({ id: 'lot-line', type: 'line', source: 'lot-boundary',
            paint: { 'line-color': '#f59e0b', 'line-width': 2.5, 'line-dasharray': [3, 2] } })
        }
        setBoundarySource(data.source)
        if (data.lotSize) setLotSizeDisplay(`${parseFloat(data.lotSize).toFixed(2)} acres`)
        setLotData(prev => ({
          ...prev,
          lot_boundary_geojson: data.boundary,
          lot_size_acres: data.lotSize ? parseFloat(data.lotSize) : prev.lot_size_acres,
          lot_parcel_id: data.parcelId || prev.lot_parcel_id,
        }))
      }
    } catch {}
  }, [])

  const placeHouseMarker = useCallback((lnglat: [number, number], map: unknown, rot: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (houseMarkerRef.current) (houseMarkerRef.current as any).remove()
    const el = makeHouseEl(70, 52, rot)
    const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'center' })
      .setLngLat(lnglat)
      .addTo(m)
    marker.on('dragend', () => {
      const pos = marker.getLngLat()
      setLotData(prev => ({ ...prev, lot_lng: pos.lng, lot_lat: pos.lat }))
    })
    houseMarkerRef.current = marker
    updateHouseRotation(rot)
  }, [updateHouseRotation])

  // Init map
  useEffect(() => {
    if (!showMap || !mapContainer.current || mapRef.current || !mapboxgl) return

    // slight delay to ensure mapbox is loaded
    const init = () => {
      if (!mapboxgl || !mapContainer.current) return
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      const center: [number, number] = lotData.lot_lng && lotData.lot_lat
        ? [lotData.lot_lng, lotData.lot_lat] : [-98.5, 29.5]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center,
        zoom: lotData.lot_lat ? 17 : 9,
      })

      map.on('load', () => {
        if (lotData.lot_lat && lotData.lot_lng) {
          loadBoundary(lotData.lot_lat, lotData.lot_lng, map)
          placeHouseMarker([lotData.lot_lng, lotData.lot_lat], map, rotation)
        }
      })

      // Add zoom/navigation controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

      mapRef.current = map
    }

    if (mapboxgl) {
      init()
    } else {
      const t = setInterval(() => { if (mapboxgl) { clearInterval(t); init() } }, 100)
      return () => clearInterval(t)
    }

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove()
        mapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap])

  const handleAddressSelect = useCallback(async (place: { place_name: string; center: [number, number] }) => {
    const [lng, lat] = place.center
    setQuery(place.place_name.split(',').slice(0,2).join(','))
    setSuggestions([])
    const newLot = { ...lotData, lot_address: place.place_name, lot_lat: lat, lot_lng: lng }
    setLotData(newLot)
    setShowMap(true)

    const tryPlace = () => {
      if (!mapRef.current || !mapboxgl) return false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = mapRef.current as any
      m.flyTo({ center: [lng, lat], zoom: 17, essential: true })
      m.once('moveend', () => {
        loadBoundary(lat, lng, m)
        placeHouseMarker([lng, lat], m, rotation)
      })
      setSubstep('orient')
      return true
    }

    if (!tryPlace()) {
      const t = setInterval(() => { if (tryPlace()) clearInterval(t) }, 150)
    }
  }, [lotData, rotation, loadBoundary, placeHouseMarker])

  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); return }
    const r = await fetch(`/api/lot/geocode?address=${encodeURIComponent(q)}`)
    const data = await r.json()
    setSuggestions(data.features?.map((f: { place_name: string; center: [number, number] }) =>
      ({ place_name: f.place_name, center: f.center })) ?? [])
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchAddress(query), 300)
    return () => clearTimeout(t)
  }, [query, searchAddress])

  const streetFacing = rotationToCardinal(rotation)
  const garageFacing = rotationToSide(rotation, 270) // garage on left side

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
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your Lot</h2>
        <p className="text-stone-400 text-sm">Place your home on the actual property — we'll use this to orient your design.</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {(['address','orient','driveway','flags'] as const).map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            substep === s ? 'bg-amber-500' :
            (['address','orient','driveway','flags'].indexOf(substep) > i) ? 'bg-amber-700' : 'bg-stone-700'
          }`}/>
        ))}
      </div>

      {/* Address */}
      <div className="relative">
        <label className="block text-xs text-stone-400 mb-1.5 uppercase tracking-wider">Property address</label>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="123 Ranch Rd, Boerne TX"
          className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"/>
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-stone-900 border border-stone-700 rounded-xl overflow-hidden shadow-2xl">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleAddressSelect(s)}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-stone-700 border-b border-stone-800 last:border-0 transition-colors">
                📍 {s.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {showMap && (
        <div className="space-y-4">
          {/* Map container */}
          <div className="relative rounded-xl overflow-hidden border border-stone-700" style={{height: 260}}>
            <div ref={mapContainer} className="w-full h-full"/>

            {/* Lot info overlay */}
            {(boundarySource || lotSizeDisplay) && (
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex gap-3">
                {lotSizeDisplay && <span>📐 {lotSizeDisplay}</span>}
                {boundarySource && <span className={boundarySource === 'ReportAll' ? 'text-green-400' : boundarySource === 'OpenStreetMap' ? 'text-amber-400' : 'text-stone-400'}>
                  {boundarySource === 'ReportAll' ? '✓ Real parcel data' : boundarySource === 'OpenStreetMap' ? '~ OSM boundary' : '~ Estimated boundary'}
                </span>}
              </div>
            )}

            {/* Drag hint */}
            {substep === 'orient' && (
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg">
                Drag house to position · Rotate below
              </div>
            )}
          </div>

          {/* Orientation controls */}
          {substep !== 'address' && (
            <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">Orient the house</p>
                  <p className="text-stone-400 text-xs mt-0.5">
                    Front door → <span className="text-amber-400 font-bold">{streetFacing}</span>
                    <span className="mx-2 text-stone-600">·</span>
                    Garage → <span className="text-amber-400 font-bold">{garageFacing}</span>
                  </p>
                </div>
                {/* Mini compass */}
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border border-stone-600 flex items-center justify-center">
                    <div className="text-xs font-black" style={{transform:`rotate(${-rotation}deg)`,transformOrigin:'center'}}>
                      <span className="text-red-400">▲</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] text-stone-400 font-bold">N</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setRotation(r => (r - 45 + 360) % 360)}
                  className="bg-stone-700 hover:bg-stone-600 active:bg-stone-500 text-white rounded-lg w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors">↺</button>
                <input type="range" min={0} max={359} value={rotation}
                  onChange={e => setRotation(Number(e.target.value))}
                  className="flex-1 accent-amber-500 h-2"/>
                <button onClick={() => setRotation(r => (r + 45) % 360)}
                  className="bg-stone-700 hover:bg-stone-600 active:bg-stone-500 text-white rounded-lg w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors">↻</button>
              </div>

              {/* Quick direction presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[{label:'N facing',val:0},{label:'E facing',val:270},{label:'S facing',val:180},{label:'W facing',val:90}].map(p => (
                  <button key={p.val} onClick={() => setRotation(p.val)}
                    className={`py-1.5 text-xs rounded-lg border transition-colors ${
                      rotation === p.val ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-stone-700 text-stone-400 hover:border-stone-500'
                    }`}>{p.label}</button>
                ))}
              </div>

              {substep === 'orient' && (
                <button onClick={() => setSubstep('driveway')}
                  className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Looks good → Set driveway
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Driveway */}
      {showMap && substep !== 'address' && substep !== 'orient' && (
        <div>
          <label className="block text-xs text-stone-400 mb-2 uppercase tracking-wider">How do you pull in from the street?</label>
          <div className="grid grid-cols-3 gap-2">
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
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-400 mb-2 uppercase tracking-wider">Lot characteristics <span className="normal-case text-stone-600">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {LOT_FLAGS.map(f => (
                <button key={f.id}
                  onClick={() => setFlags(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])}
                  className={`py-1.5 px-3 rounded-lg border text-sm transition-all ${
                    flags.includes(f.id)
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-600'
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Views, easements, septic location, access road..."
            rows={2}
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 resize-none"/>
        </div>
      )}

      {/* Next */}
      <button onClick={handleNext} disabled={!canProceed}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all ${
          canProceed ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-stone-800 text-stone-600 cursor-not-allowed'
        }`}>
        {canProceed ? 'Continue →' : lotData.lot_address ? 'Select driveway direction to continue' : 'Enter your address to continue'}
      </button>
    </div>
  )
}
