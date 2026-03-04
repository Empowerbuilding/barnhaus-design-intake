'use client'
import { Style } from '@/lib/design-types'

const STYLES: { value: Style; label: string; desc: string; color: string }[] = [
  { value: 'hill_country', label: 'Hill Country', desc: 'Stone, metal roof, earthy tones', color: '#8B7355' },
  { value: 'modern_farmhouse', label: 'Modern Farmhouse', desc: 'White & black, board+batten, clean lines', color: '#6B7280' },
  { value: 'industrial', label: 'Industrial', desc: 'Exposed steel, concrete, minimal', color: '#4B5563' },
  { value: 'contemporary', label: 'Contemporary', desc: 'Flat roof, large windows, geometric', color: '#374151' },
]

export default function StepStyle({ value, onChange }: { value?: Style; onChange: (v: Style) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What&apos;s your style?</h2>
      <p className="text-gray-400 text-sm mb-6">Choose the aesthetic that fits your vision.</p>
      <div className="grid grid-cols-2 gap-3">
        {STYLES.map(s => (
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              value === s.value
                ? 'border-[#C4A35A] bg-[#C4A35A]/10'
                : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="w-full h-16 rounded mb-3" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}99)` }} />
            <div className="font-semibold text-sm">{s.label}</div>
            <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
