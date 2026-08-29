import { supabase } from './supabase'

const SPORTSDB_API_KEY = '123'

async function fetchTeamLogos() {
  console.log('Starting logo fetch...')
  
  // 1. Get fixtures where logos are missing
  const { data: fixtures, error } = await supabase
    .from('fixtures')
    .select('id, home_team, away_team, home_team_logo, away_team_logo')
    .is('home_team_logo', null)
    .or('away_team_logo.is.null')
    .limit(50)

  if (error || !fixtures) {
    console.error('Error fetching fixtures:', error)
    return
  }

  console.log(`Found ${fixtures.length} fixtures missing logos`)

  // 2. Loop through fixtures and fetch logos
  for (const fixture of fixtures) {
    const updates: any = {}

    // Fetch Home Team Logo
    if (!fixture.home_team_logo) {
      const homeLogo = await fetchTeamLogo(fixture.home_team)
      if (homeLogo) updates.home_team_logo = homeLogo
    }

    // Fetch Away Team Logo
    if (!fixture.away_team_logo) {
      const awayLogo = await fetchTeamLogo(fixture.away_team)
      if (awayLogo) updates.away_team_logo = awayLogo
    }

    // 3. Save the logos to the database
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('fixtures')
        .update(updates)
        .eq('id', fixture.id)

      if (updateError) {
        console.error(`Error updating fixture ${fixture.id}:`, updateError)
      } else {
        console.log(`✅ Updated logos for ${fixture.home_team} vs ${fixture.away_team}`)
      }
    }
  }

  console.log('✅ Logo fetch completed!')
}

// Helper function to fetch a single team's logo
async function fetchTeamLogo(teamName: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`
    )
    const data = await response.json()
    
    if (data.teams && data.teams.length > 0) {
      return data.teams[0].strTeamBadge || null
    }
    return null
  } catch (error) {
    console.error(`Error fetching logo for ${teamName}:`, error)
    return null
  }
}

// Run the script
fetchTeamLogos()