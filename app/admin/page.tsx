'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, RefreshCw, Archive, Eye, EyeOff, Bot, ShieldCheck, Receipt, Settings } from 'lucide-react'
import AdminShell, { AdminSection } from '@/components/admin/AdminShell'
import { useAdmin } from '@/context/AdminContext'

// ✅ Import with debugging - check each one
import ComposeEventForm from '@/components/admin/ComposeEventForm'
console.log('🔍 ComposeEventForm loaded:', !!ComposeEventForm)

import UsersPanel from '@/components/admin/UserPanel'
console.log('🔍 UsersPanel loaded:', !!UsersPanel)

import AIPerformanceAnalyze from '@/components/admin/AIPerformanceAnalyze'
console.log('🔍 AIPerformanceAnalyze loaded:', !!AIPerformanceAnalyze)

import type { ComposeDraft } from '@/lib/aiShipping'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export default function AdminDashboard() {
  const { section, navigateTo } = useAdmin()
  
  const [leagues, setLeagues] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [aiStats, setAiStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | null>(null)

  const handleShipToCompose = (draft: ComposeDraft) => {
    setComposeDraft(draft)
    navigateTo('compose')
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('*')
        .order('league_name', { ascending: true })
      if (leaguesError) console.error('Error fetching leagues:', leaguesError)
      else setLeagues(leaguesData || [])

      const { data: fixturesData, error: fixturesError } = await supabase
        .from('fixtures')
        .select('*, ai_predictions(*)')
        .order('match_time', { ascending: true })
        .limit(200)
      if (fixturesError) console.error('Error fetching fixtures:', fixturesError)
      else setFixtures(fixturesData || [])

      const { data: statsData, error: statsError } = await supabase
        .from('ai_predictions')
        .select('ai_provider, primary_confidence')
      if (statsError) console.error('Error fetching AI stats:', statsError)
      else setAiStats(statsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLeague = async (leagueId: number, currentStatus: boolean) => {
    const { error } = await supabase.from('leagues').update({ is_active: !currentStatus }).eq('id', leagueId)
    if (error) console.error('Error toggling league:', error)
    else loadData()
  }

  const syncFixtures = async () => {
    setSyncing(true)
    try {
      const { error } = await supabase.functions.invoke('fetch-fixtures')
      if (error) throw error
      await loadData()
    } catch (err) {
      console.error('Error syncing fixtures:', err)
    } finally {
      setSyncing(false)
    }
  }

  const { activeFixtures, archivedCount } = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS
    const active: any[] = []
    let archived = 0
    for (const f of fixtures) {
      const t = f.match_time ? new Date(f.match_time).getTime() : null
      if (t !== null && t < cutoff) archived++
      else active.push(f)
    }
    return { activeFixtures: active, archivedCount: archived }
  }, [fixtures])

  const visibleFixtures = showArchived ? fixtures : activeFixtures

  console.log('🔍 Page - Current section:', section)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#0a0c12]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  // ✅ Safety check - if component is undefined, show error
  if (!ComposeEventForm || !UsersPanel || !AIPerformanceAnalyze) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#0a0c12] text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Component Loading Error</h2>
          <p className="text-slate-400">One or more components failed to load.</p>
          <p className="text-xs text-slate-500 mt-4">
            ComposeEventForm: {!!ComposeEventForm ? '✅' : '❌'}<br />
            UsersPanel: {!!UsersPanel ? '✅' : '❌'}<br />
            AIPerformanceAnalyze: {!!AIPerformanceAnalyze ? '✅' : '❌'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <AdminShell active={section} onNavigate={navigateTo}>
      {section === 'compose' && (
        <ComposeEventForm initialDraft={composeDraft} onDraftConsumed={() => setComposeDraft(null)} />
      )}

      {section === 'leagues' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {leagues.length > 0 ? (
            leagues.map((league) => (
              <div key={league.id} className="bg-[#12141c] border border-white/5 rounded-xl p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{league.league_name}</h3>
                  <p className="text-xs text-slate-500 truncate">{league.country}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">{league.sport_type}</p>
                </div>
                <button
                  onClick={() => toggleLeague(league.id, league.is_active)}
                  className={`relative w-10 h-5 rounded-full transition flex-shrink-0 ml-2 ${league.is_active ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${league.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-xl">
              No leagues found. Add leagues in Supabase to get started.
            </div>
          )}
        </div>
      )}

      {section === 'fixtures' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Archive className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {archivedCount} fixture{archivedCount === 1 ? '' : 's'} older than 7 days hidden
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowArchived((s) => !s)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg transition"
              >
                {showArchived ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showArchived ? 'Hide archived' : 'Show archived'}
              </button>
              <button
                onClick={syncFixtures}
                disabled={syncing}
                className="flex items-center gap-1.5 text-xs text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 disabled:opacity-50 px-3 py-1.5 rounded-lg font-bold transition"
              >
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sync fixtures
              </button>
            </div>
          </div>

          <div className="bg-[#12141c] border border-white/5 rounded-xl overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead>
                <tr className="bg-white/[0.02] text-left text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="p-3">Match</th>
                  <th className="p-3">League</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleFixtures.length > 0 ? (
                  visibleFixtures.map((fixture) => {
                    const isArchived = fixture.match_time && new Date(fixture.match_time).getTime() < Date.now() - SEVEN_DAYS_MS
                    return (
                      <tr key={fixture.id} className={`border-t border-white/5 ${isArchived ? 'opacity-50' : ''}`}>
                        <td className="p-3 text-slate-200 whitespace-nowrap">{fixture.home_team} vs {fixture.away_team}</td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">{fixture.league_name}</td>
                        <td className="p-3 text-slate-400 whitespace-nowrap">{fixture.match_time ? new Date(fixture.match_time).toLocaleString() : 'TBD'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium whitespace-nowrap ${
                            fixture.status === 'ANALYZED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : fixture.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {fixture.status || 'UNKNOWN'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-10">
                      No fixtures found. Sync fixtures to load matches from the provider.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(
              aiStats.reduce((acc: any, curr: any) => {
                acc[curr.ai_provider] = acc[curr.ai_provider] || []
                acc[curr.ai_provider].push(curr.primary_confidence)
                return acc
              }, {})
            ).length > 0 ? (
              Object.entries(
                aiStats.reduce((acc: any, curr: any) => {
                  acc[curr.ai_provider] = acc[curr.ai_provider] || []
                  acc[curr.ai_provider].push(curr.primary_confidence)
                  return acc
                }, {})
              ).map(([provider, confidences]: [string, any]) => (
                <div key={provider} className="bg-[#12141c] border border-white/5 rounded-xl p-4">
                  <h3 className="font-semibold text-white text-sm">{provider}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Average Confidence: <span className="text-indigo-300 font-mono">{Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length)}%</span>
                  </p>
                  <p className="text-xs text-slate-500">Total Picks: {confidences.length}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-xl">
                No AI predictions yet.
              </div>
            )}
          </div>

          <AIPerformanceAnalyze onShipToCompose={handleShipToCompose} />
        </div>
      )}

      {section === 'users' && <UsersPanel />}
      
      {section === 'bots' && (
        <div className="text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-xl">
          <Bot className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-white">Bots Management</h3>
          <p className="text-sm mt-1">Configure and manage AI bots for predictions.</p>
        </div>
      )}
      
      {section === 'approvals' && (
        <div className="text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-xl">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-white">Approvals</h3>
          <p className="text-sm mt-1">Review and approve pending content.</p>
        </div>
      )}
      
      {section === 'receipts' && (
        <div className="text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-xl">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-white">Receipts</h3>
          <p className="text-sm mt-1">View and manage payment receipts.</p>
        </div>
      )}
      
      {section === 'settings' && (
        <div className="text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-xl">
          <Settings className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-medium text-white">Settings</h3>
          <p className="text-sm mt-1">Configure admin panel settings.</p>
        </div>
      )}
    </AdminShell>
  )
}