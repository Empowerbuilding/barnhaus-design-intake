'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { DesignState, LotData, Direction, MasterLocation } from '@/lib/design-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mapboxgl: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MapboxDraw: any = null

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

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

const STREET_FACING: { value: Direction; label: string }[] = [
  { value: 'N', label: '↑ North' },
  { value: 'S', label: '↓ South' },
  { value: 'E', label: '→ East' },
  { value: 'W', label: '← West' },
]

const MASTER_LOCATIONS: { value: MasterLocation; label: string }[] = [
  { value: 'far_left', label: 'Far Left' },
  { value: 'far_right', label: 'Far Right' },
  { value: 'rear_center', label: 'Rear Center' },
  { value: 'no_preference', label: 'No Preference' },
]

const DIR_TO_ROTATION: Record<Direction, number> = { N: 180, S: 0, E: 270, W: 90 }

function buildFootprintGeoJSON(lng: number, lat: number, widthFt: number, depthFt: number, rotationDeg: number) {
  const ftPerDegLng = 364000 * Math.cos(lat * Math.PI / 180)
  const ftPerDegLat = 364000
  const hw = (widthFt / 2) / ftPerDegLng
  const hd = (depthFt / 2) / ftPerDegLat
  const rad = rotationDeg * Math.PI / 180
  const corners = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]]
  const rotated = corners.map(([x, y]) => [
    lng + x * Math.cos(rad) - y * Math.sin(rad),
    lat + x * Math.sin(rad) + y * Math.cos(rad),
  ])
  return { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [rotated] }, properties: {} }
}

function sqftToDimensions(sf: number) {
  const depthFt = Math.sqrt(sf / 1.7)
  return { widthFt: depthFt * 1.7, depthFt }
}

export default function StepLot({ state, onChange }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dragMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawRef = useRef<any>(null)
  const houseCenter = useRef<[number, number] | null>(null)

  const [query, setQuery] = useState(state.lot?.lot_address?.split(',')[0] ?? '')
  const [suggestions, setSuggestions] = useState<{ place_name: string; center: [number, number] }[]>([])
  const [lotData, setLotData] = useState<Partial<LotData>>(state.lot ?? {})
  const [showMap, setShowMap] = useState(!!state.lot?.lot_address)
  const [boundarySource, setBoundarySource] = useState('')
  const [lotSizeDisplay, setLotSizeDisplay] = useState('')
  const [mapStyle, setMapStyle] = useState('satellite')
  const [activeTool, setActiveTool] = useState('simple_select')
  const [mbLoaded, setMbLoaded] = useState(false)
  const [flags, setFlags] = useState<string[]>(state.lot?.lot_flags ?? [])
  const [notes, setNotes] = useState(state.lot?.lot_notes ?? '')
  const [streetDir, setStreetDir] = useState<Direction | undefined>(state.streetFacing)
  const [rotation, setRotation] = useState(state.lot?.house_rotation_deg ?? (state.streetFacing ? DIR_TO_ROTATION[state.streetFacing] : 180))

  const suppressSearch = useRef(false)
  const sqftRef = useRef(state.sqft ?? 2500)
  const rotationRef = useRef(rotation)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Sync sqft from parent
  useEffect(() => { sqftRef.current = state.sqft ?? 2500 }, [state.sqft])

  // Sync lot data to parent (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      onChangeRef.current({
        lot: {
          ...lotData,
          house_rotation_deg: rotation,
          street_facing: streetDir,
          lot_flags: flags,
          lot_notes: notes,
        } as LotData,
      })
    }, 200)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotData.lot_address, lotData.lot_lat, lotData.lot_lng, rotation, flags.length, notes])

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

  const updateFootprint = useCallback(() => {
    if (!mapRef.current || !houseCenter.current) return
    const [lng, lat] = houseCenter.current
    const { widthFt, depthFt } = sqftToDimensions(sqftRef.current)
    const geojson = buildFootprintGeoJSON(lng, lat, widthFt, depthFt, rotationRef.current)
    if (mapRef.current.getSource('house-footprint')) {
      mapRef.current.getSource('house-footprint').setData(geojson)
    }
  }, [])

  useEffect(() => {
    rotationRef.current = rotation
    updateFootprint()
  }, [rotation, updateFootprint])

  const placeDragHandle = useCallback((lnglat: [number, number]) => {
    if (!mapRef.current || !mapboxgl) return
    if (dragMarkerRef.current) dragMarkerRef.current.remove()
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

  const handleStreetFacing = (dir: Direction) => {
    const rot = DIR_TO_ROTATION[dir]
    setStreetDir(dir)
    setRotation(rot)
    onChange({ streetFacing: dir })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Lot & Orientation</h2>
        <p className="text-stone-400 text-sm">Place your home on the property and set orientation.</p>
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
          <div className="relative rounded-xl overflow-hidden border border-stone-700" style={{height:360}}>
            <div ref={mapContainer} className="w-full h-full"/>
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
          </div>
        </div>
      )}

      {/* Street Facing */}
      <div>
        <label className="text-sm text-gray-300 block mb-2">Street Facing (front of house faces)</label>
        <div className="grid grid-cols-4 gap-2">
          {STREET_FACING.map(d => (
            <button key={d.value} onClick={() => handleStreetFacing(d.value)}
              className={`py-2.5 rounded text-sm font-medium transition ${
                streetDir === d.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master Suite Location */}
      <div>
        <label className="text-sm text-gray-300 block mb-2">Master Suite Location</label>
        <div className="grid grid-cols-2 gap-2">
          {MASTER_LOCATIONS.map(m => (
            <button key={m.value} onClick={() => onChange({ masterLocation: m.value })}
              className={`py-2.5 rounded text-sm font-medium transition ${
                state.masterLocation === m.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lot Flags */}
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

      {/* Notes */}
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Views, easements, septic, access road..."
        rows={2}
        className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 resize-none"/>
    </div>
  )
}
