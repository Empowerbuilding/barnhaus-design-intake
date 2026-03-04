import { DesignState, FloorPlanLayout } from './design-types'

const VP_W = 500
const VP_H = 380

export function generateLayout(state: DesignState): FloorPlanLayout {
  return { rooms: [], footprintWidth: state.sqft ? Math.sqrt((state.sqft || 2500) / 1.6) * 1.6 : 50,
    footprintDepth: Math.sqrt((state.sqft || 2500) / 1.6), totalSqft: state.sqft || 2500,
    viewportWidth: VP_W, viewportHeight: VP_H, scale: 1 }
}

// ── Zone bubble diagram (like Michael's hand-drawn circles) ──────────────────

interface Zone {
  id: string
  label: string
  sub?: string
  cx: number; cy: number; rx: number; ry: number
  fill: string; stroke: string
}

function buildZones(state: DesignState): Zone[] {
  const sqft   = state.sqft || 2500
  const beds   = state.bedrooms || 3
  const shape  = state.shape || 'rectangle'
  const garage = state.garageCount || 'none'
  const attach = state.garageAttachment || 'attached_left'
  const prios  = state.priorities || []
  const feats  = state.features || {}
  const masterPrivacy = prios[0] === 'master_privacy' || prios[1] === 'master_privacy'
  const openLiving    = prios[0] === 'open_living'    || prios[1] === 'open_living'

  // Scale all bubbles relative to sqft
  const s = Math.sqrt(sqft / 2500)

  // Center of canvas with room for labels
  const cx = VP_W * 0.46
  const cy = VP_H * 0.50

  // Core sizes
  const livingR  = { rx: 80 * s, ry: 56 * s }
  const masterR  = { rx: 58 * s, ry: 42 * s }
  const bedsR    = { rx: 54 * s, ry: 38 * s }
  const kitchenR = { rx: 50 * s, ry: 36 * s }
  const garageR  = { rx: 44,     ry: 32 }

  const zones: Zone[] = []

  // ── Shape influences layout ──────────────────────────────────────────────
  // Rectangle / default: linear left→right
  // L-shape: L arrangement
  // U-shape: U arrangement (master top-right, beds top-left, living center)
  // Courtyard: ring arrangement

  const isU  = shape === 'u-shape'
  const isL  = shape === 'l-shape'
  const isCY = shape === 'courtyard'

  // Living / Great Room — always central-ish
  const livingCX = isCY ? cx : isU ? cx : cx - 10 * s
  const livingCY = isCY ? cy - 10 : isU ? cy + 20 * s : cy

  zones.push({ id: 'living', label: openLiving ? 'Great Room' : 'Living',
    sub: openLiving ? '+ Kitchen' : undefined,
    cx: livingCX, cy: livingCY, ...livingR,
    fill: '#F5EDD6', stroke: '#C4A35A' })

  // Kitchen — adjacent to living, slightly offset
  if (!openLiving) {
    zones.push({ id: 'kitchen', label: 'Kitchen',
      cx: livingCX - livingR.rx * 0.85, cy: livingCY + livingR.ry * 0.65,
      rx: kitchenR.rx, ry: kitchenR.ry,
      fill: '#EDE8DC', stroke: '#B89B56' })
  }

  // Master suite — private end
  const masterCX = masterPrivacy
    ? (isU ? cx + 80 * s : isL ? cx + 95 * s : cx + 95 * s)
    : (isU ? cx + 80 * s : cx + 90 * s)
  const masterCY = isU ? cy - 55 * s : isL ? cy - 30 * s : cy - 10 * s

  zones.push({ id: 'master', label: 'Master Suite',
    cx: masterCX, cy: masterCY, ...masterR,
    fill: '#EBE4D8', stroke: '#A08848' })

  // Bedrooms — clustered opposite master
  const bedsCX = isU ? cx - 75 * s : isL ? cx - 80 * s : cx - 85 * s
  const bedsCY = isU ? cy - 55 * s : isL ? cy + 30 * s : cy + 30 * s
  const bedsLabel = beds > 3 ? `${beds - 1} Bedrooms` : beds > 2 ? '2 Bedrooms' : 'Bedroom'

  zones.push({ id: 'beds', label: bedsLabel,
    cx: bedsCX, cy: bedsCY, ...bedsR,
    fill: '#E8E4DC', stroke: '#9A9080' })

  // Garage
  if (garage !== 'none') {
    const carLabel = garage === '3-car' ? '3-Car Garage' : garage === '2-car' ? '2-Car Garage' : '1-Car Garage'
    const gx = attach === 'attached_right'
      ? livingCX + livingR.rx + garageR.rx * 0.7
      : livingCX - livingR.rx - garageR.rx * 0.7
    zones.push({ id: 'garage', label: carLabel,
      cx: gx, cy: livingCY + 20,
      ...garageR, fill: '#E0E0DC', stroke: '#888880' })
  }

  // Porch
  if (feats.covered_front_porch) {
    zones.push({ id: 'porch', label: 'Front Porch',
      cx: livingCX, cy: livingCY + livingR.ry + 26,
      rx: 55, ry: 20, fill: '#E8EDDF', stroke: '#7A9060' })
  }
  if (feats.covered_back_porch) {
    zones.push({ id: 'backporch', label: 'Back Porch',
      cx: livingCX, cy: livingCY - livingR.ry - 26,
      rx: 50, ry: 18, fill: '#E8EDDF', stroke: '#7A9060' })
  }

  // Utility / Service zone (small, tucked near bedrooms)
  zones.push({ id: 'service', label: 'Utility',
    cx: (bedsCX + livingCX) / 2, cy: bedsCY + bedsR.ry * 0.8,
    rx: 28, ry: 20, fill: '#DDDBD8', stroke: '#888' })

  return zones
}

