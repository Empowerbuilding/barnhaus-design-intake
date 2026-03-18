'use client'
import { DesignState, RoofStyle, RoofPitch } from '@/lib/design-types'

const ROOF_STYLES: { value: RoofStyle; label: string; desc: string; path: string }[] = [
  { value: 'gable', label: 'Gable', desc: 'Classic peaked roof', path: 'M10,60 L50,20 L90,60 L90,80 L10,80 Z' },
  { value: 'shed', label: 'Shed', desc: 'Single slope', path: 'M10,50 L90,25 L90,80 L10,80 Z' },
  { value: 'mono_pitch', label: 'Mono-Pitch', desc: 'Modern single angle', path: 'M10,30 L90,50 L90,80 L10,80 Z' },
  { value: 'hip', label: 'Hip', desc: 'Slopes on all sides', path: 'M30,25 L70,25 L90,55 L90,80 L10,80 L10,55 Z' },
]

const PITCHES: RoofPitch[] = ['2:12', '4:12', '6:12']
const CEILING_HEIGHTS = [9, 10, 11, 12]

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

export default function StepRoof({ state, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Roof</h2>
      <p className="text-gray-400 text-sm mb-6">Choose your roof style, pitch, and ceiling height.</p>

      <div className="mb-8">
        <label className="text-sm text-gray-300 block mb-3">Primary Roof Style</label>
        <div className="grid grid-cols-2 gap-3">
          {ROOF_STYLES.map(r => (
            <button key={r.value} onClick={() => onChange({ mainRoofStyle: r.value })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                state.mainRoofStyle === r.value ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}>
              <svg viewBox="0 0 100 100" className="w-full h-12 mb-1.5">
                <path d={r.path} fill={state.mainRoofStyle === r.value ? '#C4A35A33' : '#ffffff11'}
                  stroke={state.mainRoofStyle === r.value ? '#C4A35A' : '#888'} strokeWidth="3"/>
              </svg>
              <div className="font-semibold text-xs">{r.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
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

      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-2">Vaulted Great Room</label>
        <div className="flex gap-3">
          <button onClick={() => onChange({ greatRoomVaulted: true })}
            className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
              state.greatRoomVaulted === true ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}>
            Yes
          </button>
          <button onClick={() => onChange({ greatRoomVaulted: false })}
            className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
              state.greatRoomVaulted === false ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}>
            No
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-2">Ceiling Height</label>
        <div className="flex gap-2">
          {CEILING_HEIGHTS.map(h => (
            <button key={h} onClick={() => onChange({ ceilingHeight: h })}
              className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                state.ceilingHeight === h ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {h}ft
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
