'use client'
import { Architecture, Shape } from '@/lib/design-types'

// Zones per house shape — matches Revit agent zone naming
const SHAPE_ZONES: Record<string, { key: string; label: string }[]> = {
  rectangle:     [{ key: 'main',           label: 'Main House' }],
  'l-shape':     [{ key: 'main_wing',      label: 'Main Wing' },
                  { key: 'secondary_wing', label: 'Secondary Wing' }],
  'u-shape':     [{ key: 'left_wing',      label: 'Left Wing' },
                  { key: 'center',         label: 'Center / Living' },
                  { key: 'right_wing',     label: 'Right Wing' }],
  't-shape':     [{ key: 'main_body',      label: 'Main Body' },
                  { key: 'rear_wing',      label: 'Rear Wing' }],
  'h-shape':     [{ key: 'left_wing',      label: 'Left Wing' },
                  { key: 'center_bridge',  label: 'Center Bridge' },
                  { key: 'right_wing',     label: 'Right Wing' }],
  courtyard:     [{ key: 'left_wing',      label: 'Left Wing' },
                  { key: 'center',         label: 'Center / Entry' },
                  { key: 'right_wing',     label: 'Right Wing' }],
}
const HEIGHT_OPTIONS = [9, 10, 11, 12, 14, 16]

const defaultHeight = (wallHeight?: Architecture['wall_height']) => {
  if (wallHeight === 'tall') return 11
  if (wallHeight === 'dramatic') return 12
  return 10
}

export default function StepArchitecture({
  value,
  shape,
  onChange,
}: {
  value: Architecture
  shape?: Shape
  onChange: (v: Architecture) => void
}) {
  const zones = shape ? SHAPE_ZONES[shape] : null
  const fallback = defaultHeight(value.wall_height)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Architecture Details</h2>
      <p className="text-gray-400 text-sm mb-6">Fine-tune the massing, heights, and materials.</p>

      {/* Wall Height — picks base AND auto-fills all zones */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-white mb-1">Wall Height</p>
        {zones && zones.length > 1 && (
          <p className="text-xs text-gray-500 mb-3">Sets all wings. Override individual wings below if you want varied heights.</p>
        )}
        <div className="grid grid-cols-3 gap-2 mb-0">
          {([['standard', '10 ft', 'Standard'], ['tall', '11 ft', 'Tall'], ['dramatic', '12 ft', 'Dramatic']] as const).map(([val, ft, label]) => {
            const h = val === 'standard' ? 10 : val === 'tall' ? 11 : 12
            return (
              <button key={val} onClick={() => {
                // Auto-fill all zone heights with the selected base height
                const newZoneHeights: Record<string, number> = {}
                if (zones) zones.forEach(z => { newZoneHeights[z.key] = h })
                onChange({ ...value, wall_height: val, zone_heights: newZoneHeights })
              }}
                className={`flex flex-col items-center px-3 py-3 rounded-lg border text-sm transition ${
                  value.wall_height === val
                    ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
                }`}>
                <span className="text-lg font-bold text-[#C4A35A]">{ft}</span>
                <span className="text-xs mt-0.5">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Per-Zone Override — only show if multi-zone shape */}
      {zones && zones.length > 1 && value.wall_height && (
        <div className="mb-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <p className="text-sm font-semibold text-white mb-1">Override Per Wing <span className="text-gray-500 font-normal text-xs">(optional)</span></p>
          <p className="text-xs text-gray-500 mb-4">Bump a specific wing higher for a dynamic roofline — all single story.</p>
          <div className="space-y-4">
            {zones.map(zone => {
              const current = value.zone_heights?.[zone.key] ?? fallback
              return (
                <div key={zone.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-300">{zone.label}</span>
                    <span className="text-sm font-bold text-[#C4A35A]">{current} ft</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {HEIGHT_OPTIONS.map(h => (
                      <button key={h} onClick={() => onChange({
                        ...value,
                        zone_heights: { ...(value.zone_heights || {}), [zone.key]: h }
                      })}
                        className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
                          current === h
                            ? 'border-[#C4A35A] bg-[#C4A35A]/20 text-[#C4A35A]'
                            : 'border-white/10 text-gray-400 hover:border-white/30'
                        }`}>
                        {h} ft
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Window Style */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-white mb-3">Window Style</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['fixed', '⬜', 'Fixed', 'Classic picture windows'],
            ['awning', '🪟', 'Awning', 'Top-hinged, opens out'],
            ['casement', '↔️', 'Casement', 'Side-hinged, crank open'],
            ['floor-to-ceiling', '⬛', 'Floor-to-Ceiling', 'Maximum light & drama'],
          ] as const).map(([val, icon, label, desc]) => (
            <button key={val} onClick={() => onChange({ ...value, window_style: val })}
              className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-left transition ${
                value.window_style === val
                  ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
              }`}>
              <span className="text-base">{icon}</span>
              <div>
                <div className="text-xs font-semibold">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
              {value.window_style === val && <span className="ml-auto text-[#C4A35A] text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Exterior Material */}
      <div className="mb-2">
        <p className="text-sm font-semibold text-white mb-3">Exterior Material</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['board-batten', '🪵', 'Board & Batten'],
            ['metal-panels', '🔩', 'Metal Panels'],
            ['stucco', '🏚️', 'Stucco'],
            ['brick', '🧱', 'Brick'],
            ['mixed', '🎨', 'Mixed Materials'],
          ] as const).map(([val, icon, label]) => (
            <button key={val} onClick={() => onChange({ ...value, exterior_material: val })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition ${
                value.exterior_material === val
                  ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
              }`}>
              <span>{icon}</span>
              <span className="text-xs font-medium">{label}</span>
              {value.exterior_material === val && <span className="ml-auto text-[#C4A35A]">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
