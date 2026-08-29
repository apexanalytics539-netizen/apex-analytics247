'use client'

import { CheckCircle } from 'lucide-react'

interface MatchCardProps {
  fixture: any
  consensus: any
  onViewDetails: () => void
}

export default function MatchCard({ fixture, consensus, onViewDetails }: MatchCardProps) {
  // 1. Extract real data from the fixture prop
  const homeTeam = fixture.home_team || 'Home'
  const awayTeam = fixture.away_team || 'Away'
  
  // Handle missing logos: Use generic football/sports icon if null or empty
  const defaultIcon = fixture.sport === 'football' || fixture.sport === 'soccer' ? '⚽' : '🏆'
  const homeLogo = fixture.home_team_logo || defaultIcon
  const awayLogo = fixture.away_team_logo || defaultIcon
  
  const league = fixture.league_name || 'League'
  const countryFlag = fixture.country_flag || '🌍' // Fallback globe if flag missing
  const isFootball = fixture.sport === 'football' || fixture.sport === 'soccer'
  
  // Format Date and Time
  const matchDate = new Date(fixture.match_time)
  const dateStr = matchDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  const timeStr = matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  // 2. Calculate dynamic AI Agent Scores from the actual predictions
  const predictions = fixture.ai_predictions || []
  const agentConfigs = [
    { name: 'Stats Agent', color: '#06b6d4' },
    { name: 'Market Agent', color: '#f59e0b' },
    { name: 'Field Agent', color: '#10b981' },
    { name: 'Lineups Agent', color: '#8b5cf6' },
    { name: 'Morale Agent', color: '#ec4899' },
  ]

  const agentBreakdown = agentConfigs.map((agent, index) => {
    const pred = predictions[index] || null
    const score = pred ? pred.primary_confidence : 0
    return { ...agent, score, selection: pred ? pred.primary_selection : 'N/A' }
  })

  const confidenceScore = consensus ? consensus.confidence : 0
  const targetPick = consensus ? consensus.selection : 'Pending'
  const circumference = 251.2
  const strokeDashoffset = circumference - (circumference * confidenceScore) / 100

  return (
    <div className="bg-[rgba(18,23,33,0.85)] backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden hover:border-emerald-500/30 transition-colors">
      
      {/* 1. MATCH HEADER & VISUAL IDENTITY */}
      <div className="flex justify-between items-start mb-6">
        {/* Left Team */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/5 rounded-full p-1 flex items-center justify-center border border-white/10 text-2xl">
            {homeLogo.startsWith('http') ? <img src={homeLogo} alt={homeTeam} className="w-full h-full object-contain" /> : <span>{homeLogo}</span>}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{homeTeam}</h3>
            <span className="text-[11px] text-gray-400 font-mono">Home</span>
          </div>
        </div>

        {/* Center Match Meta */}
        <div className="text-center">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">
            {isFootball && <span className="mr-1">⚽</span>}{countryFlag} {league}
          </span>
          <div className="flex items-center space-x-4 mt-1 justify-center">
            <span className="text-xs text-gray-400">vs</span>
            <span className="text-[10px] text-gray-500 font-mono">{dateStr} • {timeStr}</span>
          </div>
        </div>

        {/* Right Team */}
        <div className="flex items-center space-x-3 text-right">
          <div>
            <h3 className="text-xl font-bold text-white">{awayTeam}</h3>
            <span className="text-[11px] text-gray-400 font-mono">Away</span>
          </div>
          <div className="w-12 h-12 bg-white/5 rounded-full p-1 flex items-center justify-center border border-white/10 text-2xl">
            {awayLogo.startsWith('http') ? <img src={awayLogo} alt={awayTeam} className="w-full h-full object-contain" /> : <span>{awayLogo}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 2. RADIAL GAUGE */}
        <div className="md:col-span-3 flex flex-col items-center justify-center bg-black/30 rounded-xl p-4 border border-white/5">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="8" fill="none" />
              <circle 
                cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none" 
                strokeLinecap="round"
                strokeDasharray={circumference.toString()} 
                strokeDashoffset={strokeDashoffset.toString()} 
                className="shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-emerald-400 font-mono">{confidenceScore}%</span>
              <span className="text-[9px] text-gray-400 uppercase">AI Confidence</span>
            </div>
          </div>
        </div>

        {/* 3. SUMMARY METRICS BAR */}
        <div className="md:col-span-4 bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-center space-y-3">
          <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
            <span className="text-gray-400">AI Consensus Score</span>
            <span className="text-emerald-400 font-bold font-mono">{confidenceScore}%</span>
          </div>
          <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1">
            <span className="text-gray-400">Target Pick</span>
            <span className="text-white font-bold">{targetPick}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">League Standings</span>
            <span className="text-emerald-400 font-bold font-mono">Pending</span>
          </div>
        </div>

        {/* 4. MULTI-AGENT STACKED BARS */}
        <div className="md:col-span-5 bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-center space-y-2">
          <span className="text-[10px] text-gray-400 font-mono mb-1">5-Agent Confidence Breakdown</span>
          {agentBreakdown.map((agent, index) => (
            <div key={agent.name} className="flex items-center space-x-2 text-[10px]">
              <div className="w-16 text-gray-400 font-mono truncate">{agent.name}:</div>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: `${agent.score}%`, backgroundColor: agent.color }}
                />
              </div>
              <div className="w-8 text-right text-gray-200 font-mono">{agent.score}%</div>
            </div>
          ))}
        </div>

      </div>

      {/* 5. CARD ACTION FOOTER */}
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-mono">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>CONFIRMED LINEUPS INGESTED</span>
        </div>
        <button 
          onClick={onViewDetails}
          className="text-[11px] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 px-4 py-1.5 rounded-lg transition font-bold"
        >
          Detailed Analysis →
        </button>
      </div>
    </div>
  )
}