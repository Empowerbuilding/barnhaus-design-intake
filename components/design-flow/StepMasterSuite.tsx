'use client'
import { MasterSuite, MasterLocation, ClosetConfig } from '@/lib/design-types'

const LOCATIONS: { value: MasterLocation; label: string; icon: string; desc: string }[] = [
  { value: 'far_left',      label: 'Far Left Wing',   icon: '⬅️', desc: 'Maximum separation from other beds' },
  { value: 'far_right',     label: 'Far Right Wing',  icon: '➡️', desc: 'Maximum separation from other beds' },
  { value: 'rear_center',   label: 'Rear Center',     icon: '⬆️', desc: 'Best views, centered rear access' },
  { value: 'front_center',  label: 'Front Center',    icon: '⬇️', desc: 'Near entry, traditional layout' },
  { value: 'no_preference', label: 'No Preference',   icon: '🔀', desc: 'Let the design decide' },
]

const CLOSETS: { value: ClosetConfig; label: string; icon: string }[] = [
  { value: 'his_and_hers',  label: 'His & Hers',     icon: '👔👗' },
  { value: 'single_wic',    label: 'One Large WIC',  icon: '🚪' },
  { value: 'no_preference', label: 'No Preference',  icon: '🔀' },
]

const BATH_FEATURES: { key: keyof MasterSuite; label: string; icon: string }[] = [
  { key: 'has_freestanding_tub', label: 'Freestanding Tub', icon: '🛁' },
  { key: 'has_walk_in_shower',   label: 'Walk-In Shower',   icon: '🚿' },
  { key: 'outdoor_access',       label: 'Door to Patio',    icon: '🌿' },
]

export default function StepMasterSuite({ value, onChange }: { value: Partial<MasterSuite>; onChange: (v: Partial<MasterSuite>) => void }) {
  const toggle = (key: keyof MasterSuite) => onChange({ ...value, [key]: !value[key] })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Master Suite</h2>
      <p className="text-gray-400 text-sm mb-6">Tell us about your primary bedroom and bath.</p>

      <p className="text-sm font-semibold text-gray-300 mb-3">Where should the master suite be?</p>
      <div className="grid grid-cols-1 gap-2 mb-6">
        {LOCATIONS.map(l => (
          <button key={l.value} onClick={() => onChange({ ...value, location: l.value })}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition ${
              value.location === l.value ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}>
            <span className="text-lg">{l.icon}</span>
            <div>
              <div className="text-sm font-medium">{l.label}</div>
              <div className="text-xs text-gray-400">{l.desc}</div>
            </div>
            {value.location === l.value && <span className="ml-auto text-[#C4A35A]">✓</span>}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-300 mb-3">Closet configuration?</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {CLOSETS.map(c => (
          <button key={c.value} onClick={() => onChange({ ...value, closet_config: c.value })}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-center transition ${
              value.closet_config === c.value ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}>
            <span className="text-xl">{c.icon}</span>
            <span className="text-xs font-medium">{c.label}</span>
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-300 mb-3">Master bath — what do you want?</p>
      <div className="grid grid-cols-2 gap-2">
        {BATH_FEATURES.map(f => (
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
