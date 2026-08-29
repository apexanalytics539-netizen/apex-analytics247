'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Trash2, Ticket, Loader2, Copy, Check, ArrowRight } from 'lucide-react'

function generateBookingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (0/O, 1/I)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function BetSlipPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [selections, setSelections] = useState<any[]>([])
  const [justBookedCode, setJustBookedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    await loadSelections(user?.id)
    setLoading(false)
  }

  const loadSelections = async (userId?: string) => {
    if (!userId) return
    const { data } = await supabase
      .from('bet_slip_selections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setSelections(data || [])
  }

  const removeSelection = async (id: string) => {
    await supabase.from('bet_slip_selections').delete().eq('id', id)
    setSelections(prev => prev.filter(s => s.id !== id))
  }

  const clearAll = async () => {
    if (!user?.id) return
    if (!confirm('Remove all selections from this slip?')) return
    await supabase.from('bet_slip_selections').delete().eq('user_id', user.id)
    setSelections([])
  }

  // Combined odds: multiply every leg that has a price. Legs missing
  // odds don't break the total, they're just excluded and flagged.
  const legsWithOdds = selections.filter(s => s.odds !== null && s.odds !== undefined)
  const legsMissingOdds = selections.length - legsWithOdds.length
  const totalOdds = legsWithOdds.reduce((acc, s) => acc * Number(s.odds), 1)

  const bookSlip = async () => {
    if (!user?.id || selections.length === 0) return
    setBooking(true)

    try {
      const payload = selections.map(s => ({
        home_team: s.home_team,
        away_team: s.away_team,
        competition: s.competition,
        match_time: s.match_time,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
      }))

      // Retry on the rare chance of a booking-code collision.
      let inserted = null
      for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
        const code = generateBookingCode()
        const { data, error } = await supabase
          .from('bet_slips')
          .insert({
            user_id: user.id,
            selections: payload,
            fixture_ids: [], // legacy column, unused for this flow
            total_odds: legsWithOdds.length > 0 ? Number(totalOdds.toFixed(2)) : null,
            booking_code: code,
          })
          .select()
          .single()

        if (!error) {
          inserted = data
        } else if (error.code !== '23505') {
          // Not a unique-violation — a real error, stop retrying.
          throw error
        }
      }

      if (!inserted) throw new Error('Could not generate a unique booking code, please try again.')

      // Clear the working slip now that it's booked.
      await supabase.from('bet_slip_selections').delete().eq('user_id', user.id)
      setSelections([])
      setJustBookedCode(inserted.booking_code)
    } catch (err: any) {
      alert(`Failed to book slip: ${err.message}`)
    } finally {
      setBooking(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-200 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <header className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-emerald-400" /> Bet Slip
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Selections you've added from the AI Analysis Terminal.
            </p>
          </div>
        </header>

        {/* Just-booked confirmation */}
        {justBookedCode && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-gray-300">Slip booked. Your code:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold text-emerald-400 tracking-widest">{justBookedCode}</span>
              <button onClick={() => copyCode(justBookedCode)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={() => router.push('/dashboard/booking')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mx-auto"
            >
              View all booking codes <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Empty state */}
        {selections.length === 0 && !justBookedCode && (
          <div className="bg-[rgba(18,23,33,0.75)] border border-white/5 rounded-2xl p-10 text-center">
            <Ticket className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Your bet slip is empty.</p>
            <p className="text-gray-500 text-xs mt-1">
              Go to the AI Analysis Terminal, get a prediction, and tap "Add to Bet Slip."
            </p>
            <button
              onClick={() => router.push('/dashboard/analyze')}
              className="mt-4 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition"
            >
              Go to Analyze Page
            </button>
          </div>
        )}

        {/* Selections list */}
        {selections.length > 0 && (
          <>
            <div className="space-y-3">
              {selections.map((s) => (
                <div key={s.id} className="bg-[rgba(18,23,33,0.75)] border border-white/5 p-4 rounded-2xl flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">
                      {s.home_team}{s.away_team ? ` vs ${s.away_team}` : ''}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {[s.competition, s.match_time].filter(Boolean).join(' • ') || 'Details not provided'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        {s.market}
                      </span>
                      <span className="text-sm font-bold text-emerald-400">{s.selection}</span>
                      {s.odds && <span className="text-xs text-gray-400 font-mono">@ {s.odds}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSelection(s.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary + Book */}
            <div className="bg-[rgba(18,23,33,0.75)] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Selections</span>
                <span className="font-semibold text-white">{selections.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Combined Odds</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {legsWithOdds.length > 0 ? totalOdds.toFixed(2) : 'N/A'}
                </span>
              </div>
              {legsMissingOdds > 0 && (
                <p className="text-[11px] text-amber-400">
                  {legsMissingOdds} selection{legsMissingOdds > 1 ? 's' : ''} had no odds provided and {legsMissingOdds > 1 ? "aren't" : "isn't"} included in the combined total.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={bookSlip}
                  disabled={booking}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Book Slip
                </button>
                <button
                  onClick={clearAll}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition"
                >
                  Clear All
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}