'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DesignSession } from '@/lib/design-types'

const STATUSES = ['all', 'in_progress', 'submitted', 'approved', 'built', 'delivered'] as const
const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-500/20 text-blue-300',
  submitted: 'bg-yellow-500/20 text-yellow-300',
  approved: 'bg-green-500/20 text-green-300',
  built: 'bg-purple-500/20 text-purple-300',
  delivered: 'bg-gray-500/20 text-gray-300',
}

export default function StudioPage() {
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [sessions, setSessions] = useState<DesignSession[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('studio_token')
    if (saved) { setToken(saved); loadSessions(saved) }
  }, [])

  const login = () => {
    setToken(password)
    sessionStorage.setItem('studio_token', password)
    loadSessions(password)
  }

  const loadSessions = async (tok: string) => {
    setLoading(true)
    const res = await fetch('/api/studio/sessions', { headers: { 'x-studio-token': tok } })
    if (res.status === 401) { setAuthError('Wrong password'); setToken(null); sessionStorage.removeItem('studio_token') }
    else { const data = await res.json(); setSessions(data) }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="bg-[#111] border border-white/10 rounded-xl p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-white mb-6">Barnhaus Design Studio</h1>
          {authError && <p className="text-red-400 text-sm mb-3">{authError}</p>}
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Studio password" autoFocus
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-white text-sm mb-3 focus:outline-none focus:border-[#C4A35A]" />
          <button onClick={login}
            className="w-full bg-[#C4A35A] text-black font-semibold py-2.5 rounded hover:bg-[#D4B36A] transition text-sm">
            Enter Studio
          </button>
        </div>
      </div>
    )
  }

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold tracking-widest text-[#C4A35A] uppercase">Barnhaus Design Studio</div>
          <div className="text-xs text-gray-500 mt-0.5">{sessions.length} total designs</div>
        </div>
        <button onClick={() => loadSessions(token)} className="text-xs text-gray-500 hover:text-white">↻ Refresh</button>
      </div>

      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition ${
                filter === s ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:text-white'
              }`}>
              {s.replace('_', ' ')} {s === 'all' ? `(${sessions.length})` : `(${sessions.filter(x => x.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="text-gray-500 text-sm py-8 text-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-sm py-8 text-center">No designs yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-white/10">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Style</th>
                  <th className="text-left py-2 pr-4">Shape</th>
                  <th className="text-left py-2 pr-4">Size</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Submitted</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 pr-4 font-medium">
                      {s.first_name ? `${s.first_name} ${s.last_name}` : <span className="text-gray-600">Anonymous</span>}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{s.email || '—'}</td>
                    <td className="py-3 pr-4 capitalize text-gray-300">{s.style?.replace('_', ' ') || '—'}</td>
                    <td className="py-3 pr-4 capitalize text-gray-300">{s.shape || '—'}</td>
                    <td className="py-3 pr-4 text-gray-300">
                      {s.sqft_min ? `${s.sqft_min?.toLocaleString()} SF` : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs capitalize ${STATUS_COLORS[s.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Link href={`/studio/${s.id}`}
                        className="text-[#C4A35A] text-xs hover:underline">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
