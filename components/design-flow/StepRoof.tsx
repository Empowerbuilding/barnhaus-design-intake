'use client'
import { DesignState, RoofStyle, RoofPitch } from '@/lib/design-types'

const ROOF_STYLES: { value: RoofStyle; label: string; desc: string; path: string }[] = [
  { value: 'gable',     label: 'Gable',      desc: 'Classic peaked',     path: 'M10,60 L50,20 L90,60 L90,80 L10,80 Z' },
  { value: 'shed',      label: 'Shed',        desc: 'Single slope',       path: 'M10,50 L90,25 L90,80 L10,80 Z' },
  { value: 'mono_pitch',label: 'Mono-Pitch',  desc: 'Modern angle',       path: 'M10,30 L90,50 L90,80 L10,80 Z' },
  { value: 'hip',       label: 'Hip',         desc: 'All-sides slope',    path: 'M30,25 L70,25 L90,55 L90,80 L10,80 L10,55 Z' },
  { value: 'flat',      label: 'Flat',        desc: 'Modern flat/low slope', path: 'M10,35 L90,35 L90,80 L10,80 Z' },
]

const PITCHES: RoofPitch[] = ['2:12', '4:12', '6:12']

const ZONE_LABELS: Record<string, Record<string, string>> = {
  'h-shape':        { left_wing: 'Left Wing', center_bridge: 'Center Bridge', right_wing: 'Right Wing' },
  'l-shape':        { main_wing: 'Main Wing', secondary_wing: 'Secondary Wing' },
  'asymmetric-l':   { main_wing: 'Main Wing', secondary_wing: 'Secondary Wing' },
  't-shape':        { main_body: 'Main Body', rear_wing: 'Rear Wing' },
  'u-shape':        { left_wing: 'Left Wing', center_body: 'Center Body', right_wing: 'Right Wing' },
  'dogtrot':        { left_bar: 'Left Bar', right_bar: 'Right Bar' },
  'z-shape':        { upper_bar: 'Upper Bar', lower_bar: 'Lower Bar' },
  'barndominium-bar': { main_bar: 'Main Bar' },
  'courtyard':      { main_body: 'Main Body' },
  'rectangle':      {},
}
const HEIGHTS = [9, 10, 11, 12, 14, 16]
const WALL_HEIGHTS = [9, 10, 11, 12, 14, 16]
const SOFFIT_DEPTHS = [
  { value: 0,  label: 'None',   desc: 'Flush' },
  { value: 12, label: '12"',    desc: 'Minimal' },
  { value: 18, label: '18"',    desc: 'Standard' },
  { value: 24, label: '24"',    desc: 'Deep' },
  { value: 36, label: '36"',    desc: 'Extra Deep' },
]

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

