'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { DesignState, LotData } from '@/lib/design-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapboxgl: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MapboxDraw: any = null

interface Props {
  state: DesignState
  update: (patch: Partial<DesignState>) => void
  onNext: () => void
}

const COMPASS_DIRS = ['N','NE','E','SE','S','SW','W','NW'] as const
function rotationToCardinal(deg: number) { return COMPASS_DIRS[Math.round(((deg+180)%360)/45)%8] }
function rotationToSide(deg: number, offset: number) { return COMPASS_DIRS[Math.round(((deg+offset)%360)/45)%8] }

const MAP_STYLES = [
  { id: 'satellite', label: '🛰 Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'streets',   label: '🗺 Streets',   url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'outdoors',  label: '🌿 Outdoors',  url: 'mapbox://styles/mapbox/outdoors-v12' },
]

const DRAW_TOOLS = [
  { id: 'draw_polygon',  label: '⬡', title: 'Draw area / building' },
  { id: 'draw_line',     label: '╱', title: 'Draw line / driveway / fence' },
  { id: 'draw_point',    label: '●', title: 'Drop a pin' },
  { id: 'simple_select', label: '↖', title: 'Select / move' },
  { id: 'delete',        label: '🗑', title: 'Delete selected' },
  { id: 'clear',         label: '✕', title: 'Clear all drawings' },
]

const LOT_FLAGS = [
  { id: 'sloped', label: '⛰ Sloped' },
  { id: 'corner', label: '🔀 Corner lot' },
  { id: 'wooded', label: '🌳 Wooded' },
  { id: 'creek',  label: '💧 Creek/pond' },
  { id: 'hoa',    label: '🏘 HOA' },
  { id: 'rural',  label: '🤠 Rural' },
]

const DRIVEWAY_OPTIONS = [
  { id: 'left_turn',   label: '← Left turn in' },
  { id: 'straight_in', label: '↑ Straight in' },
  { id: 'right_turn',  label: '→ Right turn in' },
]

const SQFT_PRESETS = [
  { label: '1,500 SF', value: 1500 },
  { label: '2,000 SF', value: 2000 },
  { label: '2,500 SF', value: 2500 },
  { label: '3,000 SF', value: 3000 },
  { label: '3,500 SF', value: 3500 },
  { label: '4,000+ SF', value: 4500 },
]

// Build a rotated GeoJSON rectangle centered at [lng, lat]
// widthFt and depthFt are real-world feet, rotationDeg rotates the rectangle
function buildFootprintGeoJSON(lng: number, lat: number, widthFt: number, depthFt: number, rotationDeg: number) {
  // Convert feet to degrees (approximate, good enough at lot scale)
  const ftPerDegLng = 364000 * Math.cos(lat * Math.PI / 180)
  const ftPerDegLat = 364000
  const hw = (widthFt / 2) / ftPerDegLng  // half-width in degrees
  const hd = (depthFt / 2) / ftPerDegLat  // half-depth in degrees
  const rad = rotationDeg * Math.PI / 180

  // Corners relative to center (unrotated)
  const corners = [
    [-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]
  ]
  // Rotate each corner
  const rotated = corners.map(([x, y]) => [
    lng + x * Math.cos(rad) - y * Math.sin(rad),
    lat + x * Math.sin(rad) + y * Math.cos(rad),
  ])
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [rotated] },
    properties: {},
  }
}

function sqftToDimensions(sf: number): { widthFt: number; depthFt: number } {
  // Full footprint (single story), 1.7:1 width:depth
  const depthFt = Math.sqrt(sf / 1.7)
  const widthFt = depthFt * 1.7
  return { widthFt, depthFt }
}

