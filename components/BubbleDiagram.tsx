'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { DesignState } from '@/lib/design-types'

const VP_W = 500
const VP_H = 360

interface Bubble {
  id: string
  label: string
  r: number
  type: 'living' | 'kitchen' | 'master' | 'bedroom' | 'bath' | 'garage' | 'service' | 'porch'
  x: number
  y: number
}

const TYPE_STYLE: Record<Bubble['type'], { fill: string; stroke: string }> = {
  living:  { fill: '#F5EDD6', stroke: '#C4A35A' },
  kitchen: { fill: '#EDE8DC', stroke: '#B89B56' },
  master:  { fill: '#EBE4D8', stroke: '#A08848' },
  bedroom: { fill: '#E8E4DC', stroke: '#9A9080' },
  bath:    { fill: '#E0E8EC', stroke: '#7090A0' },
  garage:  { fill: '#E0E0DC', stroke: '#888880' },
  service: { fill: '#DDDBD8', stroke: '#888888' },
  porch:   { fill: '#E8EDDF', stroke: '#7A9060' },
}

const CONNECTIONS = [
  ['great_room', 'kitchen'], ['great_room', 'dining'],
  ['master_bed', 'master_bath'], ['master_bath', 'wic'],
  ['great_room', 'master_bed'], ['kitchen', 'laundry'],
]

function buildBubbles(state: DesignState): Bubble[] {
  const beds  = state.bedrooms  || 3
  const baths = state.bathrooms || 2
  const garage = state.garageCount || 'none'
  const feats = state.features || {}

  const list: Bubble[] = [
    { id: 'great_room',   label: 'Great Room',   r: 52, type: 'living',  x: 250, y: 170 },
    { id: 'kitchen',      label: 'Kitchen',       r: 42, type: 'kitchen', x: 130, y: 190 },
    { id: 'dining',       label: 'Dining',        r: 34, type: 'kitchen', x: 130, y: 300 },
    { id: 'master_bed',   label: 'Master Bed',    r: 48, type: 'master',  x: 400, y: 100 },
    { id: 'master_bath',  label: 'Master Bath',   r: 30, type: 'bath',    x: 450, y: 200 },
    { id: 'wic',          label: 'W.I.C.',        r: 24, type: 'service', x: 430, y: 290 },
    { id: 'laundry',      label: 'Laundry',       r: 22, type: 'service', x: 60,  y: 300 },
    { id: 'utility',      label: 'Utility',       r: 22, type: 'service', x: 55,  y: 230 },
  ]

  const bedStartX = [240, 320, 160, 400, 80]
  const bedStartY = [50,  60,  55,  55,  60]
  for (let i = 2; i <= beds; i++) {
    list.push({ id: `bed_${i}`, label: `Bed ${i}`, r: 38, type: 'bedroom',
      x: bedStartX[(i - 2) % bedStartX.length],
      y: bedStartY[(i - 2) % bedStartY.length] })
  }
  for (let i = 2; i <= Math.floor(baths); i++) {
    list.push({ id: `bath_${i}`, label: `Bath ${i}`, r: 24, type: 'bath',
      x: 300 + (i - 2) * 65, y: 310 })
  }
  if (garage !== 'none') {
    const label = garage === '3-car' ? '3-Car Garage' : garage === '2-car' ? '2-Car Garage' : 'Garage'
    list.push({ id: 'garage', label, r: 46, type: 'garage', x: 80, y: 170 })
  }
  if (feats.covered_front_porch) list.push({ id: 'front_porch', label: 'Front Porch', r: 30, type: 'porch', x: 240, y: 320 })
  if (feats.covered_back_porch)  list.push({ id: 'back_porch',  label: 'Back Porch',  r: 28, type: 'porch', x: 340, y: 320 })
  if (feats.home_office)  list.push({ id: 'home_office',  label: 'Home Office',  r: 34, type: 'bedroom', x: 460, y: 310 })
  if (feats.media_room)   list.push({ id: 'media_room',   label: 'Media Room',   r: 38, type: 'living',  x: 300, y: 290 })
  if (feats.butler_pantry)list.push({ id: 'butler_pantry',label: 'Butler Pantry',r: 26, type: 'kitchen', x: 180, y: 130 })
  if (feats.inlaw_suite)  list.push({ id: 'inlaw_suite',  label: 'In-Law Suite', r: 42, type: 'bedroom', x: 460, y: 200 })

  return list
}

interface Props {
  state: DesignState
  onPositionsChange: (p: Record<string, { x: number; y: number }>) => void
  generatedImageUrl?: string
  onGenerate: (base64: string, bubbles: {id:string;label:string;x:number;y:number;r:number}[]) => void
  generating: boolean
}

