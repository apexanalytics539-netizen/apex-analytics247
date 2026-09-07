'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Send, Paperclip, Loader2, BrainCircuit, Image as ImageIcon,
  X, Copy, Check, Save, Volume2, VolumeX, Mic, Info,
  ChevronDown, ChevronUp, Layers, Rocket, FilePenLine
} from 'lucide-react'
import { mapConfidenceToNumber, guessMarketCode, buildExternalId, parseMatchTime, buildComposeDraft, type ComposeDraft } from '@/lib/aiShipping'

const SESSION_KEY = 'apex_admin_analyze_v1'
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

const PROFESSIONAL_NAMES: Record<string, string> = {
  Gemini: 'QuantVantage Alpha',
  Groq: 'Stratagem Neural-X',
  Mistral: 'MetricPulse Engine',
  NVIDIA: 'Stochastic Core-R1',
  OpenRouter: 'NexusOdds Vector',
}

// ============================================
// COMPONENT: Form Badges (W/D/L)
// ============================================
const FormBadges = ({ results }: { results: string[] }) => (
  <div className="flex gap-1">
    {results.map((res, idx) => {
      const upper = res.toUpperCase()
      const bgColor = upper === 'W' ? 'bg-emerald-500' : upper === 'D' ? 'bg-amber-500' : upper === 'L' ? 'bg-red-500' : 'bg-gray-600'
      return (
        <span key={idx} className={`${bgColor} text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded`}>
          {upper}
        </span>
      )
    })}
  </div>
)

