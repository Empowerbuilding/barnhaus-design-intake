'use client'
import { DesignState, PorchSelection } from '@/lib/design-types'

const ROOMS = [
  { id: 'mudroom', label: 'Mudroom', icon: '👢' },
  { id: 'home_office', label: 'Home Office', icon: '💼' },
  { id: 'butler_pantry', label: 'Butler Pantry', icon: '🍾' },
  { id: 'game_room', label: 'Game Room', icon: '🎮' },
  { id: 'safe_room', label: 'Safe Room', icon: '🔒' },
  { id: 'laundry', label: 'Laundry', icon: '🧺' },
  { id: 'utility_room', label: 'Utility Room', icon: '🔧' },
]

const PORCH_OPTIONS: { value: PorchSelection; label: string }[] = [
  { value: 'front', label: 'Front Porch' },
  { value: 'back', label: 'Back Porch' },
  { value: 'both', label: 'Both' },
  { value: 'none', label: 'None' },
]

type Props = {
  state: DesignState
  onChange: (p: Partial<DesignState>) => void
}

export default function StepRoomsPorches({ state, onChange }: Props) {
  const rooms = state.desiredRooms || []

  const toggleRoom = (id: string) => {
    const next = rooms.includes(id) ? rooms.filter(r => r !== id) : [...rooms, id]
    onChange({ desiredRooms: next })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Rooms & Porches</h2>
      <p className="text-gray-400 text-sm mb-6">Select the rooms you&apos;d like and your porch preference.</p>

      <div className="mb-8">
        <label className="text-sm text-gray-300 block mb-3">Desired Rooms</label>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => toggleRoom(r.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition ${
                rooms.includes(r.id) ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
              }`}>
              <span>{r.icon}</span>
              <span className="text-xs font-medium">{r.label}</span>
              {rooms.includes(r.id) && <span className="ml-auto text-[#C4A35A]">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-3">Porch</label>
        <div className="grid grid-cols-2 gap-2">
          {PORCH_OPTIONS.map(p => (
            <button key={p.value} onClick={() => onChange({ porchSelection: p.value })}
              className={`py-2.5 rounded text-sm font-medium transition ${
                state.porchSelection === p.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
