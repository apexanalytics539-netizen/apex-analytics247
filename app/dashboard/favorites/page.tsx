'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Star, Plus, X, Search, Edit2, Save, Trash2, 
  Trophy, Users, Calendar, TrendingUp, Loader2
} from 'lucide-react'

interface Team {
  id: number
  name: string
  league: string | null
  api_football_id: number | null
  football_data_org_id: number | null
  is_favorite?: boolean
}

interface FavoriteTeam extends Team {
  user_id: string
  is_active: boolean
  favorite_id: number
  season_stats?: {
    league_position: number
    points: number
    goals_scored_league: number
    goals_conceded_league: number
    ht_ft_pattern: string
    injuries_suspensions: string
    advanced_stats: string
  }
}

export default function FavoritesPage() {
  const [user, setUser] = useState<any>(null)
  const [favorites, setFavorites] = useState<FavoriteTeam[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    league_position: '',
    points: '',
    goals_scored_league: '',
    goals_conceded_league: '',
    ht_ft_pattern: '',
    injuries_suspensions: '',
    advanced_stats: ''
  })

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadFavorites()
      loadAllTeams()
    }
  }, [user])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadFavorites = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('favorite_teams')
      .select(`
        id,
        user_id,
        is_active,
        team_id,
        teams (
          id,
          name,
          league,
          api_football_id,
          football_data_org_id
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) {
      console.error('Error loading favorites:', error)
      return
    }

    const favoriteTeams: FavoriteTeam[] = (data || []).map((item: any) => ({
      id: item.teams.id,
      name: item.teams.name,
      league: item.teams.league,
      api_football_id: item.teams.api_football_id,
      football_data_org_id: item.teams.football_data_org_id,
      user_id: item.user_id,
      is_active: item.is_active,
      favorite_id: item.id,
      is_favorite: true
    })) || []

    // Load season stats for each favorite team
    for (const team of favoriteTeams) {
      const { data: stats } = await supabase
        .from('team_season_stats')
        .select('*')
        .eq('team_id', team.id)
        .maybeSingle()
      team.season_stats = stats || undefined
    }

    setFavorites(favoriteTeams)
  }

  const loadAllTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, league, api_football_id, football_data_org_id')
      .order('name')

    if (error) {
      console.error('Error loading teams:', error)
      return
    }

    const teams: Team[] = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      league: item.league,
      api_football_id: item.api_football_id,
      football_data_org_id: item.football_data_org_id,
      is_favorite: favorites.some(f => f.id === item.id)
    }))

    setAllTeams(teams)
    setLoading(false)
  }

  const addFavorite = async (teamId: number) => {
    if (!user) return

    const { error } = await supabase
      .from('favorite_teams')
      .insert({
        user_id: user.id,
        team_id: teamId,
        is_active: true
      })

    if (error) {
      console.error('Error adding favorite:', error)
      return
    }

    setShowAddModal(false)
    setSearchQuery('')
    loadFavorites()
    loadAllTeams()
  }

  const removeFavorite = async (teamId: number) => {
    if (!user) return

    const { error } = await supabase
      .from('favorite_teams')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('team_id', teamId)

    if (error) {
      console.error('Error removing favorite:', error)
      return
    }

    loadFavorites()
    loadAllTeams()
  }

  const updateSeasonStats = async (teamId: number) => {
    if (!user) return

    const stats = {
      team_id: teamId,
      league_position: parseInt(editForm.league_position) || 0,
      points: parseInt(editForm.points) || 0,
      goals_scored_league: parseInt(editForm.goals_scored_league) || 0,
      goals_conceded_league: parseInt(editForm.goals_conceded_league) || 0,
      ht_ft_pattern: editForm.ht_ft_pattern || '',
      injuries_suspensions: editForm.injuries_suspensions || '',
      advanced_stats: editForm.advanced_stats || '',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('team_season_stats')
      .upsert(stats, { onConflict: 'team_id' })

    if (error) {
      console.error('Error updating stats:', error)
      return
    }

    setEditingTeam(null)
    loadFavorites()
  }

  const startEditing = (team: FavoriteTeam) => {
    setEditingTeam(team.id)
    setEditForm({
      league_position: team.season_stats?.league_position?.toString() || '',
      points: team.season_stats?.points?.toString() || '',
      goals_scored_league: team.season_stats?.goals_scored_league?.toString() || '',
      goals_conceded_league: team.season_stats?.goals_conceded_league?.toString() || '',
      ht_ft_pattern: team.season_stats?.ht_ft_pattern || '',
      injuries_suspensions: team.season_stats?.injuries_suspensions || '',
      advanced_stats: team.season_stats?.advanced_stats || ''
    })
  }

  const availableTeams = allTeams.filter(
    t => !favorites.some(f => f.id === t.id)
  )

  const filteredTeams = availableTeams.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.league?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">⭐ My Favorite Teams</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your favorite teams and their season stats
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Add Team
        </button>
      </div>

      {/* Favorites Grid */}
      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No favorite teams yet</p>
          <p className="text-gray-500 text-sm">Add teams to quickly access their stats</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((team) => (
            <div
              key={team.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-xs text-gray-400">{team.league || 'Unknown League'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(team)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFavorite(team.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingTeam === team.id ? (
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Position"
                      className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm focus:outline-none focus:border-emerald-500/50"
                      value={editForm.league_position}
                      onChange={(e) => setEditForm({ ...editForm, league_position: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Points"
                      className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm focus:outline-none focus:border-emerald-500/50"
                      value={editForm.points}
                      onChange={(e) => setEditForm({ ...editForm, points: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Goals Scored"
                      className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm focus:outline-none focus:border-emerald-500/50"
                      value={editForm.goals_scored_league}
                      onChange={(e) => setEditForm({ ...editForm, goals_scored_league: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Goals Conceded"
                      className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm focus:outline-none focus:border-emerald-500/50"
                      value={editForm.goals_conceded_league}
                      onChange={(e) => setEditForm({ ...editForm, goals_conceded_league: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="HT/FT Pattern (e.g., W/W, D/D)"
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm focus:outline-none focus:border-emerald-500/50"
                    value={editForm.ht_ft_pattern}
                    onChange={(e) => setEditForm({ ...editForm, ht_ft_pattern: e.target.value })}
                  />
                  <textarea
                    placeholder="Injuries & Suspensions"
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm resize-none h-12 focus:outline-none focus:border-emerald-500/50"
                    value={editForm.injuries_suspensions}
                    onChange={(e) => setEditForm({ ...editForm, injuries_suspensions: e.target.value })}
                  />
                  <textarea
                    placeholder="Advanced Stats (paste all)"
                    className="w-full px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm resize-none h-16 focus:outline-none focus:border-emerald-500/50"
                    value={editForm.advanced_stats}
                    onChange={(e) => setEditForm({ ...editForm, advanced_stats: e.target.value })}
                  />
                  <button
                    onClick={() => updateSeasonStats(team.id)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition"
                  >
                    <Save className="w-4 h-4 inline mr-1" /> Save Stats
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {team.season_stats ? (
                    <>
                      <div className="flex justify-between text-gray-300">
                        <span>Position: <span className="font-bold text-emerald-400">{team.season_stats.league_position || 'N/A'}</span></span>
                        <span>Points: <span className="font-bold text-emerald-400">{team.season_stats.points || 'N/A'}</span></span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Goals: <span className="font-bold">{team.season_stats.goals_scored_league || 0}:{team.season_stats.goals_conceded_league || 0}</span></span>
                        <span>HT/FT: <span className="font-bold">{team.season_stats.ht_ft_pattern || 'N/A'}</span></span>
                      </div>
                      {team.season_stats.injuries_suspensions && (
                        <p className="text-xs text-yellow-400">
                          ⚠️ {team.season_stats.injuries_suspensions}
                        </p>
                      )}
                      {team.season_stats.advanced_stats && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {team.season_stats.advanced_stats}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-2">No season stats yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Favorite Team</h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredTeams.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No teams found</p>
              ) : (
                filteredTeams.slice(0, 20).map((team) => (
                  <button
                    key={team.id}
                    onClick={() => addFavorite(team.id)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-lg text-left transition"
                  >
                    <span>{team.name}</span>
                    <span className="text-xs text-gray-400">{team.league || 'N/A'}</span>
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchQuery('')
                }}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}