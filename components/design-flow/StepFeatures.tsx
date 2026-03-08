'use client'
import { Features } from '@/lib/design-types'

const FEATURE_LIST: { key: keyof Features; label: string; icon: string }[] = [
  { key: 'covered_back_porch', label: 'Covered Back Porch', icon: '🌿' },
  { key: 'covered_front_porch', label: 'Covered Front Porch', icon: '🏡' },
  { key: 'screened_porch', label: 'Screened Porch', icon: '🪟' },
  { key: 'vaulted_great_room', label: 'Vaulted Great Room', icon: '⬆️' },
  { key: 'butler_pantry', label: "Butler's Pantry", icon: '🍾' },
  { key: 'mudroom', label: 'Mudroom', icon: '👢' },
  { key: 'home_office', label: 'Home Office', icon: '💼' },
  { key: 'media_room', label: 'Media Room', icon: '🎬' },
  { key: 'inlaw_suite', label: 'In-Law Suite', icon: '🏠' },
  { key: 'safe_room', label: 'Safe Room', icon: '🔒' },
  { key: 'outdoor_kitchen', label: 'Outdoor Kitchen', icon: '🔥' },
]

function PorchSliders({ label, depthKey, widthKey, value, onChange }: {
  label: string
  depthKey: string
  widthKey: string
  value: Partial<Features>
  onChange: (v: Partial<Features>) => void
}) {
  const depth = (value[depthKey as keyof Features] as unknown as number) || 12
  const width = (value[widthKey as keyof Features] as unknown as number) || 20
  return (
    <div className="col-span-2 bg-white/5 rounded-lg p-3 mt-1 mb-1 border border-[#C4A35A]/30 space-y-3">
      <p className="text-xs text-[#C4A35A] font-semibold">{label} Dimensions</p>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Width</span><span className="text-white font-medium">{width} ft</span>
        </div>
        <input type="range" min={10} max={60} step={2} value={width}
          onChange={e => onChange({ ...value, [widthKey]: Number(e.target.value) })}
          className="w-full accent-[#C4A35A]" />
        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
          <span>10 ft</span><span>60 ft</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Depth</span><span className="text-white font-medium">{depth} ft</span>
        </div>
        <input type="range" min={8} max={20} step={2} value={depth}
          onChange={e => onChange({ ...value, [depthKey]: Number(e.target.value) })}
          className="w-full accent-[#C4A35A]" />
        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
          <span>8 ft</span><span>20 ft</span>
        </div>
      </div>
    </div>
  )
}

export default function StepFeatures({ value, onChange }: { value: Partial<Features>; onChange: (v: Partial<Features>) => void }) {
  const toggle = (key: keyof Features) => {
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Any special features?</h2>
      <p className="text-gray-400 text-sm mb-6">Select everything you&apos;d like included.</p>
      <div className="grid grid-cols-2 gap-2">
        {FEATURE_LIST.map(f => (
          <button key={f.key} onClick={() => toggle(f.key)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition ${
              value[f.key] ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
            }`}>
            <span>{f.icon}</span>
            <span className="text-xs font-medium">{f.label}</span>
            {value[f.key] && <span className="ml-auto text-[#C4A35A]">✓</span>}
          </button>
        ))}

        {value.covered_back_porch && (
          <PorchSliders label="Back Porch" depthKey="back_porch_depth" widthKey="back_porch_width" value={value} onChange={onChange} />
        )}
        {value.covered_front_porch && (
          <PorchSliders label="Front Porch" depthKey="front_porch_depth" widthKey="front_porch_width" value={value} onChange={onChange} />
        )}
      </div>
    </div>
  )
}
