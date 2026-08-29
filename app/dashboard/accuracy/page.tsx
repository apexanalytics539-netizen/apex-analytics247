'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  CheckCircle, XCircle, BarChart3, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts'

interface Grade {
  id: number
  match_id: number
  actual_home_score: number
  actual_away_score: number
  predicted_market: string
  was_correct: boolean | null
  graded_at: string
  match: {
    home_team: { id: number; name: string } | null
    away_team: { id: number; name: string } | null
    kickoff_at: string
  } | null
}

interface AccuracyStats {
  total: number
  correct: number
  incorrect: number
  accuracy_percentage: number
  by_market: Record<string, { total: number; correct: number }>
  monthly: Record<string, { total: number; correct: number }>
}

export default function AccuracyPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [stats, setStats] = useState<AccuracyStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    accuracy_percentage: 0,
    by_market: {},
    monthly: {}
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
  const [marketFilter, setMarketFilter] = useState<string>('all')

  useEffect(() => {
    loadGrades()
  }, [])

  const loadGrades = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('prediction_grades')
        .select(`
          id,
          match_id,
          actual_home_score,
          actual_away_score,
          predicted_market,
          was_correct,
          graded_at,
          match:match_id (
            home_team:home_team_id (id, name),
            away_team:away_team_id (id, name),
            kickoff_at
          )
        `)
        .not('was_correct', 'is', null)
        .order('graded_at', { ascending: false })

      if (error) {
        console.error('Error loading grades:', error)
        setLoading(false)
        return
      }

      // ✅ Type-safe mapping
      const typedGrades: Grade[] = (data || []).map((item: any) => ({
        id: item.id,
        match_id: item.match_id,
        actual_home_score: item.actual_home_score,
        actual_away_score: item.actual_away_score,
        predicted_market: item.predicted_market || 'unknown',
        was_correct: item.was_correct,
        graded_at: item.graded_at,
        match: item.match ? {
          home_team: item.match.home_team ? {
            id: item.match.home_team.id,
            name: item.match.home_team.name
          } : null,
          away_team: item.match.away_team ? {
            id: item.match.away_team.id,
            name: item.match.away_team.name
          } : null,
          kickoff_at: item.match.kickoff_at
        } : null
      }))

      setGrades(typedGrades)
      calculateStats(typedGrades)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Grade[]) => {
    const total = data.length
    const correct = data.filter(g => g.was_correct === true).length
    const incorrect = data.filter(g => g.was_correct === false).length

    const by_market: Record<string, { total: number; correct: number }> = {}
    const monthly: Record<string, { total: number; correct: number }> = {}

    data.forEach(g => {
      const market = g.predicted_market || 'unknown'
      if (!by_market[market]) {
        by_market[market] = { total: 0, correct: 0 }
      }
      by_market[market].total++
      if (g.was_correct) by_market[market].correct++

      const month = new Date(g.graded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthly[month]) {
        monthly[month] = { total: 0, correct: 0 }
      }
      monthly[month].total++
      if (g.was_correct) monthly[month].correct++
    })

    setStats({
      total,
      correct,
      incorrect,
      accuracy_percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      by_market,
      monthly
    })
  }

  const getFilteredGrades = (): Grade[] => {
    let filtered = [...grades]
    if (filter === 'correct') {
      filtered = filtered.filter(g => g.was_correct === true)
    } else if (filter === 'incorrect') {
      filtered = filtered.filter(g => g.was_correct === false)
    }
    if (marketFilter !== 'all') {
      filtered = filtered.filter(g => g.predicted_market === marketFilter)
    }
    return filtered
  }

  const marketData = Object.entries(stats.by_market).map(([name, data]) => ({
    name,
    total: data.total,
    correct: data.correct,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  }))

  const monthlyData = Object.entries(stats.monthly).map(([month, data]) => ({
    month,
    total: data.total,
    correct: data.correct,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  }))

  const pieData = [
    { name: 'Correct', value: stats.correct },
    { name: 'Incorrect', value: stats.incorrect }
  ]

  const COLORS = ['#10B981', '#EF4444']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading accuracy data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">📊 My Accuracy</h1>
        <p className="text-gray-400 text-sm mt-1">
          Track your prediction accuracy over time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Predictions</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Correct</p>
          <p className="text-3xl font-bold text-emerald-400">{stats.correct}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Incorrect</p>
          <p className="text-3xl font-bold text-red-400">{stats.incorrect}</p>
        </div>
        <div className={`bg-white/5 border rounded-xl p-4 ${
          stats.accuracy_percentage >= 70 ? 'border-emerald-500/30' :
          stats.accuracy_percentage >= 50 ? 'border-amber-500/30' :
          'border-red-500/30'
        }`}>
          <p className="text-gray-400 text-sm">Accuracy</p>
          <p className="text-3xl font-bold">{stats.accuracy_percentage}%</p>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No graded predictions yet</p>
          <p className="text-gray-500 text-sm">Grade predictions to see your accuracy</p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Monthly */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Monthly Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={10} />
                  <YAxis stroke="#6B7280" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#10B981" name="Total" />
                  <Bar dataKey="correct" fill="#34D399" name="Correct" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Breakdown */}
          {marketData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-2">Market Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {marketData.map((market) => (
                  <div key={market.name} className="bg-black/40 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-400">{market.name}</p>
                    <p className="text-lg font-bold">
                      {market.accuracy}%
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {market.correct}/{market.total}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
                filter === 'correct' ? 'bg-emerald-600 text-white' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <CheckCircle className="w-3 h-3" /> Correct
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
                filter === 'incorrect' ? 'bg-red-600 text-white' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <XCircle className="w-3 h-3" /> Incorrect
            </button>

            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All Markets</option>
              {Object.keys(stats.by_market).map(market => (
                <option key={market} value={market}>{market}</option>
              ))}
            </select>
          </div>

          {/* Grades List */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Match</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Market</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Score</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Result</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredGrades().slice(0, 20).map((grade) => (
                    <tr key={grade.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        {grade.match?.home_team?.name || 'Unknown'} vs {grade.match?.away_team?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">{grade.predicted_market || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono">
                        {grade.actual_home_score} - {grade.actual_away_score}
                      </td>
                      <td className="px-4 py-3">
                        {grade.was_correct ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-4 h-4" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-4 h-4" /> Incorrect
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(grade.graded_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {getFilteredGrades().length === 0 && (
            <p className="text-center text-gray-400 py-4">No matches match the current filters</p>
          )}
        </>
      )}
    </div>
  )
}