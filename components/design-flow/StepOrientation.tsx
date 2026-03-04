'use client'
import { Direction, DesignState } from '@/lib/design-types'

const DIRS: Direction[] = ['N', 'E', 'S', 'W']
const ANGLES: Record<Direction, number> = { N: 0, E: 90, S: 180, W: 270 }

function Compass({ value, onChange, label }: { value?: Direction; onChange: (d: Direction) => void; label: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm text-gray-300 mb-3">{label}</p>
      <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-white/20" />
        {DIRS.map(d => {
          const angle = ANGLES[d]
          const rad = (angle - 90) * Math.PI / 180
          const r = 44
          const cx = 64 + r * Math.cos(rad)
          const cy = 64 + r * Math.sin(rad)
          return (
            <button key={d} onClick={() => onChange(d)}
              style={{ left: cx - 16, top: cy - 16 }}
              className={`absolute w-8 h-8 rounded-full text-xs font-bold transition ${
                value === d ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {d}
            </button>
          )
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  )
}

type Props = { streetFacing?: Direction; viewFacing?: Direction; onChange: (p: Partial<DesignState>) => void }

export default function StepOrientation({ streetFacing, viewFacing, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Orient your home</h2>
      <p className="text-gray-400 text-sm mb-6">This determines where living spaces and bedrooms get placed.</p>
      <div className="grid grid-cols-2 gap-4">
        <Compass value={streetFacing} onChange={v => onChange({ streetFacing: v })} label="🏘 Street faces..." />
        <Compass value={viewFacing} onChange={v => onChange({ viewFacing: v })} label="🌅 Best view is..." />
      </div>
    </div>
  )
}
