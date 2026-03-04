import { DesignState, FloorPlanLayout, Room } from './design-types'

const VP_W = 500
const VP_H = 380
const PAD = 36

function roomColor(type: Room['type']): string {
  const colors: Partial<Record<Room['type'], string>> = {
    master: '#EDE8E0', bath: '#E4ECF0', garage: '#E8E8E8',
    porch: '#E8F0E4', kitchen: '#F0EBE0', closet: '#F0EDE8',
  }
  return colors[type] || '#F4F4F0'
}

// Scale footprint to fit viewport, return scale factor
function calcScale(fw: number, fd: number, garageW: number): number {
  const availW = VP_W - PAD * 2 - garageW
  const availH = VP_H - PAD * 2
  return Math.min(availW / fw, availH / fd)
}

// Get outer footprint dimensions in feet based on sqft + shape
function footprint(sqft: number, shape: string): { w: number; d: number } {
  const ratio = 1.65
  const base = Math.sqrt(sqft / ratio)
  const w = base * ratio, d = base
  switch (shape) {
    case 'l-shape':   return { w: w * 0.82, d: d * 1.1 }
    case 't-shape':   return { w: w * 0.92, d: d * 1.15 }
    case 'u-shape':   return { w: w * 0.88, d: d * 1.2 }
    case 'courtyard': return { w: w * 0.95, d: d * 1.1 }
    default:          return { w, d }
  }
}

// Build a clean grid-based room layout that stays inside the footprint
function buildLayout(state: DesignState): Room[] {
  const sqft    = state.sqft    || 2500
  const beds    = state.bedrooms || 3
  const baths   = state.bathrooms || 2
  const shape   = state.shape   || 'rectangle'
  const garage  = state.garageCount || 'none'
  const attach  = state.garageAttachment || 'attached_left'
  const feats   = state.features || {}
  const prios   = state.priorities || []

  const openLiving = prios[0] === 'open_living' || prios[1] === 'open_living'
  const { w: FW, d: FD } = footprint(sqft, shape)
  const garageW = garage === '3-car' ? 36 : garage === '2-car' ? 24 : garage === '1-car' ? 14 : 0
  const garageD = 22
  const scale   = calcScale(FW, FD, garageW > 0 ? garageW + 2 : 0)

  const ox = PAD + (garage !== 'none' && attach === 'attached_left' ? garageW * scale + 4 : 0)
  const oy = PAD
  const W  = FW * scale
  const H  = FD * scale

  const rooms: Room[] = []

  // ── Zone splits (fractions of footprint) ──────────────────────────────────
  // Top row: public (living/kitchen) — left 65%
  // Top row: master suite — right 35%
  // Bottom row: bedrooms + service — full width

  const topH   = H * 0.52
  const btmH   = H - topH
  const pubW   = W * (openLiving ? 0.68 : 0.60)
  const masterW = W - pubW

  // Living area
  const livingH = openLiving ? topH : topH * 0.65
  rooms.push({ id: 'great_room', label: 'Great Room', sqft: Math.round((pubW / scale) * (livingH / scale)),
    x: ox, y: oy, width: pubW, height: livingH, type: 'living' })

  if (!openLiving) {
    const kitH = topH - livingH
    rooms.push({ id: 'kitchen', label: 'Kitchen', sqft: Math.round((pubW * 0.55 / scale) * (kitH / scale)),
      x: ox, y: oy + livingH, width: pubW * 0.55, height: kitH, type: 'kitchen' })
    rooms.push({ id: 'dining', label: 'Dining', sqft: Math.round((pubW * 0.45 / scale) * (kitH / scale)),
      x: ox + pubW * 0.55, y: oy + livingH, width: pubW * 0.45, height: kitH, type: 'dining' })
  } else {
    rooms.push({ id: 'kitchen', label: 'Kitchen', sqft: Math.round((pubW * 0.42 / scale) * (topH / scale)),
      x: ox, y: oy, width: pubW * 0.42, height: topH, type: 'kitchen' })
    rooms.push({ id: 'great_room', label: 'Great Room', sqft: Math.round((pubW * 0.58 / scale) * (topH / scale)),
      x: ox + pubW * 0.42, y: oy, width: pubW * 0.58, height: topH, type: 'living' })
  }

  // Master suite (top right)
  const mBedH  = topH * 0.60
  const mBathH = topH * 0.24
  const mClosH = topH - mBedH - mBathH
  rooms.push({ id: 'master_bed',    label: 'Master Bed',  sqft: Math.round((masterW / scale) * (mBedH / scale)),
    x: ox + pubW, y: oy,                  width: masterW, height: mBedH,  type: 'master' })
  rooms.push({ id: 'master_bath',   label: 'Master Bath', sqft: Math.round((masterW / scale) * (mBathH / scale)),
    x: ox + pubW, y: oy + mBedH,          width: masterW, height: mBathH, type: 'bath' })
  rooms.push({ id: 'master_closet', label: 'W.I.C.',      sqft: Math.round((masterW / scale) * (mClosH / scale)),
    x: ox + pubW, y: oy + mBedH + mBathH, width: masterW, height: mClosH, type: 'closet' })

  // Bottom row: secondary beds + service
  const secBedCount = Math.max(0, beds - 1)
  const serviceW = W * 0.22
  const bedsW    = W - serviceW
  const bedW     = secBedCount > 0 ? bedsW / secBedCount : bedsW

  for (let i = 0; i < secBedCount; i++) {
    rooms.push({ id: `bed_${i + 2}`, label: `Bed ${i + 2}`, sqft: Math.round((bedW / scale) * (btmH / scale)),
      x: ox + i * bedW, y: oy + topH, width: bedW, height: btmH, type: 'bedroom' })
  }

  // Service zone (bottom right)
  const svcX = ox + bedsW
  const bathCount = Math.max(1, Math.floor(baths) - 1)
  const bathH = btmH / (bathCount + 1)
  for (let i = 0; i < bathCount; i++) {
    rooms.push({ id: `bath_${i + 2}`, label: `Bath ${i + 2}`, sqft: Math.round((serviceW / scale) * (bathH / scale)),
      x: svcX, y: oy + topH + i * bathH, width: serviceW, height: bathH, type: 'bath' })
  }
  rooms.push({ id: 'laundry', label: 'Laundry', sqft: Math.round((serviceW / scale) * (bathH / scale)),
    x: svcX, y: oy + topH + bathCount * bathH, width: serviceW, height: bathH, type: 'laundry' })

  // Porches
  if (feats.covered_front_porch) {
    const ph = 14 * scale
    rooms.push({ id: 'front_porch', label: 'Front Porch', sqft: Math.round((W * 0.45 / scale) * 14),
      x: ox + W * 0.15, y: oy - ph - 2, width: W * 0.45, height: ph, type: 'porch' })
  }
  if (feats.covered_back_porch) {
    const ph = 12 * scale
    rooms.push({ id: 'back_porch', label: 'Covered Porch', sqft: Math.round((W * 0.5 / scale) * 12),
      x: ox + W * 0.2, y: oy + H + 2, width: W * 0.5, height: ph, type: 'porch' })
  }

  // Garage
  if (garage !== 'none') {
    const gx = attach === 'attached_right' ? ox + W + 2 : ox - garageW * scale - 2
    rooms.push({ id: 'garage', label: 'Garage', sqft: Math.round(garageW * garageD),
      x: gx, y: oy, width: garageW * scale, height: garageD * scale, type: 'garage' })
  }

  return rooms
}