export default function BubbleDiagram({ state, onPositionsChange, generatedImageUrl, onGenerate, generating }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => buildBubbles(state))
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const svgRef  = useRef<SVGSVGElement>(null)
  const prevBeds    = useRef(state.bedrooms)
  const prevBaths   = useRef(state.bathrooms)
  const prevGarage  = useRef(state.garageCount)
  const prevFeats   = useRef(JSON.stringify(state.features))

  // Merge new rooms in while preserving existing positions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const featsStr = JSON.stringify(state.features)
    if (state.bedrooms !== prevBeds.current || state.bathrooms !== prevBaths.current ||
        state.garageCount !== prevGarage.current || featsStr !== prevFeats.current) {
      prevBeds.current = state.bedrooms
      prevBaths.current = state.bathrooms
      prevGarage.current = state.garageCount
      prevFeats.current = featsStr
      const newTemplate = buildBubbles(state)
      setBubbles(prev => {
        const posMap = Object.fromEntries(prev.map(b => [b.id, { x: b.x, y: b.y }]))
        // Keep existing positions, add new rooms with default positions, remove stale rooms
        const newIds = new Set(newTemplate.map(b => b.id))
        return newTemplate.map(b => ({
          ...b,
          x: posMap[b.id]?.x ?? b.x,
          y: posMap[b.id]?.y ?? b.y,
        })).filter(b => newIds.has(b.id))
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bedrooms, state.bathrooms, state.garageCount, state.features])

  const getSVGPoint = useCallback((e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const scaleX = VP_W / rect.width
    const scaleY = VP_H / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  const onMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const pt = getSVGPoint(e.nativeEvent)
    const b = bubbles.find(b => b.id === id)!
    dragRef.current = { id, ox: pt.x - b.x, oy: pt.y - b.y }
  }

  const onTouchStart = (id: string, e: React.TouchEvent) => {
    const pt = getSVGPoint(e.touches[0])
    const b = bubbles.find(b => b.id === id)!
    dragRef.current = { id, ox: pt.x - b.x, oy: pt.y - b.y }
  }

  const onMove = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current
    if (!drag || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = VP_W / rect.width
    const scaleY = VP_H / rect.height
    const x = Math.max(20, Math.min(VP_W - 20, (clientX - rect.left) * scaleX - drag.ox))
    const y = Math.max(20, Math.min(VP_H - 20, (clientY - rect.top)  * scaleY - drag.oy))
    setBubbles(prev => prev.map(b => b.id === drag.id ? { ...b, x, y } : b))
  }, [])

  const onPositionsChangeRef = useRef(onPositionsChange)
  useEffect(() => { onPositionsChangeRef.current = onPositionsChange }, [onPositionsChange])

  const onEnd = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setBubbles(prev => {
      onPositionsChangeRef.current(Object.fromEntries(prev.map(b => [b.id, { x: b.x, y: b.y }])))
      return prev
    })
  }, [])

  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    const up = () => onEnd()
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', tm, { passive: false })
    window.addEventListener('touchend', up)
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', up) }
  }, [onMove, onEnd])

  const handleGenerate = async () => {
    const svg = svgRef.current
    if (!svg) return
    // Convert SVG to PNG via canvas
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = VP_W * 2
      canvas.height = VP_H * 2
      const ctx = canvas.getContext('2d')!
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      const base64 = canvas.toDataURL('image/png')
      // Pass exact bubble positions alongside image
      onGenerate(base64, bubbles.map(b => ({ id: b.id, label: b.label, x: b.x, y: b.y, r: b.r })))
    }
    img.src = url
  }

  if (generatedImageUrl) {
    return (
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={generatedImageUrl} alt="Generated floor plan zone map" className="w-full rounded-lg"/>
        <button onClick={handleGenerate} className="mt-3 w-full py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:border-[#C4A35A] hover:text-[#C4A35A] transition-colors">
          ↺ Regenerate Zone Map
        </button>
      </div>
    )
  }

  const posMap = Object.fromEntries(bubbles.map(b => [b.id, b]))

  return (
    <div className="w-full select-none">
      <p className="text-xs text-gray-500 mb-2 text-center">Drag rooms to arrange your layout</p>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${VP_W} ${VP_H}`}
        style={{ cursor: dragRef.current ? 'grabbing' : 'default', touchAction: 'none' }}>
        <rect width={VP_W} height={VP_H} fill="#111" rx="8"/>

        {/* Connection lines */}
        {CONNECTIONS.map(([a, b]) => {
          const ba = posMap[a], bb = posMap[b]
          if (!ba || !bb) return null
          return <line key={`${a}-${b}`} x1={ba.x} y1={ba.y} x2={bb.x} y2={bb.y}
            stroke="#333" strokeWidth="14" strokeLinecap="round"/>
        })}

        {/* Bubbles */}
        {bubbles.map(b => {
          const st = TYPE_STYLE[b.type]
          const lines = b.label.split(' ')
          return (
            <g key={b.id} onMouseDown={e => onMouseDown(b.id, e)}
              onTouchStart={e => onTouchStart(b.id, e)}
              style={{ cursor: 'grab' }}>
              <ellipse cx={b.x} cy={b.y} rx={b.r} ry={b.r * 0.85}
                fill={st.fill} stroke={st.stroke} strokeWidth="1.5" strokeDasharray="5,3"/>
              <text x={b.x} y={b.y - (lines.length - 1) * 5.5} textAnchor="middle"
                fontSize="9" fontWeight="600" fontFamily="system-ui,sans-serif" fill="#2A2A2A" dominantBaseline="middle">
                {lines.map((ln, i) => (
                  <tspan key={i} x={b.x} dy={i === 0 ? 0 : 11}>{ln}</tspan>
                ))}
              </text>
            </g>
          )
        })}

        {/* North arrow */}
        <g transform={`translate(${VP_W - 24},20)`}>
          <circle r="10" fill="none" stroke="#555" strokeWidth="0.8"/>
          <polygon points="0,-7 -2.5,2 0,0.5 2.5,2" fill="#C4A35A"/>
          <text y="18" textAnchor="middle" fontSize="7" fontFamily="system-ui" fill="#666">N</text>
        </g>

        <text x={VP_W / 2} y={VP_H - 6} textAnchor="middle"
          fontSize="6" fontFamily="system-ui" fill="#333" letterSpacing="1.5">BARNHAUS STEEL BUILDERS</text>
      </svg>

      <button onClick={handleGenerate} disabled={generating}
        className="mt-3 w-full py-3 bg-[#C4A35A] text-black font-semibold rounded-lg hover:bg-[#D4B36A] disabled:opacity-50 disabled:cursor-wait transition-colors text-sm">
        {generating ? 'Generating Zone Map...' : 'Generate Zone Map →'}
      </button>
    </div>
  )
}
