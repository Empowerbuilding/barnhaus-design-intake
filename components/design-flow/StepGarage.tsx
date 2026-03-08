'use client'
import { GarageCount, GarageAttachment, GarageOrientation, DesignState } from '@/lib/design-types'

const COUNTS: { value: GarageCount; label: string }[] = [
  { value: 'none', label: 'No Garage' },
  { value: '1-car', label: '1-Car' },
  { value: '2-car', label: '2-Car' },
  { value: '3-car', label: '3-Car' },
]

const ATTACH: { value: GarageAttachment; label: string }[] = [
  { value: 'attached_left', label: 'Attached Left' },
  { value: 'attached_right', label: 'Attached Right' },
  { value: 'detached', label: 'Detached' },
]

const ORIENTATION: { value: GarageOrientation; label: string; desc: string }[] = [
  { value: 'front_facing', label: 'Front-Facing', desc: 'Doors face the street' },
  { value: 'side_loaded', label: 'Side-Loaded', desc: 'Doors face the side — cleaner street presence' },
]

type Props = { garageCount?: GarageCount; garageAttachment?: GarageAttachment; garageOrientation?: GarageOrientation; onChange: (p: Partial<DesignState>) => void }

export default function StepGarage({ garageCount, garageAttachment, garageOrientation, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Tell us about your garage</h2>
      <p className="text-gray-400 text-sm mb-6">Garage placement affects the home&apos;s flow and street presence.</p>

      <div className="mb-6">
        <label className="text-sm text-gray-300 block mb-2">Size</label>
        <div className="flex flex-wrap gap-2">
          {COUNTS.map(c => (
            <button key={c.value} onClick={() => onChange({ garageCount: c.value })}
              className={`px-5 py-2.5 rounded text-sm font-medium transition ${
                garageCount === c.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {garageCount && garageCount !== 'none' && (
        <>
          <div className="mb-6">
            <label className="text-sm text-gray-300 block mb-2">Placement</label>
            <div className="flex flex-wrap gap-2">
              {ATTACH.map(a => (
                <button key={a.value} onClick={() => onChange({ garageAttachment: a.value })}
                  className={`px-5 py-2.5 rounded text-sm font-medium transition ${
                    garageAttachment === a.value ? 'bg-[#C4A35A] text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          {garageAttachment && garageAttachment !== 'detached' && (
            <div>
              <label className="text-sm text-gray-300 block mb-2">Door Orientation</label>
              <div className="flex flex-col gap-2">
                {ORIENTATION.map(o => (
                  <button key={o.value} onClick={() => onChange({ garageOrientation: o.value })}
                    className={`px-4 py-3 rounded text-left transition border ${
                      garageOrientation === o.value ? 'border-[#C4A35A] bg-[#C4A35A]/10 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
                    }`}>
                    <span className="text-sm font-medium block">{o.label}</span>
                    <span className="text-xs text-gray-400">{o.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
