'use client'
import { Priority } from '@/lib/design-types'

const ALL_PRIORITIES: { value: Priority; label: string; icon: string }[] = [
  { value: 'master_privacy', label: 'Master Suite Privacy', icon: '🛏' },
  { value: 'open_living', label: 'Open Living & Entertaining', icon: '🍽' },
  { value: 'outdoor_connection', label: 'Indoor-Outdoor Connection', icon: '🌿' },
  { value: 'garage_access', label: 'Garage & Mudroom Access', icon: '🚗' },
  { value: 'home_office', label: 'Home Office / Flex Space', icon: '💼' },
]

export default function StepPriorities({ value, onChange }: { value: Priority[]; onChange: (v: Priority[]) => void }) {
  const order = value.length === 5 ? value : ALL_PRIORITIES.map(p => p.value)

  const move = (i: number, dir: -1 | 1) => {
    const next = [...order]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  // Initialize with default order on first render
  const displayOrder = value.length === 5 ? value : ALL_PRIORITIES.map(p => p.value)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What matters most?</h2>
      <p className="text-gray-400 text-sm mb-6">Rank these from most important (top) to least (bottom). Use arrows to reorder.</p>
      <div className="space-y-2">
        {displayOrder.map((p, i) => {
          const item = ALL_PRIORITIES.find(x => x.value === p)!
          return (
            <div key={p} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${i === 0 ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-gray-400'}`}>
                #{i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => { move(i, -1); onChange(displayOrder.map((x, j) => j === i - 1 ? p : j === i ? displayOrder[i-1] : x)) }}
                  disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
                <button onClick={() => { const next = [...displayOrder]; [next[i], next[i+1]] = [next[i+1], next[i]]; onChange(next) }}
                  disabled={i === displayOrder.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none">▼</button>
              </div>
            </div>
          )
        })}
      </div>
      {value.length < 5 && (
        <button onClick={() => onChange(ALL_PRIORITIES.map(p => p.value))}
          className="mt-4 text-xs text-[#C4A35A] underline">
          Use default order
        </button>
      )}
    </div>
  )
}
