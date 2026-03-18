'use client'
import { DesignState } from '@/lib/design-types'

const SQFT_OPTIONS = [
  { label: '1,500', value: 1500 },
  { label: '2,000', value: 2000 },
  { label: '2,500', value: 2500 },
  { label: '3,000', value: 3000 },
  { label: '3,500', value: 3500 },
  { label: '4,000+', value: 4000 },
]

const BEDS = [2, 3, 4, 5]
const BATHS = [2, 2.5, 3, 3.5, 4]

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

export default function StepContactSize({ state, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Let&apos;s start your design</h2>
      <p className="text-gray-400 text-sm mb-6">Tell us about yourself and your home size.</p>

      {/* Contact */}
      <div className="space-y-3 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">First Name</label>
            <input value={state.firstName || ''} onChange={e => onChange({ firstName: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
              placeholder="John" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Last Name</label>
            <input value={state.lastName || ''} onChange={e => onChange({ lastName: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
              placeholder="Smith" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Email</label>
          <input type="email" value={state.email || ''} onChange={e => onChange({ email: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
            placeholder="john@example.com" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Phone <span className="text-gray-600">(optional)</span></label>
          <input type="tel" value={state.phone || ''} onChange={e => onChange({ phone: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
            placeholder="(555) 000-0000" />
        </div>
      </div>

      {/* Size */}
      <div className="space-y-6">
        <div>
          <label className="text-sm text-gray-300 block mb-2">Living Square Footage</label>
          <div className="grid grid-cols-3 gap-2">
            {SQFT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => onChange({ sqft: o.value })}
                className={`py-2.5 rounded text-sm font-medium transition ${
                  state.sqft === o.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {o.label} SF
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-2">Stories</label>
          <div className="flex gap-3">
            {([1, 2] as const).map(s => (
              <button key={s} onClick={() => onChange({ stories: s })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.stories === s ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {s}-Story
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-2">Bedrooms</label>
          <div className="flex gap-2">
            {BEDS.map(b => (
              <button key={b} onClick={() => onChange({ bedrooms: b })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.bedrooms === b ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-2">Bathrooms</label>
          <div className="flex gap-2">
            {BATHS.map(b => (
              <button key={b} onClick={() => onChange({ bathrooms: b })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.bathrooms === b ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
