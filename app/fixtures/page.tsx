'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFixtures()
  }, [])

  const loadFixtures = async () => {
    setLoading(true)
    try {
      console.log('Loading fixtures...')
      
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .order('match_time', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        setError(error.message)
      } else {
        console.log(`Found ${data?.length || 0} fixtures`)
        setFixtures(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load fixtures')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={loadFixtures}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fixtures</h1>
      
      {fixtures.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No fixtures found in database.</p>
          <p className="text-gray-400 mt-2">Run the SQL insert script to add fixtures.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">
                    {fixture.home_team} vs {fixture.away_team}
                  </div>
                  <div className="text-sm text-gray-500">
                    {fixture.league_name} • {fixture.sport}
                  </div>
                  <div className="text-sm text-gray-500">
                    {fixture.match_time ? new Date(fixture.match_time).toLocaleString() : 'TBD'}
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    fixture.status === 'ANALYZED' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fixture.status || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}