function RoofPicker({
  label, value, onChange, hint
}: {
  label: string
  value?: RoofStyle
  onChange: (v: RoofStyle) => void
  hint?: string
}) {
  return (
    <div>
      <label className="text-sm text-gray-300 block mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}
      <div className="grid grid-cols-4 gap-2">
        {ROOF_STYLES.map(r => (
          <button key={r.value} onClick={() => onChange(r.value)}
            className={`p-2 rounded-lg border-2 text-center transition-all ${
              value === r.value ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}>
            <svg viewBox="0 0 100 100" className="w-full h-10 mb-1">
              <path d={r.path}
                fill={value === r.value ? '#C4A35A33' : '#ffffff11'}
                stroke={value === r.value ? '#C4A35A' : '#888'} strokeWidth="3"/>
            </svg>
            <div className="font-semibold text-[10px] leading-tight">{r.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StepRoof({ state, onChange }: Props) {
  const is2Story = state.stories === 2
  const shape = state.shape || 'rectangle'

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Roof & Structure</h2>
      <p className="text-gray-400 text-sm mb-6">Define your rooflines, wall heights, and overhangs.</p>

      <div className="space-y-7">

        {/* Primary roof */}
        <RoofPicker
          label="Primary Roof Style"
          hint="Main body of the home"
          value={state.mainRoofStyle}
          onChange={v => onChange({ mainRoofStyle: v })}
        />

        {/* Secondary roof */}
        <RoofPicker
          label="Secondary Roof Style"
          hint="Wings, garage, or porch — leave unset to match primary"
          value={state.secondaryRoofStyle}
          onChange={v => onChange({ secondaryRoofStyle: v })}
        />

        {/* Pitch */}
        <div>
          <label className="text-sm text-gray-300 block mb-2">Roof Pitch</label>
          <div className="flex gap-2">
            {PITCHES.map(p => (
              <button key={p} onClick={() => onChange({ roofPitch: p })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.roofPitch === p ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Exterior wall height */}
        <div>
          <label className="text-sm text-gray-300 block mb-2">Exterior Wall Height</label>
          <div className="grid grid-cols-6 gap-2">
            {WALL_HEIGHTS.map(h => (
              <button key={h} onClick={() => onChange({ wallHeight: h })}
                className={`py-2.5 rounded text-sm font-medium transition ${
                  state.wallHeight === h ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {h}ft
              </button>
            ))}
          </div>
        </div>

        {/* Soffit/overhang */}
        <div>
          <label className="text-sm text-gray-300 block mb-2">Roof Overhang / Soffit</label>
          <div className="grid grid-cols-5 gap-2">
            {SOFFIT_DEPTHS.map(s => (
              <button key={s.value} onClick={() => onChange({ soffitDepth: s.value })}
                className={`py-2 rounded-lg border text-center transition ${
                  state.soffitDepth === s.value
                    ? 'border-[#C4A35A] bg-[#C4A35A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}>
                <div className="text-sm font-medium text-white">{s.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Vaulted great room */}
        <div>
          <label className="text-sm text-gray-300 block mb-2">Vaulted Great Room</label>
          <div className="flex gap-3">
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => onChange({ greatRoomVaulted: v })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.greatRoomVaulted === v ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {v ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        {/* Standard ceiling height */}
        <div>
          <label className="text-sm text-gray-300 block mb-2">Standard Ceiling Height</label>
          <div className="flex gap-2">
            {[9, 10, 11, 12].map(h => (
              <button key={h} onClick={() => onChange({ ceilingHeight: h })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.ceilingHeight === h ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {h}ft
              </button>
            ))}
          </div>
        </div>

        {/* Zone-specific wall heights — only for multi-zone shapes */}
        {shape && ZONE_LABELS[shape] && Object.keys(ZONE_LABELS[shape]).length > 1 && (
          <div>
            <label className="text-sm text-gray-300 block mb-1">Zone Wall Heights</label>
            <p className="text-xs text-gray-500 mb-3">Set different wall heights per section for a more dynamic roofline</p>
            <div className="space-y-3">
              {Object.entries(ZONE_LABELS[shape]).map(([zone, label]) => (
                <div key={zone}>
                  <div className="text-xs text-gray-400 mb-1.5">{label}</div>
                  <div className="flex gap-2">
                    {HEIGHTS.map(h => (
                      <button key={h} onClick={() => onChange({ zoneHeights: { ...state.zoneHeights, [zone]: h } })}
                        className={`flex-1 py-2 rounded text-xs font-medium transition ${
                          state.zoneHeights?.[zone] === h ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}>
                        {h}ft
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2nd story balcony — only show for 2-story */}
        {is2Story && (
          <div>
            <label className="text-sm text-gray-300 block mb-1">2nd Story Balcony / Patio</label>
            <p className="text-xs text-gray-500 mb-3">Outdoor deck or balcony off an upper-floor room</p>
            <div className="flex gap-3">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => onChange({ hasBalcony: v })}
                  className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                    state.hasBalcony === v ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