export default function StepLot({ state, update, onNext }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dragMarkerRef = useRef<any>(null)   // tiny drag handle marker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawRef = useRef<any>(null)
  const houseCenter = useRef<[number, number] | null>(null)

  const [query, setQuery] = useState(state.lot?.lot_address?.split(',')[0] ?? '')
  const [suggestions, setSuggestions] = useState<{ place_name: string; center: [number, number] }[]>([])
  const [rotation, setRotation] = useState(state.lot?.house_rotation_deg ?? 180)
  const [driveway, setDriveway] = useState(state.lot?.driveway_approach ?? '')
  const [flags, setFlags] = useState<string[]>(state.lot?.lot_flags ?? [])
  const [notes, setNotes] = useState(state.lot?.lot_notes ?? '')
  const [lotData, setLotData] = useState<Partial<LotData>>(state.lot ?? {})
  const [showMap, setShowMap] = useState(!!state.lot?.lot_address)
  const [substep, setSubstep] = useState<'address'|'orient'|'driveway'|'flags'>(
    state.lot?.lot_address ? 'orient' : 'address'
  )
  const [boundarySource, setBoundarySource] = useState('')
  const [lotSizeDisplay, setLotSizeDisplay] = useState('')
  const [mapStyle, setMapStyle] = useState('satellite')
  const [activeTool, setActiveTool] = useState('simple_select')
  const [mbLoaded, setMbLoaded] = useState(false)
  const [sqft, setSqft] = useState(state.sqft ?? 2500)

  const suppressSearch = useRef(false)
  const sqftRef = useRef(state.sqft ?? 2500)
  const rotationRef = useRef(state.lot?.house_rotation_deg ?? 180)

  // Load mapbox + draw dynamically
  useEffect(() => {
    Promise.all([
      import('mapbox-gl'),
      import('@mapbox/mapbox-gl-draw'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).then(([mb, draw]: any[]) => {
      mapboxgl = mb.default ?? mb
      MapboxDraw = draw.default ?? draw
      setMbLoaded(true)
    })
  }, [])

  // Update the GeoJSON footprint layer (purely in map coords — always perfectly scaled)
  const updateFootprint = useCallback(() => {
    if (!mapRef.current || !houseCenter.current) return
    const [lng, lat] = houseCenter.current
    const { widthFt, depthFt } = sqftToDimensions(sqftRef.current)
    const geojson = buildFootprintGeoJSON(lng, lat, widthFt, depthFt, rotationRef.current)
    if (mapRef.current.getSource('house-footprint')) {
      mapRef.current.getSource('house-footprint').setData(geojson)
    }
  }, [])

  // Sync refs and update footprint on rotation change
  useEffect(() => {
    rotationRef.current = rotation
    updateFootprint()
  }, [rotation, updateFootprint])

  // Sync refs and update footprint on sqft change
  useEffect(() => {
    sqftRef.current = sqft
    updateFootprint()
  }, [sqft, updateFootprint])

  const placeDragHandle = useCallback((lnglat: [number, number]) => {
    if (!mapRef.current || !mapboxgl) return
    if (dragMarkerRef.current) dragMarkerRef.current.remove()

    // Small crosshair drag handle
    const el = document.createElement('div')
    el.style.cssText = `width:28px;height:28px;cursor:move;display:flex;align-items:center;justify-content:center;
      background:rgba(245,158,11,0.9);border:2px solid #fff;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.6);font-size:14px;`
    el.textContent = '✛'

    const marker = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'center' })
      .setLngLat(lnglat)
      .addTo(mapRef.current)

    marker.on('drag', () => {
      const p = marker.getLngLat()
      houseCenter.current = [p.lng, p.lat]
      updateFootprint()
    })
    marker.on('dragend', () => {
      const p = marker.getLngLat()
      houseCenter.current = [p.lng, p.lat]
      setLotData(prev => ({ ...prev, lot_lng: p.lng, lot_lat: p.lat }))
      updateFootprint()
    })
    dragMarkerRef.current = marker
  }, [updateFootprint])

  const addFootprintLayers = useCallback((map: unknown, initialGeoJSON: object) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any
    if (m.getSource('house-footprint')) return
    m.addSource('house-footprint', { type: 'geojson', data: initialGeoJSON })
    m.addLayer({ id: 'house-fill', type: 'fill', source: 'house-footprint',
      paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.25 } })
    m.addLayer({ id: 'house-outline', type: 'line', source: 'house-footprint',
      paint: { 'line-color': '#f59e0b', 'line-width': 2.5 } })
    // Front face indicator (slightly darker line on south face)
    m.addLayer({ id: 'house-label', type: 'symbol', source: 'house-footprint',
      layout: { 'text-field': '🏠 FRONT', 'text-size': 11, 'text-anchor': 'center' },
      paint: { 'text-color': '#f59e0b', 'text-halo-color': '#000', 'text-halo-width': 1.5 } })
  }, [])

  const placeHouseOnMap = useCallback((lnglat: [number, number]) => {
    if (!mapRef.current) return
    houseCenter.current = lnglat
    const { widthFt, depthFt } = sqftToDimensions(sqftRef.current)
    const geojson = buildFootprintGeoJSON(lnglat[0], lnglat[1], widthFt, depthFt, rotationRef.current)

    if (mapRef.current.isStyleLoaded()) {
      addFootprintLayers(mapRef.current, geojson)
      mapRef.current.getSource('house-footprint')?.setData(geojson)
    } else {
      mapRef.current.once('style.load', () => {
        addFootprintLayers(mapRef.current, geojson)
      })
    }
    placeDragHandle(lnglat)
  }, [addFootprintLayers, placeDragHandle])

  const loadBoundary = useCallback(async (lat: number, lng: number) => {
    try {
      const r = await fetch(`/api/lot/boundary?lat=${lat}&lng=${lng}`)
      const data = await r.json()
      if (!data.boundary || !mapRef.current) return
      const m = mapRef.current
      const add = () => {
        if (m.getSource('lot-boundary')) {
          m.getSource('lot-boundary').setData(data.boundary)
        } else {
          m.addSource('lot-boundary', { type: 'geojson', data: data.boundary })
          m.addLayer({ id: 'lot-fill', type: 'fill', source: 'lot-boundary',
            paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.08 } })
          m.addLayer({ id: 'lot-line', type: 'line', source: 'lot-boundary',
            paint: { 'line-color': '#f59e0b', 'line-width': 2.5, 'line-dasharray': [3,2] } })
        }
      }
      if (m.isStyleLoaded()) add()
      else m.once('style.load', add)
      setBoundarySource(data.source)
      if (data.lotSize) setLotSizeDisplay(`${parseFloat(data.lotSize).toFixed(2)} ac`)
      setLotData(prev => ({
        ...prev,
        lot_boundary_geojson: data.boundary,
        lot_size_acres: data.lotSize ? parseFloat(data.lotSize) : prev.lot_size_acres,
        lot_parcel_id: data.parcelId ?? prev.lot_parcel_id,
      }))
    } catch {}
  }, [])

  const initMap = useCallback(() => {
    if (!mapContainer.current || mapRef.current || !mapboxgl || !MapboxDraw) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    const center: [number,number] = lotData.lot_lng && lotData.lot_lat
      ? [lotData.lot_lng, lotData.lot_lat] : [-98.5, 29.5]

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[0].url,
      center,
      zoom: lotData.lot_lat ? 17 : 9,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'imperial' }), 'bottom-right')

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        { id: 'gl-draw-polygon-fill', type: 'fill',
          filter: ['all',['==','$type','Polygon'],['!=','mode','static']],
          paint: { 'fill-color': '#60a5fa', 'fill-opacity': 0.15 } },
        { id: 'gl-draw-polygon-stroke', type: 'line',
          filter: ['all',['==','$type','Polygon'],['!=','mode','static']],
          paint: { 'line-color': '#60a5fa', 'line-width': 2 } },
        { id: 'gl-draw-line', type: 'line',
          filter: ['all',['==','$type','LineString'],['!=','mode','static']],
          paint: { 'line-color': '#60a5fa', 'line-width': 2.5, 'line-dasharray': [2,1] } },
        { id: 'gl-draw-point', type: 'circle',
          filter: ['all',['==','$type','Point'],['!=','mode','static']],
          paint: { 'circle-radius': 5, 'circle-color': '#60a5fa' } },
      ],
    })
    map.addControl(draw)
    drawRef.current = draw
    mapRef.current = map

    map.on('load', () => {
      if (lotData.lot_lat && lotData.lot_lng) {
        loadBoundary(lotData.lot_lat, lotData.lot_lng)
        placeHouseOnMap([lotData.lot_lng, lotData.lot_lat])
      }
    })
  }, [lotData.lot_lat, lotData.lot_lng, loadBoundary, placeHouseOnMap])

  useEffect(() => {
    if (!showMap || !mbLoaded || mapRef.current) return
    const t = setTimeout(initMap, 50)
    return () => clearTimeout(t)
  }, [showMap, mbLoaded, initMap])

  const switchStyle = useCallback((styleId: string) => {
    const style = MAP_STYLES.find(s => s.id === styleId)
    if (!style || !mapRef.current) return
    setMapStyle(styleId)
    mapRef.current.setStyle(style.url)
    mapRef.current.once('style.load', () => {
      if (lotData.lot_lat && lotData.lot_lng) loadBoundary(lotData.lot_lat, lotData.lot_lng)
      if (houseCenter.current) placeHouseOnMap(houseCenter.current)
    })
  }, [lotData.lot_lat, lotData.lot_lng, loadBoundary, placeHouseOnMap])

  const handleDrawTool = useCallback((toolId: string) => {
    if (!drawRef.current) return
    setActiveTool(toolId)
    if (toolId === 'draw_polygon') drawRef.current.changeMode('draw_polygon')
    else if (toolId === 'draw_line') drawRef.current.changeMode('draw_line_string')
    else if (toolId === 'draw_point') drawRef.current.changeMode('draw_point')
    else if (toolId === 'simple_select') drawRef.current.changeMode('simple_select')
    else if (toolId === 'delete') { drawRef.current.trash(); setActiveTool('simple_select') }
    else if (toolId === 'clear') { drawRef.current.deleteAll(); setActiveTool('simple_select') }
  }, [])

  const handleAddressSelect = useCallback(async (place: { place_name: string; center: [number,number] }) => {
    const [lng, lat] = place.center
    suppressSearch.current = true
    setQuery(place.place_name.split(',').slice(0,2).join(','))
    setSuggestions([])
    setLotData(prev => ({ ...prev, lot_address: place.place_name, lot_lat: lat, lot_lng: lng }))
    setShowMap(true)

    const tryPlace = () => {
      if (!mapRef.current) return false
      mapRef.current.flyTo({ center: [lng, lat], zoom: 17, essential: true })
      mapRef.current.once('moveend', () => {
        loadBoundary(lat, lng)
        placeHouseOnMap([lng, lat])
      })
      setSubstep('orient')
      return true
    }
    if (!tryPlace()) {
      const t = setInterval(() => { if (tryPlace()) clearInterval(t) }, 150)
    }
  }, [loadBoundary, placeHouseOnMap])

  const searchAddress = useCallback(async (q: string) => {
    if (suppressSearch.current) { suppressSearch.current = false; return }
    if (q.length < 3) { setSuggestions([]); return }
    const r = await fetch(`/api/lot/geocode?address=${encodeURIComponent(q)}`)
    const data = await r.json()
    setSuggestions(data.features?.map((f: { place_name: string; center: [number,number] }) =>
      ({ place_name: f.place_name, center: f.center })) ?? [])
  }, [])

  useEffect(() => {
    const t = setTimeout(() => searchAddress(query), 300)
    return () => clearTimeout(t)
  }, [query, searchAddress])

  const canProceed = !!lotData.lot_address && !!driveway

  const handleNext = () => {
    update({
      sqft,
      lot: {
        ...lotData,
        house_rotation_deg: rotation,
        street_facing: rotationToCardinal(rotation),
        garage_facing: rotationToSide(rotation, 270),
        driveway_approach: driveway,
        lot_flags: flags,
        lot_notes: notes,
      } as LotData,
    })
    onNext()
  }

  const { widthFt, depthFt } = sqftToDimensions(sqft)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Your Lot</h2>
        <p className="text-stone-400 text-sm">Place your home on the actual property to orient the design.</p>
      </div>

      <div className="flex gap-1.5">
        {(['address','orient','driveway','flags'] as const).map((s,i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
            substep === s ? 'bg-amber-500' :
            (['address','orient','driveway','flags'].indexOf(substep) > i) ? 'bg-amber-700' : 'bg-stone-700'
          }`}/>
        ))}
      </div>

      {/* Address */}
      <div className="relative">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Enter property address..."
          className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"/>
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-stone-900 border border-stone-700 rounded-xl overflow-hidden shadow-2xl">
            {suggestions.map((s,i) => (
              <button key={i} onClick={() => handleAddressSelect(s)}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-stone-700 border-b border-stone-800 last:border-0">
                📍 {s.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sqft size picker */}
      <div>
        <label className="block text-xs text-stone-400 mb-2 uppercase tracking-wider">
          Approximate home size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SQFT_PRESETS.map(p => (
            <button key={p.value} onClick={() => setSqft(p.value)}
              className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                sqft === p.value
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-500'
              }`}>{p.label}</button>
          ))}
        </div>
        <p className="text-xs text-stone-600 mt-1.5">
          ~{Math.round(widthFt)}ft wide × {Math.round(depthFt)}ft deep · footprint drawn true-to-scale on map
        </p>
      </div>

      {showMap && (
        <div className="space-y-3">
          {/* Style bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {MAP_STYLES.map(s => (
              <button key={s.id} onClick={() => switchStyle(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  mapStyle === s.id ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-stone-700 text-stone-400 hover:border-stone-500'
                }`}>{s.label}</button>
            ))}
            {lotSizeDisplay && <span className="ml-auto text-xs text-stone-400">📐 {lotSizeDisplay}</span>}
            {boundarySource && (
              <span className={`text-xs ${boundarySource==='ReportAll'?'text-green-400':boundarySource==='OpenStreetMap'?'text-amber-400':'text-stone-500'}`}>
                {boundarySource==='ReportAll'?'✓ Real parcel':boundarySource==='OpenStreetMap'?'~ OSM boundary':'~ Estimated'}
              </span>
            )}
          </div>

          {/* Map */}
          <div className="relative rounded-xl overflow-hidden border border-stone-700" style={{height:420}}>
            <div ref={mapContainer} className="w-full h-full"/>

            {/* Draw toolbar */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {DRAW_TOOLS.map(t => (
                <button key={t.id} title={t.title} onClick={() => handleDrawTool(t.id)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold shadow-lg border transition-colors flex items-center justify-center ${
                    activeTool === t.id
                      ? 'bg-amber-500 border-amber-400 text-black'
                      : 'bg-stone-900/90 border-stone-700 text-white hover:bg-stone-700'
                  }`}>{t.label}</button>
              ))}
            </div>

            {substep === 'orient' && (
              <div className="absolute bottom-10 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg">
                Drag ✛ to position · rotate below
              </div>
            )}
          </div>

          {/* Orientation */}
          {substep !== 'address' && (
            <div className="bg-stone-800/80 border border-stone-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">Orient the house</p>
                  <p className="text-stone-400 text-xs mt-0.5">
                    Front → <span className="text-amber-400 font-bold">{rotationToCardinal(rotation)}</span>
                    <span className="mx-2 text-stone-600">·</span>
                    Garage → <span className="text-amber-400 font-bold">{rotationToSide(rotation,270)}</span>
                  </p>
                </div>
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center">
                    <span className="text-red-400 text-sm font-black" style={{transform:`rotate(${-rotation}deg)`,display:'block'}}>▲</span>
                  </div>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] text-stone-400 font-bold">N</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setRotation(r => (r-45+360)%360)}
                  className="bg-stone-700 hover:bg-stone-600 text-white rounded-lg w-10 h-10 flex items-center justify-center text-lg font-bold">↺</button>
                <input type="range" min={0} max={359} value={rotation}
                  onChange={e => setRotation(Number(e.target.value))}
                  className="flex-1 accent-amber-500"/>
                <button onClick={() => setRotation(r => (r+45)%360)}
                  className="bg-stone-700 hover:bg-stone-600 text-white rounded-lg w-10 h-10 flex items-center justify-center text-lg font-bold">↻</button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[{l:'↑ N',v:0},{l:'→ E',v:270},{l:'↓ S',v:180},{l:'← W',v:90}].map(p => (
                  <button key={p.v} onClick={() => setRotation(p.v)}
                    className={`py-1.5 text-xs rounded-lg border transition-colors ${
                      rotation===p.v ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-stone-700 text-stone-400 hover:border-stone-500'
                    }`}>{p.l}</button>
                ))}
              </div>

              {substep === 'orient' && (
                <button onClick={() => setSubstep('driveway')}
                  className="w-full py-2.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-sm font-medium">
                  Set driveway direction →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Driveway */}
      {showMap && substep !== 'address' && substep !== 'orient' && (
        <div>
          <label className="block text-xs text-stone-400 mb-2 uppercase tracking-wider">Driveway approach</label>
          <div className="grid grid-cols-3 gap-2">
            {DRIVEWAY_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => { setDriveway(opt.id); setSubstep('flags') }}
                className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                  driveway===opt.id ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-500'
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Flags */}
      {substep === 'flags' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-400 mb-2 uppercase tracking-wider">Lot characteristics <span className="normal-case text-stone-500">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {LOT_FLAGS.map(f => (
                <button key={f.id}
                  onClick={() => setFlags(prev => prev.includes(f.id) ? prev.filter(x=>x!==f.id) : [...prev,f.id])}
                  className={`py-1.5 px-3 rounded-lg border text-sm transition-all ${
                    flags.includes(f.id) ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-stone-700 bg-stone-800 text-stone-300 hover:border-stone-600'
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Views, easements, septic, access road..."
            rows={2}
            className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 resize-none"/>
        </div>
      )}

      <button onClick={handleNext} disabled={!canProceed}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all ${
          canProceed ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-stone-800 text-stone-600 cursor-not-allowed'
        }`}>
        {canProceed ? 'Continue →' : lotData.lot_address ? 'Select driveway direction to continue' : 'Enter your address to continue'}
      </button>
    </div>
  )
}