// Draw connection lines between adjacent zones (bubble diagram style)
function connectionLine(a: Zone, b: Zone, opacity: number): string {
  return `<line x1="${a.cx.toFixed(1)}" y1="${a.cy.toFixed(1)}"
    x2="${b.cx.toFixed(1)}" y2="${b.cy.toFixed(1)}"
    stroke="#CCC" stroke-width="12" stroke-linecap="round" opacity="${opacity}"/>`
}

export function renderSVG(state: DesignState): string {
  // Nothing until sqft is chosen
  if (!state.sqft) return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${VP_W} ${VP_H}">
    <rect width="${VP_W}" height="${VP_H}" fill="#111" rx="8"/>
    <text x="${VP_W/2}" y="${VP_H/2 - 10}" text-anchor="middle" font-size="13" font-family="system-ui" fill="#555">Your zone diagram will appear</text>
    <text x="${VP_W/2}" y="${VP_H/2 + 10}" text-anchor="middle" font-size="13" font-family="system-ui" fill="#555">as you design your home.</text>
  </svg>`

  const zones = buildZones(state)

  // Connection lines (drawn first, behind bubbles)
  const living  = zones.find(z => z.id === 'living')
  const master  = zones.find(z => z.id === 'master')
  const beds    = zones.find(z => z.id === 'beds')
  const kitchen = zones.find(z => z.id === 'kitchen')
  const garage  = zones.find(z => z.id === 'garage')
  const service = zones.find(z => z.id === 'service')

  const lines = [
    living && master  ? connectionLine(living, master, 0.5)  : '',
    living && beds    ? connectionLine(living, beds, 0.5)    : '',
    living && kitchen ? connectionLine(living, kitchen, 0.6) : '',
    living && garage  ? connectionLine(living, garage, 0.4)  : '',
    beds   && service ? connectionLine(beds, service, 0.4)   : '',
  ].filter(Boolean).join('\n')

  // Bubbles
  const bubbles = zones.map(z => {
    const labelLines = z.label.split(' ')
    const lineH = 11
    const totalH = (labelLines.length + (z.sub ? 1 : 0)) * lineH
    const startY = z.cy - totalH / 2 + lineH / 2

    const textLines = [
      ...labelLines.map((ln, i) =>
        `<tspan x="${z.cx.toFixed(1)}" dy="${i === 0 ? 0 : lineH}">${ln}</tspan>`),
      ...(z.sub ? [`<tspan x="${z.cx.toFixed(1)}" dy="${lineH}" font-size="8" fill="#888">${z.sub}</tspan>`] : [])
    ].join('')

    return `<ellipse cx="${z.cx.toFixed(1)}" cy="${z.cy.toFixed(1)}" rx="${z.rx.toFixed(1)}" ry="${z.ry.toFixed(1)}"
      fill="${z.fill}" stroke="${z.stroke}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.92"/>
    <text x="${z.cx.toFixed(1)}" y="${(startY).toFixed(1)}" text-anchor="middle"
      font-size="9.5" font-weight="600" font-family="system-ui,sans-serif" fill="#2A2A2A" dominant-baseline="middle">
      ${textLines}
    </text>`
  }).join('\n')

  // Compass rose (small, top right)
  const nc = `<g transform="translate(${VP_W - 28}, 26)">
    <circle r="11" fill="none" stroke="#555" stroke-width="0.8"/>
    <polygon points="0,-8 -2.5,3 0,1 2.5,3" fill="#C4A35A"/>
    <text y="20" text-anchor="middle" font-size="7" font-family="system-ui" fill="#666">N</text>
  </g>`

  // Sqft label
  const bedsInfo = state.bedrooms || ''
  const bathsInfo = state.bathrooms || ''
  const info = state.sqft
    ? `${state.sqft.toLocaleString()} SF${bedsInfo ? ' · ' + bedsInfo + ' bed' : ''}${bathsInfo ? ' · ' + bathsInfo + ' bath' : ''}`
    : ''
  const infoLabel = info ? `<text x="${VP_W/2}" y="${VP_H - 10}" text-anchor="middle"
    font-size="8" font-family="system-ui" fill="#666" letter-spacing="1">${info}</text>` : ''

  const watermark = `<text x="12" y="${VP_H - 10}"
    font-size="6" font-family="system-ui" fill="#333" letter-spacing="1">BARNHAUS STEEL BUILDERS</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${VP_W} ${VP_H}">
  <rect width="${VP_W}" height="${VP_H}" fill="#111" rx="8"/>
  ${lines}
  ${bubbles}
  ${nc}
  ${infoLabel}
  ${watermark}
</svg>`
}
