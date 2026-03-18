'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { DesignState } from '@/lib/design-types'

const VP_W = 600
const VP_H = 420

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
  const beds = state.bedrooms || 3
  const baths = state.bathrooms || 2
  const garage = state.garageCount || 'none'
  const rooms = state.desiredRooms || []
  const porch = state.porchSelection || 'none'

  const list: Bubble[] = [
    { id: 'great_room', label: 'Great Room', r: 52, type: 'living', x: 300, y: 200 },
    { id: 'kitchen', label: 'Kitchen', r: 42, type: 'kitchen', x: 150, y: 200 },
    { id: 'dining', label: 'Dining', r: 34, type: 'kitchen', x: 150, y: 320 },
    { id: 'master_bed', label: 'Master Bed', r: 48, type: 'master', x: 480, y: 120 },
    { id: 'master_bath', label: 'Master Bath', r: 30, type: 'bath', x: 540, y: 220 },
    { id: 'wic', label: 'W.I.C.', r: 24, type: 'service', x: 520, y: 310 },
  ]

  // Laundry and utility from desired rooms
  if (rooms.includes('laundry')) {
    list.push({ id: 'laundry', label: 'Laundry', r: 22, type: 'service', x: 60, y: 300 })
  }
  if (rooms.includes('utility_room')) {
    list.push({ id: 'utility', label: 'Utility', r: 22, type: 'service', x: 55, y: 230 })
  }

  // Secondary bedrooms
  const bedStartX = [240, 320, 160, 400]
  const bedStartY = [50, 60, 55, 55]
  for (let i = 2; i <= beds; i++) {
    list.push({ id: `bed_${i}`, label: `Bed ${i}`, r: 38, type: 'bedroom',
      x: bedStartX[(i - 2) % bedStartX.length],
      y: bedStartY[(i - 2) % bedStartY.length] })
  }

  // Additional baths
  for (let i = 2; i <= Math.floor(baths); i++) {
    list.push({ id: `bath_${i}`, label: `Bath ${i}`, r: 24, type: 'bath',
      x: 300 + (i - 2) * 65, y: 310 })
  }

  // Garage
  if (garage !== 'none') {
    const label = garage === '3-car' ? '3-Car Garage' : garage === '2-car' ? '2-Car Garage' : 'Garage'
    list.push({ id: 'garage', label, r: 46, type: 'garage', x: 80, y: 200 })
  }

  // Porches
  const porchSF = state.porchSF || 400
  const pr = porchSF <= 200 ? 22 : porchSF <= 400 ? 30 : porchSF <= 700 ? 40 : 52
  if (porch === 'front' || porch === 'both') {
    list.push({ id: 'front_porch', label: 'Front Porch', r: pr, type: 'porch', x: 280, y: 390 })
  }
  if (porch === 'back' || porch === 'both') {
    list.push({ id: 'back_porch', label: 'Back Porch', r: pr, type: 'porch', x: 380, y: 390 })
  }

  // Other desired rooms
  if (rooms.includes('home_office')) list.push({ id: 'home_office', label: 'Home Office', r: 34, type: 'bedroom', x: 460, y: 310 })
  if (rooms.includes('butler_pantry')) list.push({ id: 'butler_pantry', label: 'Butler Pantry', r: 26, type: 'kitchen', x: 180, y: 130 })
  if (rooms.includes('mudroom')) list.push({ id: 'mudroom', label: 'Mudroom', r: 24, type: 'service', x: 75, y: 130 })
  if (rooms.includes('game_room')) list.push({ id: 'game_room', label: 'Game Room', r: 38, type: 'living', x: 300, y: 290 })
  if (rooms.includes('safe_room')) list.push({ id: 'safe_room', label: 'Safe Room', r: 22, type: 'service', x: 460, y: 100 })

  return list
}

interface Props {
  state: DesignState
  onBubblesChange: (bubbles: {id:string;label:string;x:number;y:number;r:number}[]) => void
}

