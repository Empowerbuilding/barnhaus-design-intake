'use client'
import { Features } from '@/lib/design-types'

const FEATURE_LIST: { key: keyof Features; label: string; icon: string }[] = [
  { key: 'covered_back_porch', label: 'Covered Back Porch', icon: '🌿' },
  { key: 'covered_front_porch', label: 'Covered Front Porch', icon: '🏡' },
  { key: 'vaulted_great_room', label: 'Vaulted Great Room', icon: '⬆️' },
  { key: 'butler_pantry', label: "Butler's Pantry", icon: '🍾' },
  { key: 'mudroom', label: 'Mudroom', icon: '👢' },
  { key: 'home_office', label: 'Home Office', icon: '💼' },
  { key: 'media_room', label: 'Media Room', icon: '🎬' },
  { key: 'inlaw_suite', label: 'In-Law Suite', icon: '🏠' },
  { key: 'safe_room', label: 'Safe Room', icon: '🔒' },
  { key: 'outdoor_kitchen', label: 'Outdoor Kitchen', icon: '🔥' },
]

export default function StepFeatures({ value, onChange }: { value: Partial<Features>; onChange: (v: Partial<Features>) => void }) {
  const toggle = (key: keyof Features) => {
    onChange({ ...value, [key]: !value[key] })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Any special features?</h2>
      <p className="text-gray-400 text-sm mb-6">Select everything you&apos;d like included. You can always add more later.</p>
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
      </div>
    </div>
  )
}
