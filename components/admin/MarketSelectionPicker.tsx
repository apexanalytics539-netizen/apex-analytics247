'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { MARKET_GROUPS, MARKET_CATEGORIES, findMarket, type MarketGroup } from '@/lib/marketOptions'

type Props = {
  marketCode: string
  selectionLabel: string
  line: string
  onChange: (next: { marketCode: string; selectionLabel: string; line: string }) => void
}

function Dropdown({
  buttonLabel,
  isOpen,
  onToggle,
  children,
}: {
  buttonLabel: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 hover:border-emerald-500/40 transition"
      >
        <span className="truncate text-left">{buttonLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-[#0f1420] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )
}

export default function MarketSelectionPicker({ marketCode, selectionLabel, line, onChange }: Props) {
  const [marketOpen, setMarketOpen] = useState(false)
  const [selectionOpen, setSelectionOpen] = useState(false)
  const [marketQuery, setMarketQuery] = useState('')
  const [selectionQuery, setSelectionQuery] = useState('')

  const activeMarket = useMemo(() => findMarket(marketCode), [marketCode])

  const filteredMarkets = useMemo(() => {
    const q = marketQuery.trim().toLowerCase()
    const groups = q ? MARKET_GROUPS.filter((m) => m.label.toLowerCase().includes(q)) : MARKET_GROUPS
    const byCategory: Record<string, MarketGroup[]> = {}
    for (const m of groups) {
      byCategory[m.category] = byCategory[m.category] || []
      byCategory[m.category].push(m)
    }
    return byCategory
  }, [marketQuery])

  const filteredSelections = useMemo(() => {
    if (!activeMarket) return []
    const q = selectionQuery.trim().toLowerCase()
    return q ? activeMarket.selections.filter((s) => s.label.toLowerCase().includes(q)) : activeMarket.selections
  }, [activeMarket, selectionQuery])

  const pickMarket = (m: MarketGroup) => {
    onChange({ marketCode: m.code, selectionLabel: '', line: m.defaultLine || '' })
    setMarketOpen(false)
    setMarketQuery('')
  }

  const pickSelection = (label: string) => {
    onChange({ marketCode, selectionLabel: label, line })
    setSelectionOpen(false)
    setSelectionQuery('')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-400 font-mono mb-1 block">Market</label>
        <Dropdown buttonLabel={activeMarket ? activeMarket.label : 'Choose a market...'} isOpen={marketOpen} onToggle={() => setMarketOpen((o) => !o)}>
          <div className="p-2 border-b border-white/10 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <input
              autoFocus
              value={marketQuery}
              onChange={(e) => setMarketQuery(e.target.value)}
              placeholder="Search markets..."
              className="w-full bg-transparent text-sm text-gray-200 focus:outline-none placeholder:text-gray-600"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {MARKET_CATEGORIES.map((cat) => {
              const items = filteredMarkets[cat]
              if (!items || items.length === 0) return null
              return (
                <div key={cat}>
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500 font-mono">{cat}</div>
                  {items.map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => pickMarket(m)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-emerald-500/10 hover:text-emerald-400 transition ${
                        m.code === marketCode ? 'text-emerald-400 bg-emerald-500/5' : 'text-gray-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )
            })}
            {Object.keys(filteredMarkets).length === 0 && (
              <div className="px-3 py-4 text-xs text-gray-500 text-center">No markets match "{marketQuery}"</div>
            )}
          </div>
        </Dropdown>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-400 font-mono mb-1 block">
          Selection {activeMarket?.hasLine && <span className="text-gray-600">(with line)</span>}
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Dropdown
              buttonLabel={selectionLabel || (activeMarket ? 'Choose a selection...' : 'Pick a market first')}
              isOpen={selectionOpen}
              onToggle={() => activeMarket && setSelectionOpen((o) => !o)}
            >
              <div className="p-2 border-b border-white/10 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <input
                  autoFocus
                  value={selectionQuery}
                  onChange={(e) => setSelectionQuery(e.target.value)}
                  placeholder="Search selections..."
                  className="w-full bg-transparent text-sm text-gray-200 focus:outline-none placeholder:text-gray-600"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredSelections.map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => pickSelection(s.label)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-emerald-500/10 hover:text-emerald-400 transition ${
                      s.label === selectionLabel ? 'text-emerald-400 bg-emerald-500/5' : 'text-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                {filteredSelections.length === 0 && (
                  <div className="px-3 py-4 text-xs text-gray-500 text-center">No selections match</div>
                )}
              </div>
            </Dropdown>
          </div>
          {activeMarket?.hasLine && (
            <input
              value={line}
              onChange={(e) => onChange({ marketCode, selectionLabel, line: e.target.value })}
              placeholder="Line"
              className="w-20 bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-200 text-center focus:outline-none focus:border-emerald-500/50"
            />
          )}
        </div>
      </div>
    </div>
  )
}