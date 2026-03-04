'use client'
import { useState, useEffect, useCallback } from 'react'
import { DesignState } from '@/lib/design-types'
import BubbleDiagram from '@/components/BubbleDiagram'
import StepStyle from '@/components/design-flow/StepStyle'
import StepSize from '@/components/design-flow/StepSize'
import StepShape from '@/components/design-flow/StepShape'
import StepOrientation from '@/components/design-flow/StepOrientation'
import StepPriorities from '@/components/design-flow/StepPriorities'
import StepGarage from '@/components/design-flow/StepGarage'
import StepFeatures from '@/components/design-flow/StepFeatures'
import StepContact from '@/components/design-flow/StepContact'

const TOTAL_STEPS = 8

const STEP_LABELS = ['Style', 'Size', 'Shape', 'Orientation', 'Priorities', 'Garage', 'Features', 'Contact']

const DEFAULT_PRIORITIES = ['master_privacy', 'open_living', 'outdoor_connection', 'garage_access', 'home_office'] as const
const initialState: DesignState = { step: 1, priorities: [...DEFAULT_PRIORITIES] as import('@/lib/design-types').Priority[] }

export default function DesignFlow() {
  const [state, setState] = useState<DesignState>(initialState)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Regenerate SVG whenever state changes
  useEffect(() => {
    if (state.step >= 2) {
    }
  }, [state])

  const update = useCallback((patch: Partial<DesignState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const next = useCallback(async () => {
    const nextStep = Math.min(state.step + 1, TOTAL_STEPS)
    setState(prev => ({ ...prev, step: nextStep }))
    // Auto-save
    setSaving(true)
    try {
      const res = await fetch('/api/design/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, step: nextStep }),
      })
      const data = await res.json()
      if (data.sessionId && !state.sessionId) {
        setState(prev => ({ ...prev, sessionId: data.sessionId }))
      }
    } catch {}
    setSaving(false)
  }, [state])

  const back = useCallback(() => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }))
  }, [])

  const handleSubmit = async (contactInfo: { firstName: string; lastName: string; email: string; phone?: string }) => {
    update(contactInfo)
    setSaving(true)
    try {
      await fetch('/api/design/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, ...contactInfo }),
      })
      setSubmitted(true)
    } catch {}
    setSaving(false)
  }

  const handleGenerate = async (imageBase64: string) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, state }),
      })
      const data = await res.json()
      if (data.imageUrl) setGeneratedImageUrl(data.imageUrl)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const canNext = (): boolean => {
    switch (state.step) {
      case 1: return !!state.style
      case 2: return !!state.sqft && !!state.bedrooms && !!state.bathrooms
      case 3: return !!state.shape
      case 4: return true // orientation is optional
      case 5: return !!(state.priorities && state.priorities.length === 5)
      case 6: return !!state.garageCount
      case 7: return true
      default: return false
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="text-5xl mb-6">🏠</div>
          <h1 className="text-3xl font-bold text-white mb-4">Your Concept is Ready</h1>
          <p className="text-gray-300 mb-8">
            We&apos;ve received your design. Our team will reach out within 24 hours to discuss your project.
          </p>
          <a
            href="https://barnhaussteelbuilders.com"
            className="inline-block bg-[#C4A35A] text-black font-semibold px-8 py-3 rounded hover:bg-[#D4B36A] transition"
          >
            Visit Barnhaus →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-widest text-[#C4A35A] uppercase">Barnhaus Steel Builders</div>
        <div className="text-sm text-gray-400">Design Your Home</div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-3 bg-[#111]">
        <div className="flex items-center gap-1 mb-1">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className={`h-1 rounded transition-all duration-300 ${
                  i + 1 < state.step ? 'bg-[#C4A35A]' :
                  i + 1 === state.step ? 'bg-white' : 'bg-white/20'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Step {state.step} of {TOTAL_STEPS}</span>
          <span className="text-xs text-[#C4A35A] font-medium">{STEP_LABELS[state.step - 1]}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)]">
        {/* Left: Questions */}
        <div className="flex-1 lg:max-w-[55%] px-6 py-8 flex flex-col">
          <div className="flex-1">
            {state.step === 1 && <StepStyle value={state.style} onChange={v => update({ style: v })} />}
            {state.step === 2 && <StepSize sqft={state.sqft} bedrooms={state.bedrooms} bathrooms={state.bathrooms} onChange={patch => update(patch)} />}
            {state.step === 3 && <StepShape value={state.shape} onChange={v => update({ shape: v })} />}
            {state.step === 4 && <StepOrientation streetFacing={state.streetFacing} viewFacing={state.viewFacing} onChange={patch => update(patch)} />}
            {state.step === 5 && <StepPriorities value={state.priorities || []} onChange={v => update({ priorities: v })} />}
            {state.step === 6 && <StepGarage garageCount={state.garageCount} garageAttachment={state.garageAttachment} onChange={patch => update(patch)} />}
            {state.step === 7 && <StepFeatures value={state.features || {}} onChange={v => update({ features: v })} />}
            {state.step === 8 && <StepContact onSubmit={handleSubmit} saving={saving} />}
          </div>

          {/* Nav Buttons */}
          {state.step < 8 && (
            <div className="flex gap-3 mt-8">
              {state.step > 1 && (
                <button
                  onClick={back}
                  className="px-6 py-3 border border-white/20 text-white rounded hover:bg-white/10 transition text-sm"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={next}
                disabled={!canNext() || saving}
                className="flex-1 px-6 py-3 bg-[#C4A35A] text-black font-semibold rounded
                  hover:bg-[#D4B36A] disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                {saving ? 'Saving...' : 'Next →'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Bubble Diagram */}
        <div className="lg:w-[45%] bg-[#0D0D0D] lg:sticky lg:top-0 lg:h-screen flex flex-col p-6 border-l border-white/10">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-4 text-center">Arrange Your Rooms</p>
          <BubbleDiagram
            state={state}
            onPositionsChange={() => {}}
            generatedImageUrl={generatedImageUrl || undefined}
            onGenerate={handleGenerate}
            generating={generating}
          />
        </div>
      </div>
    </div>
  )
}