export function generateLayout(state: DesignState): FloorPlanLayout {
  const sqft  = state.sqft || 2500
  const shape = state.shape || 'rectangle'
  const garage = state.garageCount || 'none'
  const garageW = garage === '3-car' ? 36 : garage === '2-car' ? 24 : garage === '1-car' ? 14 : 0
  const fp    = footprint(sqft, shape)
  const scale = calcScale(fp.w, fp.d, garageW > 0 ? garageW + 2 : 0)
  const rooms = buildLayout(state)
  return { rooms, footprintWidth: fp.w, footprintDepth: fp.d, totalSqft: sqft, viewportWidth: VP_W, viewportHeight: VP_H, scale }
}

export function renderSVG(state: DesignState): string {
  // Don't render until at least size is chosen (step >= 2 with values)
  if (!state.sqft && !state.shape) return ''

  const sqft  = state.sqft || 2500
  const shape = state.shape || 'rectangle'
  const garage = state.garageCount || 'none'
  const attach = state.garageAttachment || 'attached_left'
  const garageW = garage === '3-car' ? 36 : garage === '2-car' ? 24 : garage === '1-car' ? 14 : 0
  const fp    = footprint(sqft, shape)
  const scale = calcScale(fp.w, fp.d, garageW > 0 ? garageW + 2 : 0)

  const ox = PAD + (garage !== 'none' && attach === 'attached_left' ? garageW * scale + 4 : 0)
  const oy = PAD
  const W  = fp.w * scale
  const H  = fp.d * scale

  // Only show rooms if we have enough info (step 3+)
  const showRooms = !!(state.bedrooms && state.shape)
  const rooms = showRooms ? buildLayout(state) : []

  const roomsSVG = rooms.map(r => {
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    const lines = r.label.split(' ')
    const tspans = lines.map((ln, i) =>
      `<tspan x="${cx.toFixed(1)}" dy="${i === 0 ? -(lines.length - 1) * 5 : 10}">${ln}</tspan>`
    ).join('')

    return `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.width.toFixed(1)}" height="${r.height.toFixed(1)}"
      fill="${roomColor(r.type)}" stroke="#555" stroke-width="0.8" rx="1"/>
    <text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="middle"
      font-size="7.5" font-family="system-ui,sans-serif" fill="#333" dominant-baseline="middle">
      ${tspans}
      <tspan x="${cx.toFixed(1)}" dy="11" font-size="6.5" fill="#888">${r.sqft} sf</tspan>
    </text>`
  }).join('\n')

  // Exterior outline path
  const outlinePath = shapeOutline(shape, ox, oy, W, H)

  // Dimensions
  const dimW = `<line x1="${ox}" y1="${oy - 10}" x2="${ox + W}" y2="${oy - 10}" stroke="#999" stroke-width="0.7"/>
    <text x="${ox + W / 2}" y="${oy - 14}" text-anchor="middle" font-size="8" font-family="system-ui" fill="#888">${fp.w.toFixed(0)}'</text>`
  const dimD = `<line x1="${ox - 10}" y1="${oy}" x2="${ox - 10}" y2="${oy + H}" stroke="#999" stroke-width="0.7"/>
    <text x="${ox - 14}" y="${oy + H / 2}" text-anchor="middle" font-size="8" font-family="system-ui" fill="#888"
      transform="rotate(-90 ${ox - 14} ${oy + H / 2})">${fp.d.toFixed(0)}'</text>`

  // North arrow
  const northArrow = `<g transform="translate(${VP_W - 24},22)">
    <circle cx="0" cy="0" r="9" fill="none" stroke="#AAA" stroke-width="0.8"/>
    <polygon points="0,-7 -3,3 0,1 3,3" fill="#555"/>
    <text x="0" y="15" text-anchor="middle" font-size="7" font-family="system-ui" fill="#999">N</text>
  </g>`

  const watermark = `<text x="${VP_W / 2}" y="${VP_H - 4}" text-anchor="middle"
    font-size="6.5" font-family="system-ui" fill="#CCC" letter-spacing="1.5">BARNHAUS STEEL BUILDERS</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${VP_W} ${VP_H}">
  <rect width="${VP_W}" height="${VP_H}" fill="#FAFAF8"/>
  ${outlinePath}
  ${roomsSVG}
  ${dimW}
  ${dimD}
  ${northArrow}
  ${watermark}
</svg>`
}

