'use client'
import { Shape } from '@/lib/design-types'

const SHAPES: { value: Shape; label: string; desc: string; path: string }[] = [
  { value: 'rectangle',    label: 'Rectangle',     desc: 'Classic ranch',         path: 'M10,20 L90,20 L90,75 L10,75 Z' },
  { value: 'wide-shallow', label: 'Wide & Shallow', desc: 'Panoramic views',       path: 'M5,30 L95,30 L95,65 L5,65 Z' },
  { value: 'narrow-deep',  label: 'Narrow & Deep',  desc: 'Smaller lot friendly',  path: 'M30,8 L70,8 L70,92 L30,92 Z' },
  { value: 'l-shape',      label: 'L-Shape',        desc: 'Extends with a wing',   path: 'M10,20 L90,20 L90,50 L55,50 L55,80 L10,80 Z' },
  { value: 't-shape',      label: 'T-Shape',        desc: 'Central with wings',    path: 'M30,15 L70,15 L70,45 L90,45 L90,80 L10,80 L10,45 L30,45 Z' },
  { value: 'u-shape',      label: 'U-Shape',        desc: 'Courtyard-facing',      path: 'M10,15 L90,15 L90,80 L65,80 L65,45 L35,45 L35,80 L10,80 Z' },
  { value: 'h-shape',      label: 'H-Shape',        desc: 'Two wings + bridge',    path: 'M10,15 L35,15 L35,40 L65,40 L65,15 L90,15 L90,80 L65,80 L65,58 L35,58 L35,80 L10,80 Z' },
  { value: 'z-shape',      label: 'Z-Shape',        desc: 'Offset split design',   path: 'M10,15 L65,15 L65,45 L90,45 L90,80 L35,80 L35,52 L10,52 Z' },
  { value: 'courtyard',    label: 'Courtyard',      desc: 'Interior courtyard',    path: 'M10,10 L90,10 L90,90 L10,90 Z M30,30 L70,30 L70,70 L30,70 Z' },
]

export default function StepShape({ value, onChange }: { value?: Shape; onChange: (v: Shape) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What shape fits your land?</h2>
      <p className="text-gray-400 text-sm mb-6">The footprint of your home.</p>
      <div className="grid grid-cols-3 gap-3">
        {SHAPES.map(s => (
          <button key={s.value} onClick={() => onChange(s.value)}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              value === s.value ? 'border-[#C4A35A] bg-[#C4A35A]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}>
            <svg viewBox="0 0 100 100" className="w-full h-14 mb-1.5">
              <path d={s.path} fill={value === s.value ? '#C4A35A33' : '#ffffff11'}
                stroke={value === s.value ? '#C4A35A' : '#888'} strokeWidth="3" fillRule="evenodd"/>
            </svg>
            <div className="font-semibold text-xs">{s.label}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
