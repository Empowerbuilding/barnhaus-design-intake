import { DesignState, FloorPlanLayout, Room } from './design-types'

const VP_W = 500
const VP_H = 400
const PADDING = 40

type RoomDef = { id: string; label: string; sqft: number; type: Room['type'] }

function getRoomColor(type: Room['type']): string {
  switch (type) {
    case 'master': return '#F0EDE8'
    case 'bath': return '#E8EDF0'
    case 'garage': return '#EAEAEA'
    case 'porch': return '#EAF0E8'
    case 'kitchen': return '#F5F0E8'
    default: return '#F5F5F0'
  }
}

function buildRoomList(state: DesignState): RoomDef[] {
  const sqft = state.sqft || 2500
  const beds = state.bedrooms || 3
  const baths = state.bathrooms || 2
  const priorities = state.priorities || []
  const features = state.features || {}
  const garage = state.garageCount || 'none'

  const openLiving = priorities[0] === 'open_living' || priorities[1] === 'open_living'
  const rooms: RoomDef[] = []

  // Living area
  const livingArea = sqft * (openLiving ? 0.28 : 0.20)
  rooms.push({ id: 'great_room', label: 'Great Room', sqft: livingArea, type: 'living' })

  if (!openLiving) {
    rooms.push({ id: 'dining', label: 'Dining', sqft: sqft * 0.08, type: 'dining' })
  }

  rooms.push({ id: 'kitchen', label: 'Kitchen', sqft: sqft * 0.10, type: 'kitchen' })

  // Master suite
  const masterSqft = sqft * 0.14
  rooms.push({ id: 'master_bed', label: 'Master Bed', sqft: masterSqft * 0.65, type: 'master' })
  rooms.push({ id: 'master_bath', label: 'Master Bath', sqft: masterSqft * 0.20, type: 'bath' })
  rooms.push({ id: 'master_closet', label: 'W.I.C.', sqft: masterSqft * 0.15, type: 'closet' })

  // Secondary bedrooms
  const secBedSqft = (sqft * 0.09)
  for (let i = 2; i <= beds; i++) {
    rooms.push({ id: `bed_${i}`, label: `Bed ${i}`, sqft: secBedSqft, type: 'bedroom' })
  }

  // Bathrooms
  const bathSqft = 60
  for (let i = 1; i < baths; i++) {
    rooms.push({ id: `bath_${i + 1}`, label: `Bath ${i + 1}`, sqft: bathSqft, type: 'bath' })
  }

  // Utility
  rooms.push({ id: 'laundry', label: 'Laundry', sqft: 80, type: 'laundry' })

  // Features
  if (features.home_office || priorities[4] === 'home_office' || priorities[3] === 'home_office') {
    rooms.push({ id: 'office', label: 'Office', sqft: 140, type: 'office' })
  }
  if (features.covered_back_porch) {
    rooms.push({ id: 'back_porch', label: 'Covered Porch', sqft: 200, type: 'porch' })
  }
  if (features.covered_front_porch) {
    rooms.push({ id: 'front_porch', label: 'Front Porch', sqft: 150, type: 'porch' })
  }

  // Garage
  if (garage !== 'none') {
    const garSqft = garage === '3-car' ? 840 : garage === '2-car' ? 576 : 288
    rooms.push({ id: 'garage', label: 'Garage', sqft: garSqft, type: 'garage' })
  }

  return rooms
}

function getFootprint(shape: string | undefined, sqft: number, garage: string): { w: number; d: number } {
  const ratio = 1.6
  const base = Math.sqrt(sqft / ratio)
  const w = base * ratio
  const d = base
  switch (shape) {
    case 'l-shape': return { w: w * 0.85, d: d * 1.1 }
    case 't-shape': return { w: w * 0.95, d: d * 1.15 }
    case 'u-shape': return { w: w * 0.9, d: d * 1.2 }
    case 'courtyard': return { w: w, d: d * 1.1 }
    default: return { w, d }
  }
}

