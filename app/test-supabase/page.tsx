'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

export default function AdminDashboard() {
  const [leagues, setLeagues] = useState<any[]>([])
  const [fixtures, setFixtures] = useState<any[]>([])
  const [aiStats, setAiStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load leagues
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select('*')
        .order('league_name')
      setLeagues(leaguesData || [])
      console.log('Leagues loaded:', leaguesData?.length || 0)

      // Load fixtures - USING THE CORRECT QUERY
      const { data: fixturesData } = await supabase
        .from('fixtures')
        .select('*')
        .order('match_time', { ascending: true })
      
      console.log('Fixtures loaded:', fixturesData?.length || 0)
      console.log('First fixture:', fixturesData?.[0])
      setFixtures(fixturesData || [])

      // Load AI stats
      const { data: statsData } = await supabase
        .from('ai_predictions')
        .select('ai_provider, primary_confidence')
      setAiStats(statsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLeague = async (leagueId: number, currentStatus: boolean) => {
    await supabase
      .from('leagues')
      .update({ is_active: !currentStatus })
      .eq('id', leagueId)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Apex Analytics Admin</h1>
      
      <Tabs defaultValue="fixtures" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leagues">League Control</TabsTrigger>
          <TabsTrigger value="fixtures">Match Queue</TabsTrigger>
          <TabsTrigger value="ai">AI Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="leagues" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leagues.length > 0 ? (
              leagues.map((league) => (
                <div key={league.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{league.league_name}</h3>
                      <p className="text-sm text-gray-500">{league.country}</p>
                      <p className="text-xs text-gray-400">{league.sport_type}</p>
                    </div>
                    <Switch
                      checked={league.is_active === true}
                      onCheckedChange={() => toggleLeague(league.id, league.is_active)}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                No leagues found. Add leagues in Supabase to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fixtures" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Match</th>
                  <th className="p-3 text-left">League</th>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.length > 0 ? (
                  fixtures.map((fixture, index) => (
                    <tr key={fixture.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium">
                        {fixture.home_team} <span className="text-gray-400">vs</span> {fixture.away_team}
                      </td>
                      <td className="p-3">{fixture.league_name}</td>
                      <td className="p-3">
                        {fixture.match_time ? new Date(fixture.match_time).toLocaleString() : 'TBD'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          fixture.status === 'ANALYZED' 
                            ? 'bg-green-100 text-green-800'
                            : fixture.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {fixture.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No fixtures found. Run the fetch-fixtures function to load matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-500">
              Total: {fixtures.length} fixtures loaded
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(
              aiStats.reduce((acc: any, curr: any) => {
                acc[curr.ai_provider] = acc[curr.ai_provider] || []
                acc[curr.ai_provider].push(curr.primary_confidence)
                return acc
              }, {})
            ).map(([provider, confidences]: [string, any]) => (
              <div key={provider} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <h3 className="font-semibold">{provider}</h3>
                <p className="text-sm">
                  Average Confidence: {Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length)}%
                </p>
                <p className="text-sm text-gray-500">
                  Total Picks: {confidences.length}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}