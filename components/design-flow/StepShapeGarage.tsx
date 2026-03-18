'use client'
import { Shape, GarageCount, GarageAttachment, DesignState } from '@/lib/design-types'

const SHAPES: { value: Shape; label: string; desc: string; path: string }[] = [
  { value: 'rectangle', label: 'Rectangle', desc: 'Classic ranch', path: 'M10,20 L90,20 L90,75 L10,75 Z' },
  { value: 'l-shape', label: 'L-Shape', desc: 'Extends with a wing', path: 'M10,20 L90,20 L90,50 L55,50 L55,80 L10,80 Z' },
  { value: 't-shape', label: 'T-Shape', desc: 'Central with wings', path: 'M30,15 L70,15 L70,45 L90,45 L90,80 L10,80 L10,45 L30,45 Z' },
  { value: 'h-shape', label: 'H-Shape', desc: 'Two wings + bridge', path: 'M10,15 L35,15 L35,40 L65,40 L65,15 L90,15 L90,80 L65,80 L65,58 L35,58 L35,80 L10,80 Z' },
]

const GARAGE_CARS: { value: GarageCount; label: string }[] = [
  { value: '1-car', label: '1-Car' },
  { value: '2-car', label: '2-Car' },
  { value: '3-car', label: '3-Car' },
]

const GARAGE_ATTACH: { value: GarageAttachment; label: string }[] = [
  { value: 'attached_left', label: 'Attached Left' },
  { value: 'attached_right', label: 'Attached Right' },
  { value: 'detached', label: 'Detached' },
]

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

export default function StepShapeGarage({ state, onChange }: Props) {
  const hasGarage = state.garageCount && state.garageCount !== 'none'

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Shape & Garage</h2>
      <p className="text-gray-400 text-sm mb-6">Pick your home&apos;s footprint and garage configuration.</p>

      {/* Shape */}
      <div className="mb-8">
        <label className="text-sm text-gray-300 block mb-3">Footprint Shape</label>
        <div className="grid grid-cols-2 gap-3">
          {SHAPES.map(s => (
            <button key={s.value} onClick={() => onChange({ shape: s.value })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                state.shape === s.value ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}>
              <svg viewBox="0 0 100 100" className="w-full h-14 mb-1.5">
                <path d={s.path} fill={state.shape === s.value ? '#C4A35A33' : '#ffffff11'}
                  stroke={state.shape === s.value ? '#C4A35A' : '#888'} strokeWidth="3"/>
              </svg>
              <div className="font-semibold text-xs">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Garage Toggle */}
      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-3">Garage</label>
        <div className="flex gap-3">
          <button onClick={() => { if (!hasGarage) onChange({ garageCount: '2-car' }) }}
            className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
              hasGarage ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}>
            Yes
          </button>
          <button onClick={() => onChange({ garageCount: 'none', garageAttachment: undefined })}
            className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
              state.garageCount === 'none' ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}>
            No
          </button>
        </div>
      </div>

      {/* Garage Options */}
      {hasGarage && (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-gray-300 block mb-2">How many cars?</label>
            <div className="flex gap-2">
              {GARAGE_CARS.map(c => (
                <button key={c.value} onClick={() => onChange({ garageCount: c.value })}
                  className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                    state.garageCount === c.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">Placement</label>
            <div className="flex flex-wrap gap-2">
              {GARAGE_ATTACH.map(a => (
                <button key={a.value} onClick={() => onChange({ garageAttachment: a.value })}
                  className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                    state.garageAttachment === a.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
