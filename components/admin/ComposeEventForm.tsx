'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Layers, Plus, Trash2 } from 'lucide-react'
import MarketSelectionPicker from '@/components/admin/MarketSelectionPicker'

type OddsSource = 'manual' | 'api'

type ComboLeg = { marketCode: string; selectionLabel: string; line: string }

type FormState = {
  external_id: string
  sport: string
  league_name: string
  country: string
  home_team: string
  away_team: string
  match_time: string
  home_team_logo: string
  away_team_logo: string
  odds_source: OddsSource
  home_odds: string
  draw_odds: string
  away_odds: string
  marketCode: string
  selectionLabel: string
  line: string
  confidence: string
  reasoning: string
  combo_enabled: boolean
  combo_side: string
  combo_reasoning: string
}

const EMPTY_COMBO_LEG: ComboLeg = { marketCode: '', selectionLabel: '', line: '' }

const EMPTY_FORM: FormState = {
  external_id: '',
  sport: 'football',
  league_name: '',
  country: '',
  home_team: '',
  away_team: '',
  match_time: '',
  home_team_logo: '',
  away_team_logo: '',
  odds_source: 'manual',
  home_odds: '',
  draw_odds: '',
  away_odds: '',
  marketCode: '1x2',
  selectionLabel: '',
  line: '',
  confidence: '70',
  reasoning: '',
  combo_enabled: false,
  combo_side: '',
  combo_reasoning: '',
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatSelection(label: string, line: string) {
  if (!label) return ''
  return line ? `${label} ${line}` : label
}

export default function ComposeEventForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [comboLegs, setComboLegs] = useState<ComboLeg[]>([{ ...EMPTY_COMBO_LEG }])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateComboLeg = (index: number, next: Partial<ComboLeg>) => {
    setComboLegs((prev) => prev.map((leg, i) => (i === index ? { ...leg, ...next } : leg)))
  }

  const addComboLeg = () => setComboLegs((prev) => [...prev, { ...EMPTY_COMBO_LEG }])
  const removeComboLeg = (index: number) => setComboLegs((prev) => prev.filter((_, i) => i !== index))

  const handleFetchOdds = () => {
    // TODO: wire this up to the real odds API (SportyBet / 1xBet feed) once it's stable.
    setResult({
      type: 'error',
      message: 'Odds API isn\u2019t connected yet \u2014 switch this field to Manual to enter a value.',
    })
  }

  const validate = (): string | null => {
    if (!form.home_team.trim() || !form.away_team.trim()) return 'Home and away team are required.'
    if (!form.league_name.trim()) return 'League name is required.'
    if (!form.match_time) return 'Match time is required.'
    if (!form.selectionLabel.trim()) return 'Pick a selection for the prediction.'
    const confidenceNum = Number(form.confidence)
    if (Number.isNaN(confidenceNum) || confidenceNum < 0 || confidenceNum > 100) {
      return 'Confidence must be a number between 0 and 100.'
    }
    if (form.odds_source === 'manual') {
      const odds = [form.home_odds, form.draw_odds, form.away_odds]
      if (odds.some((o) => o !== '' && Number.isNaN(Number(o)))) {
        return 'Odds must be numbers (or left blank).'
      }
    }
    if (form.combo_enabled) {
      if (comboLegs.length < 2) return 'A combo needs at least two selections.'
      if (comboLegs.some((leg) => !leg.marketCode || !leg.selectionLabel)) return 'Every combo leg needs a market and selection.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    const validationError = validate()
    if (validationError) {
      setResult({ type: 'error', message: validationError })
      return
    }

    setSubmitting(true)
    try {
      const externalId = form.external_id.trim() || `manual-${slugify(`${form.home_team}-${form.away_team}`)}-${Date.parse(form.match_time)}`

      const oddsData =
        form.odds_source === 'manual'
          ? {
              source: 'manual',
              market: '1x2',
              home: form.home_odds ? Number(form.home_odds) : null,
              draw: form.draw_odds ? Number(form.draw_odds) : null,
              away: form.away_odds ? Number(form.away_odds) : null,
            }
          : {
              source: 'api',
              market: '1x2',
              home: null,
              draw: null,
              away: null,
              note: 'Pending odds API integration',
            }

      // 1. Upsert the fixture (overwrites the existing row if this external_id already exists).
      const { data: fixtureRow, error: fixtureError } = await supabase
        .from('fixtures')
        .upsert(
          {
            external_id: externalId,
            sport: form.sport,
            league_name: form.league_name,
            country: form.country || null,
            home_team: form.home_team,
            away_team: form.away_team,
            match_time: new Date(form.match_time).toISOString(),
            home_team_logo: form.home_team_logo || null,
            away_team_logo: form.away_team_logo || null,
            odds_data: oddsData,
            status: 'ANALYZED',
            match_status: 'upcoming',
          },
          { onConflict: 'external_id' }
        )
        .select()
        .single()

      if (fixtureError || !fixtureRow) {
        throw fixtureError || new Error('Fixture upsert returned no row.')
      }

      // 2. Overwrite this fixture's manual prediction: clear any prior admin entry, then insert the new one.
      const { error: deleteError } = await supabase
        .from('ai_predictions')
        .delete()
        .eq('fixture_id', fixtureRow.id)
        .eq('ai_provider', 'ADMIN')

      if (deleteError) throw deleteError

      const alternatives = form.combo_enabled
        ? {
            combo: {
              side: form.combo_side || 'Combo',
              selections: comboLegs.map((leg) => `${leg.marketCode.replace(/_/g, ' ')}: ${formatSelection(leg.selectionLabel, leg.line)}`),
              reasoning: form.combo_reasoning,
            },
          }
        : null

      const { error: predictionError } = await supabase.from('ai_predictions').insert({
        fixture_id: fixtureRow.id,
        ai_provider: 'ADMIN',
        professional_name: 'Manual Entry',
        primary_market_code: form.marketCode,
        primary_selection: formatSelection(form.selectionLabel, form.line),
        primary_confidence: Math.round(Number(form.confidence)),
        reasoning: form.reasoning || null,
        alternatives,
        status: 'ANALYZED',
      })

      if (predictionError) throw predictionError

      setResult({ type: 'success', message: `Posted ${form.home_team} vs ${form.away_team} \u2014 it's now live on the dashboard.` })
      setForm({ ...EMPTY_FORM, sport: form.sport, league_name: form.league_name })
      setComboLegs([{ ...EMPTY_COMBO_LEG }])
    } catch (err: any) {
      console.error('Error posting event:', err)
      setResult({ type: 'error', message: err?.message || 'Something went wrong posting this event.' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50'
  const labelClass = 'text-[11px] uppercase tracking-wider text-gray-400 font-mono mb-1 block'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {result && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
            result.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {/* MATCH DETAILS */}
      <div className="bg-[rgba(18,23,33,0.85)] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Match details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Home team</label>
            <input className={inputClass} value={form.home_team} onChange={(e) => update('home_team', e.target.value)} placeholder="Arsenal" />
          </div>
          <div>
            <label className={labelClass}>Away team</label>
            <input className={inputClass} value={form.away_team} onChange={(e) => update('away_team', e.target.value)} placeholder="Chelsea" />
          </div>
          <div>
            <label className={labelClass}>League</label>
            <input className={inputClass} value={form.league_name} onChange={(e) => update('league_name', e.target.value)} placeholder="Premier League" />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input className={inputClass} value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="England" />
          </div>
          <div>
            <label className={labelClass}>Sport</label>
            <select className={inputClass} value={form.sport} onChange={(e) => update('sport', e.target.value)}>
              <option value="football">Football</option>
              <option value="basketball">Basketball</option>
              <option value="tennis">Tennis</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Match time</label>
            <input type="datetime-local" className={inputClass} value={form.match_time} onChange={(e) => update('match_time', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Home team logo URL (optional)</label>
            <input className={inputClass} value={form.home_team_logo} onChange={(e) => update('home_team_logo', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Away team logo URL (optional)</label>
            <input className={inputClass} value={form.away_team_logo} onChange={(e) => update('away_team_logo', e.target.value)} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>External ID (optional \u2014 leave blank to auto-generate; reuse one to overwrite that fixture)</label>
            <input className={inputClass} value={form.external_id} onChange={(e) => update('external_id', e.target.value)} placeholder="auto-generated if left blank" />
          </div>
        </div>
      </div>

      {/* ODDS */}
      <div className="bg-[rgba(18,23,33,0.85)] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Odds (1X2)</h3>
          <div className="flex items-center bg-black/30 border border-white/10 rounded-lg p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => update('odds_source', 'manual')}
              className={`px-3 py-1 rounded-md transition ${form.odds_source === 'manual' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'}`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => update('odds_source', 'api')}
              className={`px-3 py-1 rounded-md transition ${form.odds_source === 'api' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400'}`}
            >
              Odds API
            </button>
          </div>
        </div>

        {form.odds_source === 'manual' ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Home</label>
              <input className={inputClass} value={form.home_odds} onChange={(e) => update('home_odds', e.target.value)} placeholder="1.85" />
            </div>
            <div>
              <label className={labelClass}>Draw</label>
              <input className={inputClass} value={form.draw_odds} onChange={(e) => update('draw_odds', e.target.value)} placeholder="3.40" />
            </div>
            <div>
              <label className={labelClass}>Away</label>
              <input className={inputClass} value={form.away_odds} onChange={(e) => update('away_odds', e.target.value)} placeholder="4.20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-lg px-4 py-3 text-xs text-gray-400">
            <span>This event will post with a placeholder \u2014 odds fill in automatically once the odds API is wired up.</span>
            <button type="button" onClick={handleFetchOdds} className="text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 px-3 py-1 rounded-md font-bold">
              Fetch odds
            </button>
          </div>
        )}
      </div>

      {/* PREDICTION */}
      <div className="bg-[rgba(18,23,33,0.85)] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Prediction
        </h3>

        <MarketSelectionPicker
          marketCode={form.marketCode}
          selectionLabel={form.selectionLabel}
          line={form.line}
          onChange={({ marketCode, selectionLabel, line }) => setForm((prev) => ({ ...prev, marketCode, selectionLabel, line }))}
        />

        <div>
          <label className={labelClass}>Confidence (%)</label>
          <input type="number" min={0} max={100} className={`${inputClass} max-w-[140px]`} value={form.confidence} onChange={(e) => update('confidence', e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Reasoning</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={form.reasoning}
            onChange={(e) => update('reasoning', e.target.value)}
            placeholder="Why this pick \u2014 form, injuries, head-to-head, line movement..."
          />
        </div>
      </div>

      {/* COMBO */}
      <div className="bg-[rgba(18,23,33,0.85)] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" /> Combo Option
          </h3>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={form.combo_enabled} onChange={(e) => update('combo_enabled', e.target.checked)} className="accent-violet-500" />
            Include a combo pick
          </label>
        </div>

        {form.combo_enabled && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Combo label (e.g. "Home Heavy", "Goals Combo")</label>
              <input className={inputClass} value={form.combo_side} onChange={(e) => update('combo_side', e.target.value)} placeholder="Home Heavy" />
            </div>

            <div className="space-y-3">
              {comboLegs.map((leg, i) => (
                <div key={i} className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Leg {i + 1}</span>
                    {comboLegs.length > 1 && (
                      <button type="button" onClick={() => removeComboLeg(i)} className="text-red-400/70 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <MarketSelectionPicker
                    marketCode={leg.marketCode}
                    selectionLabel={leg.selectionLabel}
                    line={leg.line}
                    onChange={(next) => updateComboLeg(i, next)}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addComboLeg}
              className="flex items-center gap-1.5 text-xs text-violet-300 border border-violet-500/30 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add selection
            </button>

            <div>
              <label className={labelClass}>Why this combo</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.combo_reasoning}
                onChange={(e) => update('combo_reasoning', e.target.value)}
                placeholder="What makes these selections line up together..."
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm px-5 py-2.5 rounded-lg transition"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Post event
      </button>
    </form>
  )
}