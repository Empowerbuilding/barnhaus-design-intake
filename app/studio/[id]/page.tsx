'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { DesignSession } from '@/lib/design-types'
import { renderSVG } from '@/lib/floor-plan-renderer'

const STATUSES = ['in_progress', 'submitted', 'approved', 'built', 'delivered']

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [session, setSession] = useState<DesignSession | null>(null)
  const [token] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('studio_token') || '' : '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState('')
  const [svgMarkup, setSvgMarkup] = useState('')

  useEffect(() => {
    if (!id || !token) return
    fetch(`/api/studio/sessions/${id}`, { headers: { 'x-studio-token': token } })
      .then(r => r.json())
      .then(data => {
        setSession(data)
        setNotes(data.notes || '')
        // Generate SVG from session data
        const designState = {
          step: 8,
          style: data.style,
          sqft: data.sqft_min || data.sqft,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          shape: data.shape,
          streetFacing: data.orientation,
          priorities: data.priorities,
          garageCount: data.garage,
          garageAttachment: data.garage_size,
          features: data.features,
        }
        setSvgMarkup(renderSVG(designState))
      })
  }, [id, token])

  const updateStatus = async (status: string) => {
    setSaving(true)
    await fetch(`/api/studio/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
      body: JSON.stringify({ status }),
    })
    setSession(prev => prev ? { ...prev, status: status as DesignSession['status'] } : prev)
    setSaving(false)
  }

  const saveNotes = async () => {
    setSaving(true)
    await fetch(`/api/studio/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
      body: JSON.stringify({ notes }),
    })
    setSaving(false)
  }

  const addRevision = async () => {
    if (!revision.trim()) return
    await fetch(`/api/studio/sessions/${id}/revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-studio-token': token },
      body: JSON.stringify({ description: revision, requestedBy: 'mitch' }),
    })
    setRevision('')
  }

  if (!session) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-gray-500 text-sm">
      Loading...
    </div>
  )

  const s = session

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/studio" className="text-gray-500 hover:text-white text-sm">← Studio</Link>
        <div>
          <div className="font-semibold">
            {s.first_name ? `${s.first_name} ${s.last_name}` : 'Anonymous Design'}
          </div>
          <div className="text-xs text-gray-500">{s.email} · {new Date(s.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Left: Design Summary + Floor Plan */}
        <div className="flex-1 p-6 border-r border-white/10">
          {/* Floor Plan */}
          {svgMarkup && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Floor Plan Preview</p>
              <div className="bg-white rounded-lg shadow-xl" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            </div>
          )}

          {/* Design answers */}
          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            {[
              ['Style', s.style?.replace('_', ' ')],
              ['Shape', s.shape],
              ['Size', s.sqft_min ? `${s.sqft_min?.toLocaleString()} SF` : null],
              ['Bedrooms', s.bedrooms],
              ['Bathrooms', s.bathrooms],
              ['Garage', s.garage],
              ['Street Facing', s.orientation],
            ].map(([label, val]) => val ? (
              <div key={String(label)} className="bg-white/5 rounded p-3">
                <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                <div className="capitalize font-medium">{String(val)}</div>
              </div>
            ) : null)}
          </div>

          {/* Features */}
          {s.features && Object.entries(s.features).filter(([, v]) => v).length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">Features</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(s.features).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="bg-[#C4A35A]/20 text-[#C4A35A] text-xs px-2 py-1 rounded capitalize">
                    {k.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Designer Notes</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A35A] resize-none"
              placeholder="Add notes for Michael or the team..." />
            <button onClick={saveNotes} disabled={saving}
              className="mt-2 text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition">
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="lg:w-72 p-6 space-y-6">
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Status</p>
            <div className="space-y-1">
              {STATUSES.map(st => (
                <button key={st} onClick={() => updateStatus(st)}
                  className={`w-full text-left px-3 py-2 rounded text-sm capitalize transition ${
                    s.status === st ? 'bg-[#C4A35A] text-black font-semibold' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}>
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Request Revision</p>
            <textarea value={revision} onChange={e => setRevision(e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A35A] resize-none"
              placeholder="Describe the change needed..." />
            <button onClick={addRevision}
              className="w-full mt-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-sm transition">
              Add Revision Note
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">Contact</p>
            <div className="text-sm text-gray-300 space-y-1">
              <div>{s.first_name} {s.last_name}</div>
              {s.email && <div className="text-gray-500">{s.email}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
