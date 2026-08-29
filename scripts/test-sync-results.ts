// scripts/test-sync-results.ts
// Run with: npx tsx scripts/test-sync-results.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FOOTBALL_DATA_KEY) {
  console.error('Missing required environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testSyncResults() {
  console.log('Testing sync-results logic locally...\n')

  // 1. Get a match to test (only complete matches)
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      home_team_id,
      away_team_id,
      kickoff_at,
      home_team:teams!matches_home_team_id_fkey(id, name, football_data_org_id),
      away_team:teams!matches_away_team_id_fkey(id, name, football_data_org_id)
    `)
    .not('home_team_id', 'is', null)
    .not('away_team_id', 'is', null)
    .order('id', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Error fetching matches:', error.message)
    return
  }

  if (!matches || matches.length === 0) {
    console.log('No complete matches found in database.')
    console.log('Please insert a match with both teams assigned first.')
    return
  }

  const match = matches[0]

  // ✅ FIX: Handle array vs object from Supabase
  const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team
  const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team

  console.log('Match found:')
  console.log(`  ID: ${match.id}`)
  console.log(`  ${homeTeam?.name ?? 'unknown'} vs ${awayTeam?.name ?? 'unknown'}`)
  console.log(`  Kickoff: ${match.kickoff_at}`)
  console.log('')

  const homeFdId = homeTeam?.football_data_org_id
  const awayFdId = awayTeam?.football_data_org_id

  console.log('Football-data.org IDs:')
  console.log(`  Home: ${homeFdId ?? 'NULL'} (${homeTeam?.name ?? 'unknown'})`)
  console.log(`  Away: ${awayFdId ?? 'NULL'} (${awayTeam?.name ?? 'unknown'})`)
  console.log('')

  if (!homeFdId || !awayFdId) {
    console.error('❌ Missing football_data_org_id for one or both teams.')
    return
  }

  // 2. Try to fetch the fixture from football-data.org
  const matchDate = match.kickoff_at?.split('T')[0]
  console.log(`Fetching fixture for date: ${matchDate}`)

  const url = `https://api.football-data.org/v4/teams/${homeFdId}/matches?dateFrom=${matchDate}&dateTo=${matchDate}`

  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': FOOTBALL_DATA_KEY
    } as HeadersInit
  })

  console.log(`Response status: ${response.status}`)

  if (!response.ok) {
    console.error(`❌ API error: ${response.status}`)
    if (response.status === 404) {
      console.log('   No matches found for this team/date combination.')
    } else if (response.status === 429) {
      console.log('   Rate limited. Try again in a few seconds.')
    }
    return
  }

  const data = await response.json()
  const fixtures = data.matches || []

  console.log(`Fixtures found: ${fixtures.length}`)

  if (fixtures.length === 0) {
    console.log('❌ No fixtures found for this date.')
    console.log('   Possible reasons:')
    console.log('   - The match hasn\'t been added to football-data.org yet')
    console.log('   - The date is wrong')
    console.log('   - The season is not available on the free tier')
    console.log('   - The team ID is incorrect')
    return
  }

  // Find the exact fixture
  const fixture = fixtures.find((f: any) =>
    f.homeTeam.id === homeFdId && f.awayTeam.id === awayFdId
  )

  if (!fixture) {
    console.log('❌ No fixture found for this specific matchup.')
    console.log('   Available fixtures:')
    fixtures.forEach((f: any) => {
      console.log(`     ${f.homeTeam?.name} vs ${f.awayTeam?.name} (${f.status})`)
    })
    return
  }

  console.log('\n✅ Fixture found!')
  console.log(`  Home: ${fixture.homeTeam?.name}`)
  console.log(`  Away: ${fixture.awayTeam?.name}`)
  console.log(`  Status: ${fixture.status}`)
  console.log(`  Date: ${fixture.utcDate}`)
  console.log(`  Score: ${fixture.score?.fullTime?.home ?? '?'} - ${fixture.score?.fullTime?.away ?? '?'}`)

  if (fixture.status === 'FINISHED') {
    console.log('\n✅ This match can be graded!')
  } else {
    console.log('\n⏳ This match is not finished yet. Grade after it completes.')
  }
}

testSyncResults()