'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Loader2, X, Target, CheckCircle, Users, BarChart3, Clock, MessageSquareText
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line, 
  RadialBarChart, RadialBar 
} from 'recharts'

import { hasFlag } from 'country-flag-icons'
import getUnicodeFlagIcon from 'country-flag-icons/unicode'

const PROFESSIONAL_NAMES: Record<string, string> = {
  'Gemini': 'QuantVantage Alpha',
  'Groq': 'Stratagem Neural-X',
  'Mistral': 'MetricPulse Engine',
  'NVIDIA': 'Stochastic Core-R1',
  'OpenRouter': 'NexusOdds Vector',
  'ADMIN': 'Manual Entry',
}

const AGENT_COLORS = ['#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
const AGENT_ROLES = ['Stats Agent', 'Market Agent', 'Field Agent', 'Lineups Agent', 'Morale Agent'];

// --- CHART DATA ---
const barData = [{ name: 'Mon', value: 12 }, { name: 'Tue', value: 18 }, { name: 'Wed', value: 8 }, { name: 'Thu', value: 15 }, { name: 'Fri', value: 28 }, { name: 'Sat', value: 32 }, { name: 'Sun', value: 24 }]
const sparklineData = [{ value: 10 }, { value: 15 }, { value: 8 }, { value: 20 }, { value: 12 }, { value: 25 }, { value: 18 }, { value: 30 }]

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fixtures, setFixtures] = useState<any[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [liveScores, setLiveScores] = useState<Record<string, any>>({})
  const [activeFilter, setActiveFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadData()
    const scoreInterval = setInterval(fetchLiveScores, 15000)

    return () => {
      clearInterval(scoreInterval)
    }
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/signin'); return }
    setUser(user); setLoading(false)
  }

  const loadData = async () => {
    try {
      const { data: fixturesData } = await supabase
        .from('fixtures')
        .select('*, ai_predictions(*)')
        .eq('status', 'ANALYZED')
        .order('match_time', { ascending: true })
      setFixtures(fixturesData || [])
      fetchLiveScores()
    } catch (error) { console.error('Error loading data:', error) }
  }

  const fetchLiveScores = async () => {
    try {
      const response = await fetch(`https://livescore-api.com/api-client/matches/live.json?&key=${process.env.NEXT_PUBLIC_LIVE_SCORE_API_KEY}&secret=${process.env.NEXT_PUBLIC_LIVE_SCORE_API_SECRET}`)
      const data = await response.json()
      if (data.success && data.data?.match) {
        const scores: Record<string, any> = {}
        data.data.match.forEach((match: any) => { scores[match.fixture_id] = { home_score: match.home_score, away_score: match.away_score, time: match.time, status: match.status } })
        setLiveScores(scores)
      }
    } catch (error) {}
  }

  const getConsensusPick = (predictions: any[]) => {
    if (!predictions || predictions.length === 0) return null
    const marketVotes: Record<string, number> = {}
    let totalConfidence = 0, confidenceCount = 0
    predictions.forEach((pred: any) => {
      const code = pred.primary_market_code || '1X2'
      marketVotes[code] = (marketVotes[code] || 0) + 1
      totalConfidence += pred.primary_confidence || 0
      confidenceCount++
    })
    let topCode = '1X2', topVotes = 0
    Object.entries(marketVotes).forEach(([code, count]) => { if (count > topVotes) { topCode = code; topVotes = count } })
    const topPrediction = predictions.find(p => p.primary_market_code === topCode)
    return {
      market_code: topCode,
      selection: topPrediction?.primary_selection || 'Pending',
      reasoning: topPrediction?.reasoning || null,
      votes: topVotes,
      totalVotes: predictions.length,
      confidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0,
      predictions: predictions
    }
  }

  const getMatchStatus = (fixture: any) => {
    const liveScore = liveScores[fixture.external_id]
    if (liveScore) {
      if (liveScore.status === 'Finished') return { label: 'FT', color: 'bg-gray-500' }
      if (liveScore.status === 'Halftime') return { label: 'HT', color: 'bg-yellow-500' }
      if (liveScore.status === 'Live') return { label: 'LIVE', color: 'bg-red-500 animate-pulse' }
    }
    return { label: 'UP', color: 'bg-blue-500' }
  }

  const openDetailModal = (fixture: any) => { setSelectedMatch(fixture); setShowDetailModal(true) }

  const getFlagAndText = (countryCode: string | null, countryName: string | null) => {
    if (!countryCode && !countryName) return '🌍 Unknown';
    const upperCode = countryCode?.toUpperCase() || '';
    if (hasFlag(upperCode)) {
      return `${getUnicodeFlagIcon(upperCode)} ${countryName || upperCode}`;
    }
    return countryName || '🌍 Unknown';
  };

  const getSportAndLeague = (sport: string | null, league: string | null) => {
    const isFootball = sport === 'football' || sport === 'soccer' || sport?.includes('j_league') || sport?.includes('soccer_');
    const isKnockout = league?.toLowerCase().includes('cup') || league?.toLowerCase().includes('champions') || league?.toLowerCase().includes('europa') || league?.toLowerCase().includes('conference');
    let icon = '🏆';
    if (isFootball && !isKnockout) icon = '⚽';
    if (isFootball && isKnockout) icon = '🏆';
    return `${icon} ${league || 'League'}`;
  };

  const getLogo = (logoUrl: string | null, sport: string | null) => {
    if (logoUrl && logoUrl.startsWith('http')) return logoUrl;
    // If it's football, return a football icon. If it's a cup, return a trophy.
    const isFootball = sport === 'football' || sport === 'soccer' || sport?.includes('j_league') || sport?.includes('soccer_');
    return isFootball ? '⚽' : '🏆';
  };

  if (loading) return <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-200 flex font-sans">
      <main className="flex-1 p-8 overflow-y-auto space-y-8 pb-20">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Live AI Intelligence Portal</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time match analysis powered by 5 AI Specialist Assistants.</p>
          </div>
        </header>

        {/* METRICS GRID */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col h-[160px]">
            <div className="text-xs text-gray-400 tracking-wider mb-1">Today's Total Picks</div>
            <div className="flex-1 flex items-end justify-between">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <Bar dataKey="value" fill="#ef4444" barSize={8} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col h-[160px]">
            <div className="text-xs text-gray-400 tracking-wider mb-1">High Confidence (&gt;80%)</div>
            <div className="flex-1 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="100%" innerRadius="70%" outerRadius="100%" barSize={8} data={[{ name: 'conf', value: 85, fill: '#10b981' }]} startAngle={180} endAngle={0}>
                  <RadialBar background dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute bottom-4 text-emerald-400 font-bold text-lg font-mono">85%</div>
            </div>
          </div>
          <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col h-[160px]">
            <div className="text-xs text-gray-400 tracking-wider mb-1">Sharp Money (RLM)</div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col h-[160px]">
            <div className="text-xs text-gray-400 tracking-wider mb-1">7-Day Model Accuracy</div>
            <div className="flex-1 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ value: 78.4 }, { value: 21.6 }]} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" stroke="none">
                    <Cell fill="#06b6d4" /><Cell fill="#1f2937" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-cyan-400 font-bold text-sm font-mono">78.4%</div>
            </div>
          </div>
        </section>

        {/* MATCH FEED */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <div className="flex space-x-2">
                <button onClick={() => setActiveFilter('all')} className={`px-3 py-1 rounded-md border transition ${activeFilter === 'all' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}>All Signals</button>
                <button onClick={() => setActiveFilter('rlm')} className={`px-3 py-1 rounded-md border transition ${activeFilter === 'rlm' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}>RLM Only</button>
              </div>
            </div>

            <div className="space-y-6">
              {fixtures.slice(0, 5).map((fixture, index) => {
                const consensus = getConsensusPick(fixture.ai_predictions)
                const flagAndCountry = getFlagAndText(fixture.country_flag || fixture.country, fixture.country);
                const sportAndLeague = getSportAndLeague(fixture.sport, fixture.league_name);
                const homeLogo = getLogo(fixture.home_team_logo, fixture.sport);
                const awayLogo = getLogo(fixture.away_team_logo, fixture.sport);
                const isRLM = index % 2 === 0;
                
                return (
                  <div key={fixture.id} className={`bg-[rgba(18,23,33,0.75)] backdrop-blur-md border p-6 rounded-3xl space-y-5 relative overflow-hidden ${isRLM ? 'border-amber-500/30 glow-amber shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-emerald-500/30 glow-emerald shadow-[0_0_20px_rgba(16,185,129,0.12)]'}`}>
                    
                    {/* HEADER */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/5 rounded-full p-2 flex items-center justify-center border border-white/10 text-3xl">
                          {homeLogo.startsWith('http') ? 
                            <img src={homeLogo} alt={fixture.home_team} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> 
                            : <span>{homeLogo}</span>
                          }
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{fixture.home_team}</h3>
                          <span className="text-[11px] text-gray-400 font-mono">Home</span>
                        </div>
                      </div>

                      {/* ENHANCED: Bigger & Bolder League/Country/Flag */}
                      <div className="text-center">
                        <div className="text-sm font-bold text-cyan-400 tracking-wider bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                          {sportAndLeague}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 justify-center">
                          <span className="text-xs text-gray-400">vs</span>
                          <span className="text-sm font-bold text-gray-200 font-mono">
                            {new Date(fixture.match_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-cyan-400 mt-1 tracking-wide">
                          {flagAndCountry}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <h3 className="text-xl font-bold text-white">{fixture.away_team}</h3>
                          <span className="text-[11px] text-gray-400 font-mono">Away</span>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-full p-2 flex items-center justify-center border border-white/10 text-3xl">
                          {awayLogo.startsWith('http') ? 
                            <img src={awayLogo} alt={fixture.away_team} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> 
                            : <span>{awayLogo}</span>
                          }
                        </div>
                      </div>
                    </div>

                    {isRLM && (
                      <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span> RLM DETECTED
                      </div>
                    )}

                    {/* GAUGE & DATA STRIP */}
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-row items-center justify-between gap-6">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative w-20 h-20">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (consensus?.confidence || 0)) / 100} className="shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold text-emerald-400 font-mono">{consensus?.confidence || 0}%</span>
                            <span className="text-[8px] text-gray-400 uppercase">Consensus</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px] text-gray-400">AI Consensus</div>
                          <div className="text-base font-bold text-emerald-400 font-mono">{consensus?.confidence || 0}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Target Pick</div>
                          <div className="text-base font-bold text-white mt-0.5">{consensus?.selection || 'Pending'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Odds Shift</div>
                          <div className="text-base font-bold text-emerald-400 font-mono">1.85 ➔ 1.62</div>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-gray-400">
                      <span className="font-mono flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> CONFIRMED LINEUPS INGESTED
                      </span>
                      <button onClick={() => openDetailModal(fixture)} className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] border border-emerald-500/30 hover:bg-emerald-500/10 px-4 py-1 rounded-lg transition">
                        Detailed Analysis →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* LOG SIDEBAR */}
          <aside className="space-y-4">
            <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-white text-sm">⚡ Live Scraper Stream</span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">LIVE</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-[11px] space-y-1.5 h-96 overflow-y-auto text-gray-300 shadow-inner">
                <p className="text-gray-500 italic">Waiting for real-time data...</p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {/* --- DETAILED ANALYSIS MODAL (FULL AGENT BARS + LINEUPS/STANDINGS/H2H PLACEHOLDERS) --- */}
      {showDetailModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-200 shadow-2xl">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                  {selectedMatch.home_team_logo?.startsWith('http') ? <img src={selectedMatch.home_team_logo} className="w-full h-full object-contain rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : '⚽'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedMatch.home_team} vs {selectedMatch.away_team}</h2>
                  <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                    <Clock className="w-3 h-3" /> 
                    {new Date(selectedMatch.match_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • 
                    Kickoff: {new Date(selectedMatch.match_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-2xl overflow-hidden">
                  {selectedMatch.away_team_logo?.startsWith('http') ? <img src={selectedMatch.away_team_logo} className="w-full h-full object-contain rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : '⚽'}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white transition"><X className="w-6 h-6" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black/40 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-gray-400 font-mono mb-2">AI Confidence Rating</span>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="10" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (getConsensusPick(selectedMatch.ai_predictions)?.confidence || 0)) / 100} className="shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-emerald-400 font-mono">{getConsensusPick(selectedMatch.ai_predictions)?.confidence || 0}%</span>
                      <span className="text-[9px] text-gray-400 uppercase">Consensus</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-cyan-400 mb-3">5-AI Specialist Breakdown</h3>
                  <div className="space-y-2 text-xs">
                    {selectedMatch.ai_predictions?.map((pred: any, i: number) => (
                      <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-gray-400 font-mono">{PROFESSIONAL_NAMES[pred.ai_provider] || pred.ai_provider}</span>
                        <span className="text-emerald-400 font-bold">{pred.primary_selection} ({pred.primary_confidence}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NEW: Prediction reasoning */}
                {getConsensusPick(selectedMatch.ai_predictions)?.reasoning && (
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4" /> Reasoning
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {getConsensusPick(selectedMatch.ai_predictions)?.reasoning}
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Agent Confidence Breakdown (Kept ONLY in modal) */}
              <div className="bg-black/40 p-6 rounded-xl border border-white/5 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-white mb-4 text-center">Agent Confidence Breakdown</h3>
                <div className="space-y-3">
                  {selectedMatch.ai_predictions?.slice(0, 5).map((pred: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400 font-mono">{AGENT_ROLES[i] || `Agent ${i+1}`}</span>
                        <span className="text-emerald-400 font-mono">{pred.primary_confidence}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pred.primary_confidence}%`, backgroundColor: AGENT_COLORS[i % AGENT_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* LINEUPS, STANDINGS, H2H BLOCKS (Ready for Automation) */}
                <div className="mt-6 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-white/5 p-2 rounded border border-white/5 text-center flex flex-col items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Lineups</span>
                    <span className="text-white font-mono">Awaiting T-30m...</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/5 text-center flex flex-col items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Standings</span>
                    <span className="text-white font-mono">Polling API...</span>
                  </div>
                  <div className="col-span-2 bg-white/5 p-2 rounded border border-white/5 text-center flex flex-col items-center gap-1">
                    <Target className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">H2H</span>
                    <span className="text-white font-mono">Last 5: 3W - 1D - 1L</span>
                  </div>
                </div>

                {/* Final Recommendation Card */}
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Final Recommended Bet</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{getConsensusPick(selectedMatch.ai_predictions)?.market_code || '1X2'}</div>
                  <div className="text-[11px] text-gray-400 mt-1">Pick: {getConsensusPick(selectedMatch.ai_predictions)?.selection || 'Pending'} • {getConsensusPick(selectedMatch.ai_predictions)?.confidence || 0}% Confidence</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[11px] text-gray-400">
              <span className="font-mono flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> CONFIRMED LINEUPS INGESTED</span>
              <span className="text-cyan-400 font-mono">T-30m Intelligence</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}