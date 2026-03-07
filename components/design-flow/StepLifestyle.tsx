'use client'
import { Lifestyle } from '@/lib/design-types'

export default function StepLifestyle({ value, onChange }: { value: Partial<Lifestyle>; onChange: (v: Partial<Lifestyle>) => void }) {
  const set = (patch: Partial<Lifestyle>) => onChange({ ...value, ...patch })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">How do you live?</h2>
      <p className="text-gray-400 text-sm mb-6">This helps us design around your actual lifestyle.</p>

      <p className="text-sm font-semibold text-gray-300 mb-3">Pets?</p>
      <div className="flex gap-2 mb-3">
        {['Yes', 'No'].map(v => (
          <button key={v} onClick={() => set({ has_pets: v === 'Yes', ...(v === 'No' ? { pet_wash_station: false } : {}) })}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
              (v === 'Yes' ? value.has_pets === true : value.has_pets === false)
                ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
            }`}>{v}</button>
        ))}
      </div>
      {value.has_pets && (
        <button onClick={() => set({ pet_wash_station: !value.pet_wash_station })}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg border text-sm mb-5 transition ${
            value.pet_wash_station ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}>
          🐾 <span className="font-medium">Add a pet wash station</span>
          {value.pet_wash_station && <span className="ml-auto text-[#C4A35A]">✓</span>}
        </button>
      )}

      <p className="text-sm font-semibold text-gray-300 mb-3">How many vehicles do you own?</p>
      <div className="flex gap-2 mb-5">
        {([1, 2, 3, 4, '5+'] as const).map(n => {
          const val = n === '5+' ? 5 : n as number
          return (
            <button key={n} onClick={() => set({ vehicle_count: val })}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                value.vehicle_count === val ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
              }`}>{n}</button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { key: 'has_workshop' as keyof Lifestyle,    label: 'Workshop / Shop Space', icon: '🔧' },
          { key: 'has_ev_charging' as keyof Lifestyle, label: 'EV Charging',           icon: '⚡' },
        ].map(f => (
          <button key={f.key} onClick={() => set({ [f.key]: !value[f.key] })}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition ${
              value[f.key] ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
            }`}>
            <span>{f.icon}</span>
            <span className="text-xs font-medium">{f.label}</span>
            {value[f.key] && <span className="ml-auto text-[#C4A35A]">✓</span>}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-300 mb-3">How much do you entertain?</p>
      <div className="flex gap-2 mb-5">
        {[
          { value: 'low' as const,    label: 'Rarely' },
          { value: 'medium' as const, label: 'Sometimes' },
          { value: 'high' as const,   label: 'Constantly' },
        ].map(o => (
          <button key={o.value} onClick={() => set({ entertaining_priority: o.value })}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
              value.entertaining_priority === o.value ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
            }`}>{o.label}</button>
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-300 mb-3">Work from home?</p>
      <div className="flex gap-2 mb-5">
        {[
          { value: 'never' as const,     label: 'Never' },
          { value: 'sometimes' as const, label: 'Sometimes' },
          { value: 'always' as const,    label: 'Always' },
        ].map(o => (
          <button key={o.value} onClick={() => set({ wfh_days: o.value })}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
              value.wfh_days === o.value ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
            }`}>{o.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'kids_at_home' as keyof Lifestyle,      label: 'Kids at Home',         icon: '👶' },
          { key: 'multigenerational' as keyof Lifestyle, label: 'In-Law / Guest Suite',  icon: '🏠' },
        ].map(f => (
          <button key={f.key} onClick={() => set({ [f.key]: !value[f.key] })}
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
