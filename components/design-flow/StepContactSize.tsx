'use client'
import { DesignState } from '@/lib/design-types'

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  format: (v: number) => string; onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm text-gray-300">{label}</label>
        <span className="text-[#C4A35A] font-semibold text-base">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer barnhaus-slider"
        style={{ background: `linear-gradient(to right, #C4A35A ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  )
}

export default function StepContactSize({ state, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Let&apos;s start your design</h2>
      <p className="text-gray-400 text-sm mb-6">Tell us about yourself and your home size.</p>

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

      <div className="space-y-7">
        <Slider label="Living Square Footage" value={state.sqft || 2500}
          min={1000} max={6000} step={100} format={v => `${v.toLocaleString()} SF`}
          onChange={v => onChange({ sqft: v })} />

        <div>
          <label className="text-sm text-gray-300 block mb-2">Stories</label>
          <div className="flex gap-3">
            {([1, 2] as const).map(s => (
              <button key={s} onClick={() => onChange({ stories: s })}
                className={`flex-1 py-2.5 rounded text-sm font-medium transition ${
                  state.stories === s ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {s}-Story
              </button>
            ))}
          </div>
        </div>

        <Slider label="Bedrooms" value={state.bedrooms || 3}
          min={1} max={7} step={1} format={v => `${v} bed`}
          onChange={v => onChange({ bedrooms: v })} />

        <Slider label="Bathrooms" value={state.bathrooms || 2}
          min={1} max={6} step={0.5} format={v => `${v} bath`}
          onChange={v => onChange({ bathrooms: v })} />
      </div>

      <style jsx global>{`
        .barnhaus-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 22px; height: 22px;
          border-radius: 50%; background: #C4A35A; cursor: pointer;
          border: 2px solid #000; box-shadow: 0 0 0 3px rgba(196,163,90,0.25);
        }
        .barnhaus-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: #C4A35A; cursor: pointer;
          border: 2px solid #000; box-shadow: 0 0 0 3px rgba(196,163,90,0.25);
        }
      `}</style>
    </div>
  )
}