export default function BubbleDiagram({ state, onBubblesChange }: Props) {
  const [bubbles, setBubbles] = useState<Bubble[]>(() => buildBubbles(state))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const resizeRef = useRef<{ id: string; cx: number; cy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const prevBeds = useRef(state.bedrooms)
  const prevBaths = useRef(state.bathrooms)
  const prevGarage = useRef(state.garageCount)
  const prevRooms = useRef(JSON.stringify(state.desiredRooms))
  const prevPorch = useRef(state.porchSelection)

  const onBubblesChangeRef = useRef(onBubblesChange)
  useEffect(() => { onBubblesChangeRef.current = onBubblesChange }, [onBubblesChange])

  // Merge new rooms while preserving existing positions + radii
  useEffect(() => {
    const roomsStr = JSON.stringify(state.desiredRooms)
    if (state.bedrooms !== prevBeds.current || state.bathrooms !== prevBaths.current ||
        state.garageCount !== prevGarage.current || roomsStr !== prevRooms.current ||
        state.porchSelection !== prevPorch.current) {
      prevBeds.current = state.bedrooms
      prevBaths.current = state.bathrooms
      prevGarage.current = state.garageCount
      prevRooms.current = roomsStr
      prevPorch.current = state.porchSelection
      const newTemplate = buildBubbles(state)
      setBubbles(prev => {
        const posMap = Object.fromEntries(prev.map(b => [b.id, { x: b.x, y: b.y, r: b.r }]))
        const newIds = new Set(newTemplate.map(b => b.id))
        return newTemplate.map(b => ({
          ...b,
          x: posMap[b.id]?.x ?? b.x,
          y: posMap[b.id]?.y ?? b.y,
          r: posMap[b.id]?.r ?? b.r,
        })).filter(b => newIds.has(b.id))
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bedrooms, state.bathrooms, state.garageCount, state.desiredRooms, state.porchSelection])

  // Report initial bubbles
  useEffect(() => {
    onBubblesChangeRef.current(bubbles.map(b => ({ id: b.id, label: b.label, x: b.x, y: b.y, r: b.r })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getSVGPoint = useCallback((e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const scaleX = VP_W / rect.width
    const scaleY = VP_H / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  const onBubbleDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(id)
    const pt = getSVGPoint(e.nativeEvent)
    const b = bubbles.find(b => b.id === id)!
    dragRef.current = { id, ox: pt.x - b.x, oy: pt.y - b.y }
  }

  const onBubbleTouchStart = (id: string, e: React.TouchEvent) => {
    e.stopPropagation()
    setSelectedId(id)
    const pt = getSVGPoint(e.touches[0])
    const b = bubbles.find(b => b.id === id)!
    dragRef.current = { id, ox: pt.x - b.x, oy: pt.y - b.y }
  }

  const onHandleDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const b = bubbles.find(b => b.id === id)!
    resizeRef.current = { id, cx: b.x, cy: b.y }
  }

  const onHandleTouchStart = (id: string, e: React.TouchEvent) => {
    e.stopPropagation()
    const b = bubbles.find(b => b.id === id)!
    resizeRef.current = { id, cx: b.x, cy: b.y }
  }

  const onMove = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = VP_W / rect.width
    const scaleY = VP_H / rect.height
    const svgX = (clientX - rect.left) * scaleX
    const svgY = (clientY - rect.top) * scaleY

    if (resizeRef.current) {
      const { id, cx, cy } = resizeRef.current
      const dx = Math.abs(svgX - cx)
      const dy = Math.abs(svgY - cy) / 0.85
      const newR = Math.max(15, Math.min(80, Math.max(dx, dy)))
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, r: Math.round(newR) } : b))
      return
    }

    const drag = dragRef.current
    if (!drag) return
    const x = Math.max(20, Math.min(VP_W - 20, svgX - drag.ox))
    const y = Math.max(20, Math.min(VP_H - 20, svgY - drag.oy))
    setBubbles(prev => prev.map(b => b.id === drag.id ? { ...b, x, y } : b))
  }, [])

  const onEnd = useCallback(() => {
    const wasActive = dragRef.current || resizeRef.current
    dragRef.current = null
    resizeRef.current = null
    if (wasActive) {
      setBubbles(prev => {
        onBubblesChangeRef.current(prev.map(b => ({ id: b.id, label: b.label, x: b.x, y: b.y, r: b.r })))
        return prev
      })
    }
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

  const onSvgClick = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'rect' && (e.target as SVGElement).getAttribute('width') === String(VP_W)) {
      setSelectedId(null)
    }
  }

  const posMap = Object.fromEntries(bubbles.map(b => [b.id, b]))

  return (
    <div className="w-full select-none">
      <p className="text-xs text-gray-400 mb-2 text-center">Drag to <span className="text-[#C4A35A]">move</span> · Drag corner dots to <span className="text-[#C4A35A]">resize</span></p>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${VP_W} ${VP_H}`}
        style={{ cursor: dragRef.current || resizeRef.current ? 'grabbing' : 'default', touchAction: 'none' }}
        onClick={onSvgClick}>
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
          const isSelected = selectedId === b.id
          const handleOffset = 0.707 // cos(45°)

          return (
            <g key={b.id}>
              {/* Bubble body */}
              <g onMouseDown={e => onBubbleDown(b.id, e)}
                onTouchStart={e => onBubbleTouchStart(b.id, e)}
                style={{ cursor: 'grab' }}>
                <ellipse cx={b.x} cy={b.y} rx={b.r} ry={b.r * 0.85}
                  fill={st.fill} stroke={isSelected ? '#C4A35A' : st.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5} strokeDasharray={isSelected ? 'none' : '5,3'}/>
                <text x={b.x} y={b.y - (lines.length - 1) * 5.5} textAnchor="middle"
                  fontSize="9" fontWeight="600" fontFamily="system-ui,sans-serif" fill="#2A2A2A" dominantBaseline="middle">
                  {lines.map((ln, i) => (
                    <tspan key={i} x={b.x} dy={i === 0 ? 0 : 11}>{ln}</tspan>
                  ))}
                </text>
              </g>

              {/* Resize handles — always visible, bigger when selected */}
              {[
                { dx: handleOffset, dy: -0.85 * handleOffset, cursor: 'nesw-resize' },
                { dx: -handleOffset, dy: -0.85 * handleOffset, cursor: 'nwse-resize' },
                { dx: handleOffset, dy: 0.85 * handleOffset, cursor: 'nwse-resize' },
                { dx: -handleOffset, dy: 0.85 * handleOffset, cursor: 'nesw-resize' },
              ].map((h, i) => (
                <circle key={i}
                  cx={b.x + b.r * h.dx}
                  cy={b.y + b.r * h.dy}
                  r={isSelected ? 5 : 3}
                  fill={isSelected ? '#C4A35A' : 'rgba(196,163,90,0.5)'}
                  stroke={isSelected ? '#000' : 'none'}
                  strokeWidth={0.5}
                  style={{ cursor: h.cursor }}
                  onMouseDown={e => onHandleDown(b.id, e)}
                  onTouchStart={e => onHandleTouchStart(b.id, e)}
                />
              ))}
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
    </div>
  )
}
