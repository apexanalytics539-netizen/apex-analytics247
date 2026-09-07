import { MARKET_GROUPS } from '@/lib/marketOptions'

export type ComboLegDraft = { marketCode: string; selectionLabel: string; line: string }

export type ComposeDraft = {
  sport: string
  league_name: string
  country: string
  home_team: string
  away_team: string
  match_time: string // yyyy-MM-ddTHH:mm, suitable for <input type="datetime-local">
  marketCode: string
  selectionLabel: string
  line: string
  confidence: string
  reasoning: string
  combo: { side: string; legs: ComboLegDraft[]; reasoning: string } | null
}

// The analyze-with-ai edge function returns a qualitative confidence
// (HIGH/MEDIUM/LOW), but our DB column is a 0-100 integer. This mapping is
// a deliberate simplification, not a measured probability - admins can
// still see the original HIGH/MEDIUM/LOW label in the chat before shipping.
export function mapConfidenceToNumber(label: string | undefined): number {
  if (label === 'HIGH') return 85
  if (label === 'MEDIUM') return 65
  return 40
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function buildExternalId(homeTeam: string, awayTeam: string, matchTimeIso: string | null) {
  const timePart = matchTimeIso ? Date.parse(matchTimeIso) : Date.now()
  return `ai-${slugify(`${homeTeam || 'home'}-${awayTeam || 'away'}`)}-${timePart}`
}

// Best-effort ISO string; returns null if unparseable (fixture.match_time is
// a nullable column, so this is fine to leave blank).
export function parseMatchTime(raw: any): string | null {
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

// yyyy-MM-ddTHH:mm for the <input type="datetime-local"> in Compose Event.
export function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

// Best-effort match from the AI's free-text market name to one of our
// curated market codes. Falls back to '1x2' if nothing matches - the admin
// can always correct it in the picker before posting.
export function guessMarketCode(marketText: string | undefined): string {
  if (!marketText) return '1x2'
  const q = marketText.toLowerCase()
  const scored = MARKET_GROUPS.map((m) => ({
    code: m.code,
    score: q.includes(m.label.toLowerCase()) || m.label.toLowerCase().includes(q) ? 2 : 0,
  }))
  const best = scored.sort((a, b) => b.score - a.score)[0]
  if (best && best.score > 0) return best.code
  if (q.includes('over') || q.includes('under')) return 'over_under'
  if (q.includes('both team') || q.includes('btts') || q.includes('gg')) return 'btts'
  if (q.includes('double chance')) return 'double_chance'
  if (q.includes('handicap')) return 'handicap'
  if (q.includes('correct score')) return 'correct_score'
  return '1x2'
}

export function buildComposeDraft(data: any): ComposeDraft {
  const pass1 = data.pass1_used || {}
  const consensus = data.consensus || {}
  const prediction = consensus.prediction || {}
  const combo = consensus.combo

  const matchIso = parseMatchTime(pass1.match_time)

  return {
    sport: 'football',
    league_name: pass1.competition || '',
    country: '',
    home_team: pass1.home_team || '',
    away_team: pass1.away_team || '',
    match_time: toDatetimeLocal(matchIso),
    marketCode: guessMarketCode(prediction.market),
    selectionLabel: prediction.selection || '',
    line: '',
    confidence: String(mapConfidenceToNumber(prediction.confidence)),
    reasoning: prediction.reasoning || '',
    combo:
      combo && combo.selections && combo.selections.length > 0
        ? {
            side: combo.side || 'Combo',
            reasoning: combo.reasoning || '',
            legs: combo.selections.map((s: string) => ({ marketCode: guessMarketCode(s), selectionLabel: s, line: '' })),
          }
        : null,
  }
}