'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GradePage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({})
  const [grading, setGrading] = useState<Record<number, { home: string; away: string }>>({})

  useEffect(() => {
    fetchUngradedMatches()
  }, [])

  // ============================================
  // FETCH UNGRADED MATCHES
  // ============================================
  async function fetchUngradedMatches() {
    setLoading(true)

    try {
      const { data: gradedRows, error: gradedError } = await supabase
        .from('prediction_grades')
        .select('match_id')

      if (gradedError) {
        console.error('Error fetching graded matches:', gradedError)
        setLoading(false)
        return
      }

      const gradedIds = gradedRows?.map((g) => g.match_id) || []

      let query = supabase
        .from('matches')
        .select(
          `
          id,
          home_team_id,
          away_team_id,
          kickoff_at,
          status,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `
        )
        .eq('status', 'analyzed')

      if (gradedIds.length > 0) {
        query = query.not('id', 'in', `(${gradedIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching ungraded matches:', error)
        setLoading(false)
        return
      }

      if (data) {
        setMatches(data)
        const initialGrading: Record<number, { home: string; away: string }> = {}
        data.forEach((m) => {
          initialGrading[m.id] = { home: '', away: '' }
        })
        setGrading(initialGrading)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // HANDLE GRADE SUBMISSION (FIXED)
  // ============================================
  async function handleGrade(matchId: number) {
    const scores = grading[matchId]
    if (!scores.home || !scores.away) {
      alert('Please enter both scores')
      return
    }

    const homeScore = parseInt(scores.home)
    const awayScore = parseInt(scores.away)

    if (isNaN(homeScore) || isNaN(awayScore)) {
      alert('Please enter valid numbers for scores')
      return
    }

    setSubmitting({ ...submitting, [matchId]: true })

    try {
      const { data: analysis, error: analysisError } = await supabase
        .from('match_analysis')
        .select('recommended_market')
        .eq('match_id', matchId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError)
        alert('Could not retrieve prediction for this match')
        setSubmitting({ ...submitting, [matchId]: false })
        return
      }

      const wasCorrect = analysis?.recommended_market
        ? evaluateMarket(analysis.recommended_market, homeScore, awayScore)
        : null

      // ✅ FIX: Use upsert() instead of insert()
      const { error: upsertError } = await supabase
        .from('prediction_grades')
        .upsert(
          {
            match_id: matchId,
            actual_home_score: homeScore,
            actual_away_score: awayScore,
            predicted_market: analysis?.recommended_market || null,
            was_correct: wasCorrect,
            graded_at: new Date().toISOString(),
          },
          { onConflict: 'match_id' }
        )

      if (upsertError) {
        console.error('Error saving grade:', upsertError)
        alert(`Failed to save grade: ${upsertError.message}`)
        setSubmitting({ ...submitting, [matchId]: false })
        return
      }

      setMatches(matches.filter((m) => m.id !== matchId))
      const newGrading = { ...grading }
      delete newGrading[matchId]
      setGrading(newGrading)
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    } finally {
      setSubmitting({ ...submitting, [matchId]: false })
    }
  }

  // ============================================
  // EVALUATE MARKET
  // ============================================
  function evaluateMarket(market: string, homeScore: number, awayScore: number): boolean | null {
    const normalized = market?.toLowerCase() || ''

    switch (normalized) {
      case 'home_win':
        return homeScore > awayScore
      case 'away_win':
        return awayScore > homeScore
      case 'draw':
        return homeScore === awayScore
      case 'over_0.5':
      case 'over_1.5':
      case 'over_2.5':
      case 'over_3.5':
        return homeScore + awayScore > 2.5
      case 'under_0.5':
      case 'under_1.5':
      case 'under_2.5':
      case 'under_3.5':
        return homeScore + awayScore < 2.5
      case 'btts_yes':
        return homeScore > 0 && awayScore > 0
      case 'btts_no':
        return homeScore === 0 || awayScore === 0
      default:
        return null
    }
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading matches...</p>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Grade Predictions</h1>
        <p className="text-gray-400 mb-6">
          Enter the actual scores for matches that have finished. This helps track prediction
          accuracy.
        </p>

        {matches.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400">
              🎉 No matches to grade. All predictions are already graded!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">
                      {match.home_team?.name || 'Unknown'} vs{' '}
                      {match.away_team?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {match.kickoff_at
                        ? new Date(match.kickoff_at).toLocaleString()
                        : 'Date unknown'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Home"
                      className="w-16 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-center focus:outline-none focus:border-emerald-500/50"
                      value={grading[match.id]?.home || ''}
                      onChange={(e) => {
                        setGrading({
                          ...grading,
                          [match.id]: { ...grading[match.id], home: e.target.value },
                        })
                      }}
                      disabled={submitting[match.id]}
                    />
                    <span className="text-gray-500 font-medium">-</span>
                    <input
                      type="number"
                      placeholder="Away"
                      className="w-16 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-center focus:outline-none focus:border-emerald-500/50"
                      value={grading[match.id]?.away || ''}
                      onChange={(e) => {
                        setGrading({
                          ...grading,
                          [match.id]: { ...grading[match.id], away: e.target.value },
                        })
                      }}
                      disabled={submitting[match.id]}
                    />
                    <button
                      onClick={() => handleGrade(match.id)}
                      disabled={submitting[match.id]}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded text-sm font-medium transition"
                    >
                      {submitting[match.id] ? 'Saving...' : 'Grade'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}