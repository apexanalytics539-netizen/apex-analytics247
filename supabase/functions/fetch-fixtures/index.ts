import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get active leagues from database
    const { data: activeLeagues } = await supabase
      .from('leagues')
      .select('league_id, league_name, sport_type')
      .eq('is_active', true)

    if (!activeLeagues || activeLeagues.length === 0) {
      return new Response(JSON.stringify({ error: 'No active leagues found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log(`Found ${activeLeagues.length} active leagues`)

    // API-Sports key
    const API_KEY = Deno.env.get('API_SPORTS_KEY')
    
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'API_SPORTS_KEY not set' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Fetch fixtures for each active league
    let allFixtures = []
    const currentSeason = 2024 // Adjust as needed

    for (const league of activeLeagues) {
      try {
        console.log(`Fetching fixtures for ${league.league_name}`)
        
        const response = await fetch(
          `https://v3.football.api-sports.io/fixtures?league=${league.league_id}&season=${currentSeason}&next=10`,
          {
            headers: {
              'x-apisports-key': API_KEY,
              'x-rapidapi-host': 'v3.football.api-sports.io'
            }
          }
        )

        const data = await response.json()
        
        if (data.response && data.response.length > 0) {
          const fixtures = data.response.map((match: any) => ({
            external_id: match.fixture.id.toString(),
            sport: league.sport_type || 'football',
            league_name: league.league_name,
            home_team: match.teams.home.name,
            away_team: match.teams.away.name,
            match_time: match.fixture.date,
            status: 'PENDING'
          }))
          
          allFixtures = [...allFixtures, ...fixtures]
          console.log(`Added ${fixtures.length} fixtures for ${league.league_name}`)
        }
      } catch (error) {
        console.error(`Error fetching fixtures for ${league.league_name}:`, error)
      }
    }

    // Insert fixtures into database
    if (allFixtures.length > 0) {
      // Limit to 40 games total
      const limitedFixtures = allFixtures.slice(0, 40)
      
      const { error } = await supabase
        .from('fixtures')
        .upsert(limitedFixtures, { 
          onConflict: 'external_id', 
          ignoreDuplicates: true 
        })

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Fetched ${limitedFixtures.length} fixtures across ${activeLeagues.length} leagues`
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No fixtures found for active leagues'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})