function shapeOutline(shape: string, ox: number, oy: number, W: number, H: number): string {
  let d: string
  switch (shape) {
    case 'l-shape':
      d = `M${ox},${oy} L${ox+W},${oy} L${ox+W},${oy+H*0.52} L${ox+W*0.58},${oy+H*0.52} L${ox+W*0.58},${oy+H} L${ox},${oy+H} Z`
      break
    case 't-shape':
      d = `M${ox+W*0.18},${oy} L${ox+W*0.82},${oy} L${ox+W*0.82},${oy+H*0.5} L${ox+W},${oy+H*0.5} L${ox+W},${oy+H} L${ox},${oy+H} L${ox},${oy+H*0.5} L${ox+W*0.18},${oy+H*0.5} Z`
      break
    case 'u-shape':
      d = `M${ox},${oy} L${ox+W},${oy} L${ox+W},${oy+H} L${ox+W*0.72},${oy+H} L${ox+W*0.72},${oy+H*0.48} L${ox+W*0.28},${oy+H*0.48} L${ox+W*0.28},${oy+H} L${ox},${oy+H} Z`
      break
    case 'courtyard':
      d = `M${ox},${oy} L${ox+W},${oy} L${ox+W},${oy+H} L${ox},${oy+H} Z M${ox+W*0.22},${oy+H*0.28} L${ox+W*0.78},${oy+H*0.28} L${ox+W*0.78},${oy+H*0.72} L${ox+W*0.22},${oy+H*0.72} Z`
      break
    default:
      d = `M${ox},${oy} L${ox+W},${oy} L${ox+W},${oy+H} L${ox},${oy+H} Z`
  }
  const fr = shape === 'courtyard' ? 'evenodd' : 'nonzero'
  return `<path d="${d}" fill="${shape === 'courtyard' ? '#F4F4F0' : 'none'}" stroke="#222" stroke-width="2" fill-rule="${fr}"/>`
}
