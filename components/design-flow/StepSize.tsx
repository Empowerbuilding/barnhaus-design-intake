'use client'
import { DesignState, BathConfig } from '@/lib/design-types'

const BEDS = [2, 3, 4, 5, 6, 7]
const FULL_BATHS = [1, 2, 3, 4, 5]
const HALF_BATHS = [0, 1, 2]

const BATH_CONFIGS: { value: BathConfig; label: string; icon: string }[] = [
  { value: 'ensuite_each',  label: 'Ensuite Each Room', icon: '🚿' },
  { value: 'shared_hall',   label: 'Shared Hall Bath',  icon: '🚶' },
  { value: 'jack_and_jill', label: 'Jack & Jill',       icon: '🔁' },
  { value: 'mix',           label: 'Mix It Up',         icon: '🔀' },
]

type Props = {
  sqft?: number
  bedrooms?: number
  bathrooms?: number
  fullBaths?: number
  halfBaths?: number
  bathConfig?: BathConfig
  stories?: 1 | 2
  onChange: (p: Partial<DesignState>) => void
}

export default function StepSize({ sqft, bedrooms, fullBaths, halfBaths, bathConfig, stories, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">How big?</h2>
      <p className="text-gray-400 text-sm mb-6">Set the size and bedroom count for your home.</p>

      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-2">Square Footage</label>
        <div className="flex items-center gap-4">
          <input type="range" min={1500} max={6000} step={250} value={sqft || 2500}
            onChange={e => onChange({ sqft: Number(e.target.value) })}
            className="flex-1 accent-[#C4A35A]" />
          <span className="text-[#C4A35A] font-bold text-lg w-24 text-right">
            {(sqft || 2500).toLocaleString()} SF
          </span>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-2">Stories</label>
        <div className="flex gap-3">
          {([1, 2] as const).map(s => (
            <button key={s} onClick={() => onChange({ stories: s })}
              className={`px-6 py-2 rounded text-sm font-medium transition ${
                (stories || 1) === s ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {s}-Story
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-2">Bedrooms</label>
        <div className="flex flex-wrap gap-2">
          {BEDS.map(b => (
            <button key={b} onClick={() => onChange({ bedrooms: b })}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                bedrooms === b ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {b} Bed
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-300 block mb-2">Full Bathrooms</label>
        <div className="flex gap-2">
          {FULL_BATHS.map(b => (
            <button key={b} onClick={() => onChange({ fullBaths: b, bathrooms: b + (halfBaths || 0) * 0.5 })}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold transition ${
                fullBaths === b ? 'bg-[#C4A35A] border-[#C4A35A] text-black' : 'border-white/20 bg-white/5 text-white hover:border-white/40'
              }`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-2">Half Bathrooms</label>
        <div className="flex gap-2">
          {HALF_BATHS.map(b => (
            <button key={b} onClick={() => onChange({ halfBaths: b, bathrooms: (fullBaths || 2) + b * 0.5 })}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold transition ${
                halfBaths === b ? 'bg-[#C4A35A] border-[#C4A35A] text-black' : 'border-white/20 bg-white/5 text-white hover:border-white/40'
              }`}>
              {b === 0 ? 'None' : b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-2">Bedroom bathroom setup?</label>
        <div className="grid grid-cols-2 gap-2">
          {BATH_CONFIGS.map(o => (
            <button key={o.value} onClick={() => onChange({ bathConfig: o.value })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition ${
                bathConfig === o.value ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
              }`}>
              <span>{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