function layoutRooms(state: DesignState, rooms: RoomDef[], fp: { w: number; d: number }, scale: number): Room[] {
  const street = state.streetFacing || 'S'
  const priorities = state.priorities || []
  const shape = state.shape || 'rectangle'
  const garage = state.garageCount || 'none'
  const gAttach = state.garageAttachment || 'attached_left'

  const garageW = garage === '3-car' ? 36 : garage === '2-car' ? 24 : 14
  const garageD = 22

  const placed: Room[] = []
  const px = PADDING
  const py = PADDING
  const mainW = fp.w
  const mainD = fp.d

  // Determine which side is "back" (private) based on street
  const streetIsTop = street === 'N'
  const publicY = streetIsTop ? py : py + mainD * scale - mainD * scale * 0.4
  const privateY = streetIsTop ? py + mainD * scale * 0.55 : py

  let col1X = px
  let col2X = px + mainW * scale * 0.45
  let col3X = px + mainW * scale * 0.75

  const masterPriority = priorities.indexOf('master_privacy')
  const masterAtFar = masterPriority <= 1

  // Place rooms in zones
  let publicCursor = { x: col1X, y: publicY }
  let privateCursor = { x: col1X, y: privateY }
  let masterCursor = { x: masterAtFar ? col3X : col2X, y: privateY }
  let serviceCursor = { x: px, y: py + mainD * scale * 0.7 }

  for (const r of rooms) {
    const rw = Math.sqrt(r.sqft * 1.4) * scale
    const rh = (r.sqft / Math.sqrt(r.sqft * 1.4)) * scale

    if (r.type === 'garage') {
      const gx = gAttach === 'attached_right' ? px + mainW * scale + 4 : px - garageW * scale - 4
      placed.push({ ...r, x: gx, y: py, width: garageW * scale, height: garageD * scale })
      continue
    }

    if (r.type === 'porch') {
      const porchY = r.id === 'front_porch'
        ? (streetIsTop ? py - rh - 2 : py + mainD * scale + 2)
        : (streetIsTop ? py + mainD * scale + 2 : py - rh - 2)
      placed.push({ ...r, x: px + mainW * scale * 0.2, y: porchY, width: mainW * scale * 0.5, height: rh })
      continue
    }

    if (r.type === 'master' || r.id === 'master_bath' || r.id === 'master_closet') {
      placed.push({ ...r, x: masterCursor.x, y: masterCursor.y, width: rw, height: rh })
      masterCursor.y += rh + 2
      continue
    }

    if (r.type === 'living' || r.type === 'kitchen' || r.type === 'dining') {
      placed.push({ ...r, x: publicCursor.x, y: publicCursor.y, width: rw, height: rh })
      publicCursor.x += rw + 2
      if (publicCursor.x > px + mainW * scale * 0.7) {
        publicCursor.x = col1X
        publicCursor.y += rh + 2
      }
      continue
    }

    if (r.type === 'bedroom') {
      placed.push({ ...r, x: privateCursor.x, y: privateCursor.y, width: rw, height: rh })
      privateCursor.x += rw + 2
      if (privateCursor.x > px + mainW * scale * 0.65) {
        privateCursor.x = col1X
        privateCursor.y += rh + 2
      }
      continue
    }

    // bath, laundry, office, other
    placed.push({ ...r, x: serviceCursor.x, y: serviceCursor.y, width: Math.max(rw, 40), height: Math.max(rh, 30) })
    serviceCursor.x += Math.max(rw, 40) + 2
    if (serviceCursor.x > px + mainW * scale * 0.8) {
      serviceCursor.x = px
      serviceCursor.y += Math.max(rh, 30) + 2
    }
  }

  return placed
}

export function generateLayout(state: DesignState): FloorPlanLayout {
  const sqft = state.sqft || 2500
  const shape = state.shape
  const garage = state.garageCount || 'none'

  const fp = getFootprint(shape, sqft, garage)

  // Scale to fit viewport
  const garageExtra = garage !== 'none' ? 28 : 0
  const availW = VP_W - PADDING * 2 - garageExtra
  const availH = VP_H - PADDING * 2
  const scale = Math.min(availW / fp.w, availH / fp.d)

  const rooms = buildRoomList(state)
  const placedRooms = layoutRooms(state, rooms, fp, scale)

  return {
    rooms: placedRooms,
    footprintWidth: fp.w,
    footprintDepth: fp.d,
    totalSqft: sqft,
    viewportWidth: VP_W,
    viewportHeight: VP_H,
    scale,
  }
}

