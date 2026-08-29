'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Trophy, Plus, X, Loader2, CheckCircle, Clock, AlertCircle
} from 'lucide-react'

interface CalendarMatch {
  id: number
  home_team_id: number
  away_team_id: number
  home_team: { id: number; name: string }
  away_team: { id: number; name: string }
  kickoff_at: string
  status: 'scheduled' | 'live' | 'finished'
  competition: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [matches, setMatches] = useState<CalendarMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedMatches, setSelectedMatches] = useState<CalendarMatch[]>([])

  useEffect(() => {
    loadMatches()
  }, [currentDate])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

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
        .gte('kickoff_at', startOfMonth.toISOString())
        .lte('kickoff_at', endOfMonth.toISOString())
        .order('kickoff_at', { ascending: true })

      if (error) throw error

      const calendarMatches: CalendarMatch[] = (data || []).map((item: any) => ({
        ...item,
        home_team: item.home_team || { id: 0, name: 'Unknown' },
        away_team: item.away_team || { id: 0, name: 'Unknown' },
        competition: 'Premier League'
      }))

      setMatches(calendarMatches)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentDate(newDate)
    setSelectedDate(null)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getMatchesForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0]
    return matches.filter(m => m.kickoff_at?.startsWith(dateStr) || false)
  }

  const handleDateClick = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0]
    const dayMatches = getMatchesForDate(day)
    setSelectedDate(dateStr)
    setSelectedMatches(dayMatches)
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)
  const days = []
  const today = new Date()
  const isToday = (day: number) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return d.toDateString() === today.toDateString()
  }

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 Calendar</h1>
          <p className="text-gray-400 text-sm mt-1">
            View all matches by date
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }
              
              const dayMatches = getMatchesForDate(day)
              const hasMatches = dayMatches.length > 0
              const isSelected = selectedDate === new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                .toISOString().split('T')[0]
              const dayIsToday = isToday(day)

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg transition
                    ${dayIsToday ? 'bg-emerald-500/20 border border-emerald-500/50' : ''}
                    ${isSelected ? 'bg-emerald-500/30 border border-emerald-500/50' : ''}
                    ${hasMatches ? 'hover:bg-white/10 cursor-pointer' : 'hover:bg-white/5 cursor-default'}
                  `}
                >
                  <span className={`text-sm font-medium ${dayIsToday ? 'text-emerald-400' : ''}`}>
                    {day}
                  </span>
                  {hasMatches && (
                    <div className="flex gap-0.5 mt-1">
                      {dayMatches.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ))}
                      {dayMatches.length > 3 && (
                        <span className="text-[8px] text-gray-400">+{dayMatches.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
              Today
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
              Selected
            </span>
            <span className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              Has matches
            </span>
          </div>
        </div>

        {/* Selected Date Matches */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }) : 'Select a date'}
          </h3>

          {selectedMatches.length === 0 && selectedDate ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              No matches on this date
            </div>
          ) : selectedDate ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {selectedMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-black/30 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-400">{match.competition}</span>
                    {match.status === 'live' && (
                      <span className="text-[10px] text-red-400 animate-pulse font-bold">LIVE</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{match.home_team.name}</span>
                    <span className="text-gray-500 text-xs">vs</span>
                    <span className="font-medium">{match.away_team.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(match.kickoff_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              Click a date on the calendar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}