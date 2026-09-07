'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Send, ArrowRightCircle, Layers } from 'lucide-react'

export type ShippedPrediction = {
  home_team: string
  away_team: string
  league_name?: string
  marketCode: string
  selectionLabel: string
  confidence: string
  reasoning: string
  combo_enabled: boolean
  combo_side?: string
  combo_reasoning?: string
  comboLegSummaries?: string[]
}

type Props = {
  onShip: (data: ShippedPrediction) => void
}

export default function AnalyzeAndShip({ onShip }: Props) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-with-ai', {
        body: { input, userId: 'admin' },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleShip = () => {
    if (!result?.consensus) return
    const pass1 = result.pass1_used || {}
    const prediction = result.consensus.prediction || {}
    const combo = result.consensus.combo

    onShip({
      home_team: pass1.home_team || '',
      away_team: pass1.away_team || '',
      league_name: pass1.competition || '',
      marketCode: prediction.market || '',
      selectionLabel: prediction.selection || '',
      confidence: String(prediction.confidence === 'HIGH' ? 85 : prediction.confidence === 'MEDIUM' ? 65 : 50),
      reasoning: prediction.reasoning || '',
      combo_enabled: !!combo,
      combo_side: combo?.side || '',
      combo_reasoning: combo?.reasoning || '',
      comboLegSummaries: combo?.selections || [],
    })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-[rgba(18,23,33,0.85)] border border-white/5 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">Analyze a match</h3>
        <textarea
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 min-h-[120px] resize-y"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste match details here - form, odds, H2H, lineups, injuries, standings..."
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm px-4 py-2 rounded-lg transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Analyze
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {result?.consensus && (
        <div className="bg-[rgba(18,23,33,0.85)] border border-emerald-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400">Prediction ready</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              {result.consensus.prediction?.confidence || 'LOW'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Market</p>
              <p className="text-gray-200">{result.consensus.prediction?.market}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Selection</p>
              <p className="text-gray-200">{result.consensus.prediction?.selection}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-1">Reasoning</p>
            <p className="text-xs text-gray-300 leading-relaxed">{result.consensus.prediction?.reasoning}</p>
          </div>
          {result.consensus.combo && (
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
              <h4 className="text-xs font-bold text-violet-400 flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5" /> Combo - {result.consensus.combo.side}
              </h4>
              <ul className="text-xs text-violet-100 space-y-0.5">
                {result.consensus.combo.selections?.map((s: string, i: number) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleShip}
            className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-4 py-2 rounded-lg transition"
          >
            <ArrowRightCircle className="w-4 h-4" /> Ship to Compose Event
          </button>
        </div>
      )}
    </div>
  )
}