export function renderSVG(state: DesignState): string {
  const layout = generateLayout(state)
  const { rooms, footprintWidth, footprintDepth, scale } = layout
  const px = PADDING
  const py = PADDING
  const fpW = footprintWidth * scale
  const fpH = footprintDepth * scale

  const roomsSVG = rooms.map(r => {
    const color = getRoomColor(r.type)
    const labelLines = r.label.split(' ')
    const sqftLabel = `${Math.round(r.sqft)} sf`
    const cy = r.y + r.height / 2
    const linesHTML = labelLines.map((ln, i) =>
      `<tspan x="${r.x + r.width / 2}" dy="${i === 0 ? -8 : 13}">${ln}</tspan>`
    ).join('')

    return `
    <rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.width.toFixed(1)}" height="${r.height.toFixed(1)}"
      fill="${color}" stroke="#333" stroke-width="1.2" rx="1"/>
    <text x="${(r.x + r.width / 2).toFixed(1)}" y="${cy.toFixed(1)}"
      text-anchor="middle" font-size="8" font-family="system-ui,sans-serif" fill="#333">
      ${linesHTML}
      <tspan x="${r.x + r.width / 2}" dy="13" font-size="7" fill="#666">${sqftLabel}</tspan>
    </text>`
  }).join('\n')

  // Exterior outline
  const outlinePath = getOutlinePath(state, px, py, fpW, fpH)

  // North arrow
  const northArrow = `
    <g transform="translate(${VP_W - 30}, 20)">
      <circle cx="0" cy="0" r="10" fill="none" stroke="#666" stroke-width="1"/>
      <polygon points="0,-8 -4,4 0,1 4,4" fill="#333"/>
      <text x="0" y="16" text-anchor="middle" font-size="8" font-family="system-ui" fill="#666">N</text>
    </g>`

  // Watermark
  const watermark = `<text x="${VP_W / 2}" y="${VP_H - 6}" text-anchor="middle"
    font-size="7" font-family="system-ui" fill="#CCC" letter-spacing="1">BARNHAUS STEEL BUILDERS</text>`

  // Dimensions
  const dimW = `<text x="${px + fpW / 2}" y="${py - 8}" text-anchor="middle"
    font-size="8" font-family="system-ui" fill="#666">${(footprintWidth).toFixed(0)}'</text>`
  const dimD = `<text x="${px - 8}" y="${py + fpH / 2}" text-anchor="middle"
    font-size="8" font-family="system-ui" fill="#666" transform="rotate(-90,${px - 8},${py + fpH / 2})">${(footprintDepth).toFixed(0)}'</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VP_W}" height="${VP_H}" viewBox="0 0 ${VP_W} ${VP_H}">
  <rect width="${VP_W}" height="${VP_H}" fill="#FAFAF8"/>
  ${outlinePath}
  ${roomsSVG}
  ${northArrow}
  ${dimW}
  ${dimD}
  ${watermark}
</svg>`
}

function getOutlinePath(state: DesignState, px: number, py: number, fpW: number, fpH: number): string {
  const shape = state.shape || 'rectangle'
  let d = ''
  switch (shape) {
    case 'l-shape':
      d = `M${px},${py} L${px + fpW},${py} L${px + fpW},${py + fpH * 0.55}
           L${px + fpW * 0.55},${py + fpH * 0.55} L${px + fpW * 0.55},${py + fpH}
           L${px},${py + fpH} Z`
      break
    case 't-shape':
      d = `M${px + fpW * 0.2},${py} L${px + fpW * 0.8},${py}
           L${px + fpW * 0.8},${py + fpH * 0.45} L${px + fpW},${py + fpH * 0.45}
           L${px + fpW},${py + fpH} L${px},${py + fpH}
           L${px},${py + fpH * 0.45} L${px + fpW * 0.2},${py + fpH * 0.45} Z`
      break
    case 'u-shape':
      d = `M${px},${py} L${px + fpW},${py} L${px + fpW},${py + fpH}
           L${px + fpW * 0.7},${py + fpH} L${px + fpW * 0.7},${py + fpH * 0.45}
           L${px + fpW * 0.3},${py + fpH * 0.45} L${px + fpW * 0.3},${py + fpH}
           L${px},${py + fpH} Z`
      break
    case 'courtyard':
      d = `M${px},${py} L${px + fpW},${py} L${px + fpW},${py + fpH}
           L${px},${py + fpH} Z
           M${px + fpW * 0.25},${py + fpH * 0.3}
           L${px + fpW * 0.75},${py + fpH * 0.3}
           L${px + fpW * 0.75},${py + fpH * 0.75}
           L${px + fpW * 0.25},${py + fpH * 0.75} Z`
      break
    default:
      d = `M${px},${py} L${px + fpW},${py} L${px + fpW},${py + fpH} L${px},${py + fpH} Z`
  }
  const fillRule = shape === 'courtyard' ? 'evenodd' : 'nonzero'
  return `<path d="${d}" fill="none" stroke="#222" stroke-width="2.5" fill-rule="${fillRule}"/>`
}
