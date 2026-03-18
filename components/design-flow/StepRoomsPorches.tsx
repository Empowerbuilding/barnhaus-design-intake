'use client'
import { DesignState, PorchSelection } from '@/lib/design-types'

const ROOMS = [
  { id: 'mudroom',       label: 'Mudroom',       icon: '👢' },
  { id: 'home_office',   label: 'Home Office',   icon: '💼' },
  { id: 'butler_pantry', label: 'Butler Pantry', icon: '🍾' },
  { id: 'game_room',     label: 'Game Room',     icon: '🎮' },
  { id: 'safe_room',     label: 'Safe Room',     icon: '🔒' },
  { id: 'laundry',       label: 'Laundry',       icon: '🧺' },
  { id: 'utility_room',  label: 'Utility Room',  icon: '🔧' },
]

const PORCH_OPTIONS: { value: PorchSelection; label: string }[] = [
  { value: 'front', label: 'Front Porch' },
  { value: 'back',  label: 'Back Porch'  },
  { value: 'both',  label: 'Both'        },
  { value: 'none',  label: 'None'        },
]

const PORCH_SIZES = [
  { value: 200,  label: 'Small',       desc: '~200 SF' },
  { value: 400,  label: 'Medium',      desc: '~400 SF' },
  { value: 700,  label: 'Large',       desc: '~700 SF' },
  { value: 1000, label: 'Extra Large', desc: '~1,000 SF' },
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

      {/* Desired rooms */}
      <div className="mb-8">
        <label className="text-sm text-gray-300 block mb-3">Desired Rooms</label>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => toggleRoom(r.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition ${
                rooms.includes(r.id)
                  ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
              }`}>
              <span>{r.icon}</span>
              <span className="text-xs font-medium">{r.label}</span>
              {rooms.includes(r.id) && <span className="ml-auto text-[#C4A35A]">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Porch selection */}
      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-3">Porch</label>
        <div className="grid grid-cols-2 gap-2">
          {PORCH_OPTIONS.map(p => (
            <button key={p.value} onClick={() => onChange({ porchSelection: p.value })}
              className={`py-2.5 rounded text-sm font-medium transition ${
                state.porchSelection === p.value
                  ? 'bg-[#C4A35A] text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Porch sizes — split by front/back */}
      {(state.porchSelection === 'front' || state.porchSelection === 'both') && (
        <div>
          <label className="text-sm text-gray-300 block mb-3">Front Porch Size</label>
          <div className="grid grid-cols-2 gap-2">
            {PORCH_SIZES.map(s => (
              <button key={s.value} onClick={() => onChange({ frontPorchSF: s.value })}
                className={`py-2.5 px-3 rounded-lg border text-left transition ${
                  state.frontPorchSF === s.value
                    ? 'border-[#C4A35A] bg-[#C4A35A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}>
                <div className="text-sm font-medium text-white">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(state.porchSelection === 'back' || state.porchSelection === 'both') && (
        <div className="mt-5">
          <label className="text-sm text-gray-300 block mb-3">Back Porch Size</label>
          <div className="grid grid-cols-2 gap-2">
            {PORCH_SIZES.map(s => (
              <button key={s.value} onClick={() => onChange({ backPorchSF: s.value })}
                className={`py-2.5 px-3 rounded-lg border text-left transition ${
                  state.backPorchSF === s.value
                    ? 'border-[#C4A35A] bg-[#C4A35A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}>
                <div className="text-sm font-medium text-white">{s.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
