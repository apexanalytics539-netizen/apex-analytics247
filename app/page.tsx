'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link' // ✅ Import Link for internal navigation
import { 
  Activity, TrendingUp, Bot, Zap, ShieldCheck, Eye, 
  ExternalLink, Menu, X, ArrowRight, Globe, LineChart, 
  Clock, Radio, BarChart3, Users, Target, ChevronRight 
} from 'lucide-react'

// --- SAMPLE DATA FOR THE GRID ---
const mockPredictions = [
  { id: 1, home: 'Real Madrid', away: 'Barcelona', league: 'La Liga', confidence: 88, odds: '1.85 ➔ 1.62', rlm: true, time: '21:00' },
  { id: 2, home: 'Liverpool', away: 'Manchester City', league: 'EPL', confidence: 82, odds: '2.10 ➔ 1.95', rlm: false, time: '20:45' },
  { id: 3, home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga', confidence: 91, odds: '1.50 ➔ 1.45', rlm: true, time: '19:30' },
  { id: 4, home: 'PSG', away: 'Marseille', league: 'Ligue 1', confidence: 76, odds: '1.95 ➔ 2.10', rlm: false, time: '21:00' },
  { id: 5, home: 'Inter Milan', away: 'AC Milan', league: 'Serie A', confidence: 84, odds: '2.20 ➔ 1.88', rlm: true, time: '20:00' },
  { id: 6, home: 'Arsenal', away: 'Tottenham', league: 'EPL', confidence: 79, odds: '1.75 ➔ 1.80', rlm: false, time: '18:30' },
]

const tickerItems = [
  "⚡ SportyBet Odds Updated 2m ago",
  "🚨 RLM Alert: Chelsea vs Liverpool",
  "🟢 Lineups confirmed T-30m",
  "📈 Steam Move: Real Madrid odds drop 8%",
  "🤖 5-Agent Consensus Locked for Man City vs Arsenal"
]

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [tickerIndex, setTickerIndex] = useState(0)

  // Tick animation for the marquee
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const filteredGames = activeTab === 'all' 
    ? mockPredictions 
    : activeTab === 'high' 
    ? mockPredictions.filter(g => g.confidence >= 80) 
    : activeTab === 'rlm' 
    ? mockPredictions.filter(g => g.rlm) 
    : mockPredictions

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden">
      
      {/* --- 1. NAVIGATION HEADER --- */}
      <nav className="sticky top-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-xl text-white tracking-wide">Apex Analytics</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8 text-sm text-gray-400">
              <a href="#predictions" className="hover:text-white transition">Daily Predictions</a>
              <a href="#pipeline" className="hover:text-white transition">Data Pipeline</a>
              <a href="#agents" className="hover:text-white transition">AI Agents</a>
              <a href="#stream" className="hover:text-white transition">Market Stream</a>
              
              {/* ✅ Existing User Login */}
              <Link href="/auth/signin" className="text-white hover:text-emerald-400 font-medium transition">
                Sign In
              </Link>

              {/* ✅ "Get Access" Button now triggers Signup */}
              <Link 
                href="/auth/signup" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition"
              >
                Get Access
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-gray-400 hover:text-white">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0B0E14]">
            <div className="px-4 py-4 space-y-3 text-sm text-gray-400">
              <a href="#predictions" className="block hover:text-white transition">Daily Predictions</a>
              <a href="#pipeline" className="block hover:text-white transition">Data Pipeline</a>
              <a href="#agents" className="block hover:text-white transition">AI Agents</a>
              <a href="#stream" className="block hover:text-white transition">Market Stream</a>
              
              <div className="pt-2 border-t border-white/5">
                <Link href="/auth/signin" className="block text-center text-white hover:text-emerald-400 py-2 transition">
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="block w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition text-center"
                >
                  Get Access
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Live Ticker Bar */}
      <div className="bg-black/40 border-b border-white/5 py-1.5 overflow-hidden">
        <div className="flex items-center space-x-4 animate-marquee whitespace-nowrap text-xs font-mono text-emerald-400">
          {tickerItems.map((item, idx) => (
            <span key={idx} className="px-4">{item}</span>
          ))}
        </div>
      </div>

      {/* --- 2. HERO SECTION --- */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <Activity className="w-3 h-3 mr-1 animate-pulse" /> System Live & Operational
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Automated Sports Intelligence & <span className="text-emerald-400">Multi-Agent AI</span> Predictions
            </h1>
            <p className="text-lg text-gray-400 max-w-lg">
              Scanning real-time odds drift, T-30m lineups, and global market signals through a 5-Agent AI Consensus Network.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              
              {/* ✅ Primary CTA: Sends user to dashboard (requires login) */}
              <Link 
                href="/dashboard" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2"
              >
                Explore Today's Picks <ArrowRight className="w-4 h-4" />
              </Link>

              <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-xl transition flex items-center gap-2">
                View Live Market Scrapers <LineChart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hero Widget Card */}
          <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-6 rounded-3xl glow-emerald shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">Featured AI Pick</span>
                <h3 className="text-2xl font-bold text-white mt-1">Real Madrid vs Barcelona</h3>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span> RLM DETECTED
              </span>
            </div>

            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
              {/* Animated Gauge */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="30.14" className="shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-400 font-mono">88%</span>
                  <span className="text-[8px] text-gray-400 uppercase">Confidence</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Stats Agent</span>
                  <span className="text-emerald-400">Agree</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Market Agent</span>
                  <span className="text-emerald-400">Agree</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Field Agent</span>
                  <span className="text-emerald-400">Agree</span>
                </div>
                <div className="mt-1 text-[9px] text-cyan-400 font-mono">✓ 3/5 Agents Locked</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. AUTOMATED DATA PIPELINE SHOWCASE --- */}
      <section id="pipeline" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Zap className="w-6 h-6 text-emerald-400" /> Live Automation Pipeline
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Soccer24', status: 'Lineups/Stats', color: 'cyan-400' },
            { label: 'SportyBet', status: 'Live Odds Drift', color: 'amber-400' },
            { label: 'Telegram/X', status: 'Expert Consensus', color: 'emerald-400' },
            { label: 'News Outlets', status: 'Injuries/News', color: 'purple-400' },
          ].map((src, idx) => (
            <div key={idx} className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-white">{src.label}</span>
                <span className={`text-[10px] text-${src.color} flex items-center gap-1`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-${src.color} animate-pulse`}></span> Live
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1">{src.status}</div>
              <div className="mt-2 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full w-[90%] bg-${src.color} rounded-full`}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. DAILY PREDICTION GRID --- */}
      <section id="predictions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Today's Consensus Picks</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'high', 'rlm'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md border text-xs transition ${
                  activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                }`}
              >
                {tab === 'all' ? 'All Games' : tab === 'high' ? 'High Confidence (75%+)' : 'Sharp Money (RLM)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <div key={game.id} className={`bg-[rgba(18,23,33,0.75)] backdrop-blur-md border p-5 rounded-2xl hover:border-emerald-500/30 transition-colors ${game.rlm ? 'border-amber-500/30 glow-amber' : 'border-white/5'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-bold text-white">{game.home} vs {game.away}</h4>
                  <div className="text-[10px] text-gray-400 font-mono mt-1">{game.league} • {game.time}</div>
                </div>
                {game.rlm && (
                  <span className="bg-amber-500/10 text-amber-400 text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">RLM</span>
                )}
              </div>
              
              <div className="mt-3 bg-black/40 p-2 rounded-lg border border-white/5 flex justify-between text-xs">
                <div className="text-center flex-1">
                  <div className="text-gray-400">Confidence</div>
                  <div className="text-emerald-400 font-bold font-mono">{game.confidence}%</div>
                </div>
                <div className="text-center flex-1 border-l border-white/5 pl-2">
                  <div className="text-gray-400">Odds</div>
                  <div className="text-white font-mono">{game.odds}</div>
                </div>
              </div>

              <button className="w-full mt-3 text-[10px] text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 py-1.5 rounded-lg transition font-mono">
                View Deep AI Analysis →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* --- 5. MULTI-AGENT AI CONSENSUS SECTION --- */}
      <section id="agents" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">How the 5-Agent Network Works</h2>
            <p className="text-gray-400 text-sm mb-6">Our proprietary AI consensus engine divides the workload across specialized agents to ensure the highest accuracy.</p>
            <div className="space-y-3">
              {[
                { role: 'Statistical & xG Engine', desc: 'Analyzes historical data, possession, and expected goals.' },
                { role: 'Market Drift & RLM Risk Engine', desc: 'Tracks sharp money and Steam Moves across 30+ bookmakers.' },
                { role: 'Lineup & Social Intelligence Engine', desc: 'Ingests T-30m lineups and scrapes tipster sentiment.' },
                { role: 'Master Synthesizer & Confidence Judge', desc: 'Votes on the final recommendation and calculates confidence.' },
              ].map((agent, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${idx < 3 ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10' : 'border-emerald-400 text-emerald-400 bg-emerald-400/10'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{agent.role}</div>
                    <div className="text-[10px] text-gray-400">{agent.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-6 rounded-3xl flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-6xl mb-4">🧠</div>
            <div className="text-emerald-400 font-mono font-bold text-xl">Consensus Engine</div>
            <div className="text-gray-400 text-xs text-center mt-2 max-w-sm">All 5 agents pass their data to the synthesizer, which weights the evidence and calculates the final confidence score.</div>
          </div>
        </div>
      </section>

      {/* --- 6. LIVE MARKET STREAM --- */}
      <section id="stream" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Radio className="w-6 h-6 text-amber-400" /> Live Market Drift & Sharp Money
        </h2>
        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-black/60 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400">Match</th>
                  <th className="px-4 py-3 text-left text-gray-400">Opening Odds</th>
                  <th className="px-4 py-3 text-left text-gray-400">Current Odds</th>
                  <th className="px-4 py-3 text-left text-gray-400">Drift</th>
                  <th className="px-4 py-3 text-left text-gray-400">Public %</th>
                  <th className="px-4 py-3 text-left text-gray-400">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockPredictions.map((game) => (
                  <tr key={game.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white">{game.home} vs {game.away}</td>
                    <td className="px-4 py-3 text-gray-400">1.85</td>
                    <td className="px-4 py-3 text-emerald-400">{game.odds.split(' ➔ ')[1]}</td>
                    <td className="px-4 py-3 text-amber-400">-12%</td>
                    <td className="px-4 py-3 text-gray-400">68%</td>
                    <td className="px-4 py-3">
                      {game.rlm ? (
                        <span className="text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px]">RLM</span>
                      ) : (
                        <span className="text-gray-500 text-[9px]">Stable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- 7. SOCIAL PROOF & STATS --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'AI Win Rate', value: '72.8%', sub: 'Last 1,000 picks' },
            { label: 'Daily Games', value: '10-40', sub: 'Global Coverage' },
            { label: 'Avg Odds Value', value: '1.92', sub: 'Implied Probability' },
            { label: 'Scraper Uptime', value: '99.9%', sub: '24/7 Monitoring' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[rgba(18,23,33,0.75)] backdrop-blur-md border border-white/5 p-4 rounded-2xl text-center">
              <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 8. FOOTER --- */}
      <footer className="border-t border-white/5 bg-black/40 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-xl text-white tracking-wide">Apex Analytics</span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm">Automated sports intelligence, market scraping, and multi-agent AI predictions.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#predictions" className="hover:text-white transition">Predictions</a></li>
              <li><a href="#pipeline" className="hover:text-white transition">Pipeline</a></li>
              <li><a href="#agents" className="hover:text-white transition">AI Agents</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Disclaimer: For entertainment &amp; educational use only.</li>
              <li>18+ only. Gamble responsibly.</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-white/5 text-center text-xs text-gray-500">
          &copy; 2026 Apex Analytics. All rights reserved.
        </div>
      </footer>
    </div>
  )
}