// ============================================
// COMPONENT: Team Stats Card
// ============================================
const TeamStatsCard = ({
  teamName, isHome, form, avgScored, avgConceded, injuries, tablePosition, gamesPlayed,
  xg, shotsOnTarget, bigChances, goalsPerGameRecent, badgeUrl,
}: {
  teamName: string; isHome: boolean; form: string[]; avgScored?: string; avgConceded?: string; injuries?: string[]
  tablePosition?: number | null; gamesPlayed?: number | null; xg?: number | null; shotsOnTarget?: number | null
  bigChances?: number | null; goalsPerGameRecent?: number | null; badgeUrl?: string | null
}) => {
  const borderColor = isHome ? 'border-blue-500' : 'border-purple-500'
  const titleColor = isHome ? 'text-blue-400' : 'text-purple-400'
  const hasScoringProfile = xg != null || shotsOnTarget != null || bigChances != null || goalsPerGameRecent != null

  return (
    <div className={`p-3 bg-slate-800/80 rounded-lg border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {badgeUrl && <img src={badgeUrl} alt={`${teamName} badge`} className="w-5 h-5 object-contain flex-shrink-0" />}
          <h3 className={`font-bold ${titleColor} text-sm`}>{teamName}</h3>
        </div>
        {tablePosition != null && (
          <span className="text-[10px] text-gray-400">Pos {tablePosition}{gamesPlayed != null ? ` \u00b7 ${gamesPlayed} GP` : ''}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-gray-400">Form:</span>
        <FormBadges results={form} />
      </div>
      {avgScored && <p className="text-xs text-slate-300">Avg Goals Scored: {avgScored}</p>}
      {avgConceded && <p className="text-xs text-slate-300">Avg Goals Conceded: {avgConceded}</p>}
      {hasScoringProfile && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-2 gap-x-3 gap-y-0.5">
          {goalsPerGameRecent != null && <span className="text-[10px] text-slate-400">Goals/game (recent): <span className="text-slate-200 font-semibold">{goalsPerGameRecent}</span></span>}
          {xg != null && <span className="text-[10px] text-slate-400">xG: <span className="text-slate-200 font-semibold">{xg}</span></span>}
          {shotsOnTarget != null && <span className="text-[10px] text-slate-400">Shots on target: <span className="text-slate-200 font-semibold">{shotsOnTarget}</span></span>}
          {bigChances != null && <span className="text-[10px] text-slate-400">Big chances: <span className="text-slate-200 font-semibold">{bigChances}</span></span>}
        </div>
      )}
      {injuries && injuries.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] text-red-400">Injuries: {injuries.join(', ')}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPONENT: H2H History
// ============================================
const H2HHistory = ({ matches }: { matches: string[] }) => {
  if (!matches || matches.length === 0) return null
  return (
    <div className="bg-slate-800/50 p-3 rounded-lg">
      <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Head-to-Head History</h4>
      <ul className="text-xs text-slate-300 space-y-1">
        {matches.map((match, idx) => (
          <li key={idx} className="flex justify-between border-b border-slate-700/50 pb-1">
            <span>{match}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ============================================
// COMPONENT: Other Model Predictions
// ============================================
const OtherPredictions = ({
  predictions, winningMarket, winningSelection,
}: {
  predictions: { provider: string; market: string; selection: string }[]; winningMarket: string; winningSelection: string
}) => {
  const [expanded, setExpanded] = useState(false)
  if (!predictions || predictions.length <= 1) return null

  return (
    <div className="bg-slate-800/40 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 text-left">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">What each model proposed ({predictions.length})</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {expanded && (
        <ul className="px-3 pb-3 space-y-1">
          {predictions.map((p, i) => {
            const isWinner = p.market === winningMarket && p.selection === winningSelection
            return (
              <li key={i} className={`text-xs flex justify-between ${isWinner ? 'text-emerald-400' : 'text-gray-400'}`}>
                <span>{PROFESSIONAL_NAMES[p.provider] || p.provider}</span>
                <span>{p.market}{p.selection ? ` - ${p.selection}` : ''}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ============================================
// COMPONENT: Combo Display (ship actions instead of bet-slip)
// ============================================
const ComboDisplay = ({
  combo, onShipToDashboard, onShipToCompose, shipped, shipping,
}: {
  combo: { side: string; selections: string[]; reasoning: string; model_agreement?: string }
  onShipToDashboard?: () => void
  onShipToCompose?: () => void
  shipped?: boolean
  shipping?: boolean
}) => {
  if (!combo || !combo.selections || combo.selections.length === 0) return null

  return (
    <div className="mt-3 p-4 bg-violet-500/5 border border-violet-500/25 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <h3 className="font-bold text-violet-400 text-sm">Combo Option - {combo.side}</h3>
        </div>
        {combo.model_agreement && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-violet-300 border-violet-500/30 bg-violet-500/10">{combo.model_agreement} models</span>
        )}
      </div>
      <ul className="space-y-1 mb-3">
        {combo.selections.map((sel, i) => (
          <li key={i} className="text-sm text-violet-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
            {sel}
          </li>
        ))}
      </ul>
      <div className="p-3 bg-slate-800/50 rounded-lg">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Why this combo</p>
        <p className="text-sm text-gray-300">{combo.reasoning}</p>
      </div>
      <div className="mt-3 flex gap-2">
        {onShipToDashboard && (
          <button
            onClick={onShipToDashboard}
            disabled={shipped || shipping}
            className="text-xs px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-60 text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center gap-1.5"
          >
            {shipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : shipped ? <Check className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
            {shipped ? 'Shipped' : 'Ship Combo to Dashboard'}
          </button>
        )}
        {onShipToCompose && (
          <button
            onClick={onShipToCompose}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 flex items-center gap-1.5"
          >
            <FilePenLine className="w-3.5 h-3.5" /> Ship to Compose Event
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// COMPONENT: Prediction Display (ship actions instead of bet-slip)
// ============================================
const PredictionDisplay = ({
  prediction, combo, otherPredictions, onShipToDashboard, onShipToCompose, onShipCombo, onComboToCompose,
  shippedDashboard, shippingDashboard, shippedCombo, shippingCombo,
}: {
  prediction: any
  combo?: { side: string; selections: string[]; reasoning: string; model_agreement?: string } | null
  otherPredictions?: { provider: string; market: string; selection: string }[]
  onShipToDashboard?: () => void
  onShipToCompose?: () => void
  onShipCombo?: () => void
  onComboToCompose?: () => void
  shippedDashboard?: boolean
  shippingDashboard?: boolean
  shippedCombo?: boolean
  shippingCombo?: boolean
}) => {
  if (!prediction) return null

  const isInsufficient = prediction.market === 'insufficient_data'
  const market = prediction.market || 'Unable to determine'
  const selection = prediction.selection || ''
  const reasoning = prediction.reasoning || 'No reasoning provided'
  const agreement = prediction.model_agreement || 'N/A'
  const confidence = prediction.confidence || 'LOW'
  const oddsAvailable = prediction.odds_available

  const confidenceColors = {
    HIGH: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    MEDIUM: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    LOW: 'text-red-400 border-red-500/30 bg-red-500/10',
  }

  if (isInsufficient) {
    return (
      <div className="mt-4 p-4 bg-slate-700/20 border border-slate-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-gray-400" />
          <h3 className="font-bold text-gray-300 text-sm">No Confident Pick Available</h3>
        </div>
        <p className="text-sm text-gray-400">{reasoning}</p>
        <p className="text-xs text-gray-500 mt-2">Try adding more detail - recent form, head-to-head history, odds, or lineups - for a confident recommendation.</p>
        {otherPredictions && (
          <div className="mt-3">
            <OtherPredictions predictions={otherPredictions} winningMarket={market} winningSelection={selection} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-emerald-400 text-sm">Prediction Ready</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${confidenceColors[confidence as keyof typeof confidenceColors] || confidenceColors.LOW}`}>{confidence}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Market</p>
          <p className="text-sm font-semibold">{market}</p>
        </div>
        {selection && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Selection</p>
            <p className="text-sm font-semibold">{selection}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Model Agreement</p>
          <p className="text-sm font-semibold">{agreement}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Odds Available</p>
          <p className="text-sm font-semibold">{oddsAvailable !== undefined ? (oddsAvailable ? 'Yes' : 'No') : 'N/A'}</p>
        </div>
      </div>

      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Reasoning</p>
        <p className="text-sm text-gray-300">{reasoning}</p>
      </div>

      {confidence === 'LOW' && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400"><strong>Low Confidence:</strong> Only {agreement} of models agreed on this prediction.</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {onShipToDashboard && (
          <button
            onClick={onShipToDashboard}
            disabled={shippedDashboard || shippingDashboard}
            className="text-xs px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-60 text-emerald-400 rounded-lg border border-emerald-500/30 flex items-center gap-1.5"
          >
            {shippingDashboard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : shippedDashboard ? <Check className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
            {shippedDashboard ? 'Shipped to Dashboard' : 'Ship to Dashboard'}
          </button>
        )}
        {onShipToCompose && (
          <button
            onClick={onShipToCompose}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 flex items-center gap-1.5"
          >
            <FilePenLine className="w-3.5 h-3.5" /> Ship to Compose Event
          </button>
        )}
      </div>

      {combo && (
        <ComboDisplay combo={combo} onShipToDashboard={onShipCombo} onShipToCompose={onComboToCompose} shipped={shippedCombo} shipping={shippingCombo} />
      )}

      {otherPredictions && (
        <div className="mt-3">
          <OtherPredictions predictions={otherPredictions} winningMarket={market} winningSelection={selection} />
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AIPerformanceAnalyze({ onShipToCompose }: { onShipToCompose: (draft: ComposeDraft) => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string; raw?: any }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({})
  const [premiumVoice, setPremiumVoice] = useState(true)
  const [shippedDashboard, setShippedDashboard] = useState<{ [key: number]: boolean }>({})
  const [shippingDashboard, setShippingDashboard] = useState<{ [key: number]: boolean }>({})
  const [shippedCombo, setShippedCombo] = useState<{ [key: number]: boolean }>({})
  const [shippingCombo, setShippingCombo] = useState<{ [key: number]: boolean }>({})
  const [sessionRestored, setSessionRestored] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY)
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        const age = Date.now() - (parsed.startedAt || 0)
        if (age < SESSION_MAX_AGE_MS) setMessages(parsed.messages || [])
        else localStorage.removeItem(SESSION_KEY)
      }
    } catch (e) {
      console.error('Failed to restore session:', e)
    } finally {
      setSessionRestored(true)
    }
  }, [])

  useEffect(() => {
    if (!sessionRestored) return
    try {
      const existing = localStorage.getItem(SESSION_KEY)
      const startedAt = existing ? JSON.parse(existing).startedAt : Date.now()
      localStorage.setItem(SESSION_KEY, JSON.stringify({ messages, startedAt }))
    } catch (e) {
      console.error('Failed to persist session:', e)
    }
  }, [messages, sessionRestored])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedImage(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ============================================
  // SHIP TO DASHBOARD - publishes immediately (fixture + ai_predictions rows)
  // ============================================
  const shipToDashboard = async (index: number, data: any, combo = false) => {
    const setBusy = combo ? setShippingCombo : setShippingDashboard
    const setDone = combo ? setShippedCombo : setShippedDashboard
    setBusy((prev) => ({ ...prev, [index]: true }))
    try {
      const pass1 = data.pass1_used || {}
      const consensus = data.consensus || {}
      const prediction = consensus.prediction || {}
      const comboData = consensus.combo
      const otherPredictions: { provider: string; market: string; selection: string }[] = data.otherPredictions || []

      const matchIso = parseMatchTime(pass1.match_time)
      const externalId = buildExternalId(pass1.home_team, pass1.away_team, matchIso)

      const { data: fixtureRow, error: fixtureError } = await supabase
        .from('fixtures')
        .upsert(
          {
            external_id: externalId,
            sport: 'football',
            league_name: pass1.competition || null,
            home_team: pass1.home_team || 'Home',
            away_team: pass1.away_team || 'Away',
            match_time: matchIso,
            status: 'ANALYZED',
            match_status: 'upcoming',
          },
          { onConflict: 'external_id' }
        )
        .select()
        .single()

      if (fixtureError || !fixtureRow) throw fixtureError || new Error('Fixture upsert failed')

      // Overwrite: this analysis fully replaces whatever predictions this fixture had.
      const { error: deleteError } = await supabase.from('ai_predictions').delete().eq('fixture_id', fixtureRow.id)
      if (deleteError) throw deleteError

      const confidenceNum = mapConfidenceToNumber(prediction.confidence)
      const alternatives = comboData ? { combo: comboData, model_agreement: prediction.model_agreement } : prediction.model_agreement ? { model_agreement: prediction.model_agreement } : null

      const rows =
        otherPredictions.length > 0
          ? otherPredictions.map((p) => {
              const isWinner = p.market === prediction.market && p.selection === prediction.selection
              return {
                fixture_id: fixtureRow.id,
                ai_provider: p.provider,
                professional_name: PROFESSIONAL_NAMES[p.provider] || p.provider,
                primary_market_code: guessMarketCode(p.market),
                primary_selection: p.selection,
                primary_confidence: confidenceNum,
                reasoning: isWinner ? prediction.reasoning : null,
                alternatives: isWinner ? alternatives : null,
                status: 'ANALYZED',
              }
            })
          : [
              {
                fixture_id: fixtureRow.id,
                ai_provider: 'AI_CONSENSUS',
                professional_name: 'AI Consensus (5-Model)',
                primary_market_code: guessMarketCode(prediction.market),
                primary_selection: prediction.selection || '',
                primary_confidence: confidenceNum,
                reasoning: prediction.reasoning || null,
                alternatives,
                status: 'ANALYZED',
              },
            ]

      const { error: insertError } = await supabase.from('ai_predictions').insert(rows)
      if (insertError) throw insertError

      setDone((prev) => ({ ...prev, [index]: true }))
    } catch (err: any) {
      console.error('Ship to dashboard failed:', err)
      alert(`Failed to ship to dashboard: ${err.message}`)
    } finally {
      setBusy((prev) => ({ ...prev, [index]: false }))
    }
  }

  // ============================================
  // RENDER AI RESPONSE (plain-text version, for copy/save)
  // ============================================
  const renderAIResponse = (data: any) => {
    const consensus = data.consensus || {}
    const prediction = consensus.prediction || {}
    const combo = consensus.combo
    let msg = ''

    if (consensus.assumptions?.length) {
      msg += `Assumptions:\n`
      consensus.assumptions.forEach((a: string) => (msg += `- ${a}\n`))
      msg += `\n`
    }
    if (consensus.data_used?.length) {
      msg += `Data Used:\n`
      consensus.data_used.forEach((d: string) => (msg += `- ${d}\n`))
      msg += `\n`
    }

    const market = prediction.market === 'insufficient_data' ? 'No confident pick - insufficient data' : prediction.market || 'Unable to determine'
    const selection = prediction.selection || ''
    const agreement = prediction.model_agreement || 'Not available'
    const reasoning = prediction.reasoning || 'No reasoning provided'
    const confidence = prediction.confidence || 'LOW'

    if (prediction.market === 'insufficient_data') {
      msg += `No Confident Pick Available\n\nReasoning: ${reasoning}\n\n`
    } else {
      msg += `Prediction Ready\n\nMarket: ${market}\n`
      if (selection) msg += `Selection: ${selection}\n`
      msg += `Model agreement: ${agreement}\nConfidence: ${confidence}\nReasoning: ${reasoning}\n\n`
    }

    if (combo?.selections?.length) {
      msg += `Combo Option - ${combo.side}\n`
      combo.selections.forEach((s: string) => (msg += `- ${s}\n`))
      msg += `Why: ${combo.reasoning}\n\n`
    }

    msg += `Confidence reflects data completeness and model agreement, not certainty of outcome.`
    return { text: msg, raw: { consensus, pass1: data.pass1_used, prediction, combo } }
  }

  // ============================================
  // HANDLE ANALYZE
  // ============================================
  const handleAnalyze = async () => {
    if (!input.trim() && !selectedImage) {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Please provide some text or upload an image to begin the analysis.' }])
      return
    }

    let userMessage = input.trim()
    if (selectedImage) userMessage += userMessage ? `\n[Image attached: ${selectedImage.name}]` : `[Image attached: ${selectedImage.name}]`

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setInput('')
    setLoading(true)

    try {
      let payload: any = { input: userMessage, userId: 'admin' }

      if (selectedImage) {
        const reader = new FileReader()
        const imageData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(selectedImage)
        })
        payload.image = imageData
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-with-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        setMessages((prev) => [...prev, { role: 'ai', content: `Analysis failed: ${data.error}` }])
      } else {
        const rendered = renderAIResponse(data)
        setMessages((prev) => [...prev, { role: 'ai', content: rendered.text, raw: data }])
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: 'ai', content: `Connection failed: ${error.message}` }])
    } finally {
      setLoading(false)
      removeImage()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  // ============================================
  // VOICE / TTS
  // ============================================
  const callTTSEdgeFunction = async (text: string, provider: 'openrouter' | 'elevenlabs'): Promise<string | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ text, provider }),
      })
      const data = await response.json()
      if (data.fallback || !data.audio) return null
      return data.audio as string
    } catch {
      return null
    }
  }

  const playBase64Audio = (base64Audio: string, index: number) => {
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' })
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    audio.onended = () => { setIsPlaying((prev) => ({ ...prev, [index]: false })); URL.revokeObjectURL(audioUrl) }
    audio.onerror = () => { setIsPlaying((prev) => ({ ...prev, [index]: false })); URL.revokeObjectURL(audioUrl) }
    audio.play()
  }

  const trySpeakWithBrowser = (text: string, index: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) { resolve(false); return }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      let settled = false
      utterance.onstart = () => { if (settled) return; settled = true; resolve(true) }
      utterance.onerror = () => { setIsPlaying((prev) => ({ ...prev, [index]: false })); if (settled) return; settled = true; resolve(false) }
      utterance.onend = () => setIsPlaying((prev) => ({ ...prev, [index]: false }))
      window.speechSynthesis.speak(utterance)
      setTimeout(() => { if (!settled) { settled = true; resolve(true) } }, 400)
    })
  }

  const playAudio = async (text: string, index: number) => {
    if (isPlaying[index]) return
    setIsPlaying((prev) => ({ ...prev, [index]: true }))
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[#*_`]/g, '')

    if (!premiumVoice) { trySpeakWithBrowser(cleanText, index); return }

    const openRouterAudio = await callTTSEdgeFunction(cleanText, 'openrouter')
    if (openRouterAudio) { playBase64Audio(openRouterAudio, index); return }

    const browserWorked = await trySpeakWithBrowser(cleanText, index)
    if (browserWorked) return

    const elevenLabsAudio = await callTTSEdgeFunction(cleanText, 'elevenlabs')
    if (elevenLabsAudio) { playBase64Audio(elevenLabsAudio, index); return }

    setIsPlaying((prev) => ({ ...prev, [index]: false }))
  }

  // ============================================
  // COPY / SAVE
  // ============================================
  const copyConversation = () => {
    const text = messages.map((m) => `${m.role === 'user' ? 'Admin' : 'AI'}: ${m.content}`).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const saveConversation = () => {
    const text = messages.map((m) => `${m.role === 'user' ? 'Admin' : 'AI'}: ${m.content}`).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apex-analytics-admin-analysis-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ============================================
  // RENDER MESSAGE
  // ============================================
  const renderMessage = (msg: any, index: number) => {
    if (msg.role === 'user') {
      return (
        <div key={index} className="flex justify-end">
          <div className="max-w-[85%] p-5 rounded-xl text-sm leading-relaxed bg-indigo-600/20 border border-indigo-500/30 text-indigo-100">{msg.content}</div>
        </div>
      )
    }

    const raw = msg.raw
    const consensus = raw?.consensus || {}
    const pass1 = raw?.pass1_used || {}
    const prediction = consensus.prediction || {}
    const combo = consensus.combo
    const otherPredictions = raw?.otherPredictions
    const isInsufficient = prediction.market === 'insufficient_data'
    const confidence = prediction.confidence || 'LOW'
    const scoringProfile = pass1.scoring_profile || {}
    const tablePosition = pass1.table_position || {}

    return (
      <div key={index} className="flex justify-start">
        <div className="max-w-[90%] p-5 rounded-xl text-sm leading-relaxed bg-white/5 border border-white/10 text-gray-200 w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-[10px] font-mono">Apex AI Engine</span>
              {!isInsufficient && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    confidence === 'HIGH' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : confidence === 'MEDIUM' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}
                >
                  {confidence}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => playAudio(msg.content, index)} disabled={isPlaying[index]} className="text-gray-400 hover:text-emerald-400 transition">
                {isPlaying[index] ? (
                  <div className="relative">
                    <VolumeX className="w-4 h-4 animate-pulse text-emerald-400" />
                    <span className="absolute inset-[-4px] rounded-full border-2 border-emerald-400/50 animate-ping" />
                  </div>
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-6 right-0 w-64 bg-black/90 border border-white/10 p-3 rounded-xl text-xs text-gray-300 hidden group-hover:block z-10">
                  Confidence reflects data completeness and model agreement, not certainty of outcome.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {consensus.assumptions?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Assumptions</h4>
                <ul className="text-xs text-gray-300 list-disc pl-4 mt-1 space-y-0.5">
                  {consensus.assumptions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            {consensus.data_used?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Data Used</h4>
                <ul className="text-xs text-gray-300 list-disc pl-4 mt-1 space-y-0.5">
                  {consensus.data_used.map((d: string, i: number) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {pass1.home_team && pass1.away_team && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <TeamStatsCard
                  teamName={pass1.home_team} isHome={true}
                  form={pass1.home_team_form?.map((f: any) => f.result).filter(Boolean) || []}
                  injuries={pass1.injuries?.home} tablePosition={tablePosition.home} gamesPlayed={tablePosition.games_played_home}
                  xg={scoringProfile.home_xg} shotsOnTarget={scoringProfile.home_shots_on_target}
                  bigChances={scoringProfile.home_big_chances} goalsPerGameRecent={scoringProfile.home_goals_per_game_recent}
                />
                <TeamStatsCard
                  teamName={pass1.away_team} isHome={false}
                  form={pass1.away_team_form?.map((f: any) => f.result).filter(Boolean) || []}
                  injuries={pass1.injuries?.away} tablePosition={tablePosition.away} gamesPlayed={tablePosition.games_played_away}
                  xg={scoringProfile.away_xg} shotsOnTarget={scoringProfile.away_shots_on_target}
                  bigChances={scoringProfile.away_big_chances} goalsPerGameRecent={scoringProfile.away_goals_per_game_recent}
                />
              </div>
            )}

            {pass1.h2h && <H2HHistory matches={pass1.h2h.split('\n').filter(Boolean)} />}

            {pass1.odds && (pass1.odds.home_win || pass1.odds.draw || pass1.odds.away_win) && (
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Odds</h4>
                <div className="flex gap-4 text-sm">
                  <span><span className="text-gray-400">Home:</span> <span className="font-bold text-emerald-400">{pass1.odds.home_win || 'N/A'}</span></span>
                  <span><span className="text-gray-400">Draw:</span> <span className="font-bold text-amber-400">{pass1.odds.draw || 'N/A'}</span></span>
                  <span><span className="text-gray-400">Away:</span> <span className="font-bold text-red-400">{pass1.odds.away_win || 'N/A'}</span></span>
                </div>
              </div>
            )}

            <PredictionDisplay
              prediction={prediction}
              combo={combo}
              otherPredictions={otherPredictions}
              onShipToDashboard={!isInsufficient ? () => shipToDashboard(index, raw) : undefined}
              onShipToCompose={!isInsufficient ? () => onShipToCompose(buildComposeDraft(raw)) : undefined}
              onShipCombo={combo ? () => shipToDashboard(index, raw, true) : undefined}
              onComboToCompose={combo ? () => onShipToCompose(buildComposeDraft(raw)) : undefined}
              shippedDashboard={!!shippedDashboard[index]}
              shippingDashboard={!!shippingDashboard[index]}
              shippedCombo={!!shippedCombo[index]}
              shippingCombo={!!shippingCombo[index]}
            />

            <div className="text-[10px] text-gray-500 text-center border-t border-white/5 pt-2">
              Confidence reflects data completeness and model agreement, not certainty of outcome.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)]">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">Analyze &amp; Ship</h2>
          <p className="text-xs text-slate-500 mt-0.5">Same 5-model analysis engine as the user-facing Analyze chat &mdash; ship straight to the dashboard, or send to Compose Event to review first.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyConversation} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white" title="Copy conversation">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={saveConversation} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white" title="Save conversation">
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setPremiumVoice(!premiumVoice)}
            className={`p-2 rounded-lg transition border ${premiumVoice ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-gray-400 bg-white/5'}`}
            title="Toggle Premium Voice"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-slate-600 text-sm px-8">
            Paste match details (form, odds, H2H, lineups, injuries) below to run the 5-model analysis.
          </div>
        )}
        {messages.map((msg, index) => renderMessage(msg, index))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-emerald-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Contacting analyst network...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-3 rounded-2xl space-y-3">
        {selectedImage && (
          <div className="flex items-center gap-2 bg-black/60 p-2 rounded-lg border border-white/10 w-fit">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] text-gray-400">{selectedImage.name}</span>
            <button onClick={removeImage} className="text-red-400 hover:text-red-300 ml-2 text-[10px]"><X className="w-3 h-3" /></button>
          </div>
        )}

        <div className="flex gap-2 items-start">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition text-gray-400 hover:text-white flex-shrink-0 mt-1"
            title="Attach an image (odds slip, lineup sheet, etc.)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500/30 min-h-[44px] max-h-48 overflow-y-auto whitespace-pre-wrap resize-none"
            placeholder="Paste match details (form, odds, H2H, lineups, injuries)..."
          />

          <button
            onClick={handleAnalyze}
            disabled={loading || (!input.trim() && !selectedImage)}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition text-white flex-shrink-0 mt-1"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}