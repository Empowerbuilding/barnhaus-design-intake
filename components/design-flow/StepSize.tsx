'use client'
import { DesignState } from '@/lib/design-types'

const BEDS = [2, 3, 4, 5, 6, 7]
const BATHS = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

type Props = { sqft?: number; bedrooms?: number; bathrooms?: number; stories?: 1 | 2; onChange: (p: Partial<DesignState>) => void }

export default function StepSize({ sqft, bedrooms, bathrooms, stories, onChange }: Props) {
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

      <div>
        <label className="text-sm text-gray-300 block mb-2">Bathrooms</label>
        <div className="flex flex-wrap gap-2">
          {BATHS.map(b => (
            <button key={b} onClick={() => onChange({ bathrooms: b })}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                bathrooms === b ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {b} Bath
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
