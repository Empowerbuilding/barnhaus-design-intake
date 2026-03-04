'use client'
import { GarageCount, GarageAttachment, DesignState } from '@/lib/design-types'

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

type Props = { garageCount?: GarageCount; garageAttachment?: GarageAttachment; onChange: (p: Partial<DesignState>) => void }

export default function StepGarage({ garageCount, garageAttachment, onChange }: Props) {
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
        <div>
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
      )}
    </div>
  )
}
