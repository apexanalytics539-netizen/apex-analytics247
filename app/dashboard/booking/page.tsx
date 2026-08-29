'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Copy, Check, Trash2, Clock, Ticket } from 'lucide-react'

export default function BookingPage() {
  const [codes, setCodes] = useState<any[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    loadCodes()
  }, [])

  const loadCodes = async () => {
    const { data } = await supabase.from('bet_slips').select('*').order('created_at', { ascending: false })
    setCodes(data || [])
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 3000)
  }

  const deleteCode = async (id: number) => {
    await supabase.from('bet_slips').delete().eq('id', id)
    loadCodes()
  }

  const toggleExpanded = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Ticket className="w-6 h-6 text-emerald-400" /> Your Booking Codes
      </h1>

      {codes.length === 0 && (
        <div className="bg-[rgba(18,23,33,0.75)] border border-white/5 rounded-2xl p-10 text-center text-gray-400 text-sm">
          No booking codes yet. Book a slip from your Bet Slip page to see it here.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {codes.map((slip) => {
          const selections = Array.isArray(slip.selections) ? slip.selections : []
          const isExpanded = !!expanded[slip.id]

          return (
            <div key={slip.id} className="bg-[rgba(18,23,33,0.75)] border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(slip.created_at).toLocaleString()}
                  </div>
                  <div className="text-lg font-mono text-emerald-400 mt-1">{slip.booking_code}</div>
                  <div className="text-xs text-gray-500">
                    {selections.length || slip.fixture_ids?.length || 0} selections
                    {slip.total_odds ? ` • ${slip.total_odds} combined odds` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => copyCode(slip.booking_code)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                    {copied === slip.booking_code ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button onClick={() => deleteCode(slip.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {selections.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleExpanded(slip.id)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    {isExpanded ? 'Hide selections' : 'Show selections'}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-2 border-t border-white/5 pt-2">
                      {selections.map((s: any, i: number) => (
                        <div key={i} className="text-xs flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
                          <div>
                            <div className="text-gray-200 font-medium">
                              {s.home_team}{s.away_team ? ` vs ${s.away_team}` : ''}
                            </div>
                            <div className="text-gray-500 text-[10px]">{s.market} — {s.selection}</div>
                          </div>
                          {s.odds && <span className="text-emerald-400 font-mono">@ {s.odds}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}