'use client'
import { useState } from 'react'

type Props = { onSubmit: (info: { firstName: string; lastName: string; email: string; phone?: string }) => void; saving: boolean }

export default function StepContact({ onSubmit, saving }: Props) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  const valid = form.firstName && form.lastName && form.email.includes('@')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Your design is ready</h2>
      <p className="text-gray-400 text-sm mb-6">Enter your info to receive your free concept summary and connect with our team.</p>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">First Name</label>
            <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
              placeholder="John" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Last Name</label>
            <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
              placeholder="Smith" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
            placeholder="john@example.com" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Phone <span className="text-gray-600">(optional)</span></label>
          <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full bg-white/10 border border-white/20 rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C4A35A]"
            placeholder="(555) 000-0000" />
        </div>
      </div>

      <button onClick={() => onSubmit(form)} disabled={!valid || saving}
        className="w-full mt-6 bg-[#C4A35A] text-black font-semibold py-3.5 rounded hover:bg-[#D4B36A] disabled:opacity-40 disabled:cursor-not-allowed transition">
        {saving ? 'Submitting...' : 'Get My Free Concept →'}
      </button>

      <p className="text-xs text-gray-600 text-center mt-3">No spam. Your info is only used to follow up on your design.</p>
    </div>
  )
}
