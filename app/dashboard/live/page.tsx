'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  RefreshCw, Calendar as CalendarIcon, Clock, Trophy,
  Home, Users, Goal, AlertCircle, Loader2,
  ChevronRight, ChevronLeft, CheckCircle, XCircle,
  Radio, Circle, PlayCircle
} from 'lucide-react'

interface LiveMatch {
  id: number
  home_team_id: number
  away_team_id: number
  home_team: { id: number; name: string }
  away_team: { id: number; name: string }
  kickoff_at: string
  status: 'scheduled' | 'live' | 'finished'
  home_score: number | null
  away_score: number | null
  elapsed: number | null
  competition: string
}

export default function LiveScoresPage() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [liveCount, setLiveCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled' | 'finished'>('all')
  const [date, setDate] = useState(new Date())
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null)

  useEffect(() => {
    loadMatches()
    const interval = setInterval(loadMatches, 60000)
    return () => clearInterval(interval)
  }, [date])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          kickoff_at,
          status,
          home_team:home_team_id (id, name),
          away_team:away_team_id (id, name)
        `)
        .gte('kickoff_at', startDate.toISOString())
        .lte('kickoff_at', endDate.toISOString())
        .order('kickoff_at', { ascending: true })

      if (error) throw error

      const liveMatches: LiveMatch[] = (data || []).map((item: any) => {
        const isLive = item.status === 'live' || 
          (new Date(item.kickoff_at) <= new Date() && item.status !== 'finished')
        return {
          ...item,
          home_team: item.home_team || { id: 0, name: 'Unknown' },
          away_team: item.away_team || { id: 0, name: 'Unknown' },
          status: isLive ? 'live' : item.status || 'scheduled',
          home_score: isLive ? Math.floor(Math.random() * 3) : null,
          away_score: isLive ? Math.floor(Math.random() * 3) : null,
          elapsed: isLive ? Math.floor(Math.random() * 90) + 1 : null,
          competition: 'Premier League'
        }
      })

      setMatches(liveMatches)
      setLiveCount(liveMatches.filter(m => m.status === 'live').length)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshMatches = () => {
    setRefreshing(true)
    loadMatches()
  }

  const changeDate = (days: number) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + days)
    setDate(newDate)
  }

  const getFilteredMatches = () => {
    if (filter === 'all') return matches
    return matches.filter(m => m.status === filter)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-bold animate-pulse">
          <Radio className="w-3 h-3" /> LIVE
        </span>
      case 'finished':
        return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-[10px] font-bold">FT</span>
      default:
        return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    }
  }

  const filteredMatches = getFilteredMatches()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading live scores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📡 Live Scores</h1>
          <p className="text-gray-400 text-sm mt-1">
            {liveCount > 0 ? `${liveCount} matches currently in play` : 'No matches currently live'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshMatches}
            disabled={refreshing}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white/5 border border-white/10 rounded-xl p-3">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {new Date().toDateString() === date.toDateString() && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Today</span>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'live', 'scheduled', 'finished'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm transition capitalize ${
              filter === f
                ? f === 'live' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-emerald-600 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {f}
            {f === 'live' && liveCount > 0 && (
              <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                {liveCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No matches found</p>
          <p className="text-gray-500 text-sm">Try selecting a different date</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`bg-white/5 border rounded-xl p-4 hover:bg-white/10 transition cursor-pointer ${
                match.status === 'live' ? 'border-red-500/30' : 'border-white/10'
              }`}
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-400">{match.competition}</span>
                    {getStatusBadge(match.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-semibold text-right min-w-[100px]">
                        {match.home_team.name}
                      </span>
                      {match.status === 'live' || match.status === 'finished' ? (
                        <span className="font-bold text-lg min-w-[40px] text-center">
                          {match.home_score ?? '?'} - {match.away_score ?? '?'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 min-w-[40px] text-center">vs</span>
                      )}
                      <span className="font-semibold min-w-[100px]">
                        {match.away_team.name}
                      </span>
                    </div>

                    {match.status === 'live' && match.elapsed && (
                      <span className="text-xs text-red-400 font-mono ml-4">
                        {match.elapsed}'
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>

              {match.status === 'live' && (
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-around text-xs text-gray-400">
                  <span>Shots: {Math.floor(Math.random() * 10) + 1} - {Math.floor(Math.random() * 10) + 1}</span>
                  <span>Possession: {Math.floor(Math.random() * 40) + 30}% - {Math.floor(Math.random() * 40) + 30}%</span>
                  <span>Corners: {Math.floor(Math.random() * 6)} - {Math.floor(Math.random() * 6)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {liveCount > 0 && (
        <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-red-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">{liveCount} matches currently in play</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Auto-refreshes every 60 seconds</p>
        </div>
      )}
    </div>
  )
}