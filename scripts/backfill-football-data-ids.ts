// scripts/backfill-football-data-ids.ts
// Run with: npx tsx scripts/backfill-football-data-ids.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// ============================================
// CONFIGURATION WITH VALIDATION
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FOOTBALL_DATA_KEY) {
  console.error('Missing required environment variables.')
  console.error('Check that .env exists in your project root and contains:')
  console.error('  - SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_KEY')
  console.error('  - FOOTBALL_DATA_KEY')
  process.exit(1)
}

// Now TypeScript knows these are strings (not undefined)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const API_KEY: string = FOOTBALL_DATA_KEY

async function backfillTeamIds() {
  console.log('Fetching teams without football_data_org_id...')

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name')
    .is('football_data_org_id', null)

  if (error) {
    console.error('Error fetching teams:', error.message)
    return
  }

  if (!teams || teams.length === 0) {
    console.log('All teams already have football_data_org_id!')
    return
  }

  console.log(`Found ${teams.length} teams to process\n`)

  const results: { name: string; matched: string | null; id: number | null }[] = []
  let queue = [...teams]
  let pass = 1
  const MAX_PASSES = 3
  const RATE_LIMIT_DELAY_MS = 7000
  const RATE_LIMIT_RETRY_WAIT_MS = 60000

  while (queue.length > 0 && pass <= MAX_PASSES) {
    console.log(`\n--- Pass ${pass}: ${queue.length} team(s) remaining ---`)
    const retryQueue: typeof queue = []

    for (const team of queue) {
      console.log(`  Processing: ${team.name}`)

      try {
        const response = await fetch(
          `https://api.football-data.org/v4/teams?name=${encodeURIComponent(team.name)}`,
          {
            headers: { 'X-Auth-Token': API_KEY }
          }
        )

        if (response.status === 429) {
          console.log(`  Rate limited: ${team.name} - will retry next pass`)
          retryQueue.push(team)
          await new Promise(r => setTimeout(r, RATE_LIMIT_RETRY_WAIT_MS))
          continue
        }

        if (!response.ok) {
          console.log(`  API error ${response.status}: ${team.name}`)
          results.push({ name: team.name, matched: null, id: null })
          await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS))
          continue
        }

        const data = await response.json()
        const match = data.teams?.[0]

        if (match?.id) {
          const { error: updateError } = await supabase
            .from('teams')
            .update({ football_data_org_id: match.id })
            .eq('id', team.id)

          if (updateError) {
            console.log(`  Failed to update ${team.name}:`, updateError.message)
          } else {
            console.log(`  ${team.name} -> ${match.name} (ID: ${match.id})`)
          }
        } else {
          console.log(`  No match found: ${team.name}`)
        }

        results.push({
          name: team.name,
          matched: match?.name || null,
          id: match?.id || null
        })

        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS))

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.log(`  Exception: ${team.name} - ${errorMessage}`)
        retryQueue.push(team)
        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS))
      }
    }

    queue = retryQueue
    pass++
  }

  if (queue.length > 0) {
    console.log(`\n${queue.length} team(s) never resolved after ${MAX_PASSES} passes:`, queue.map(t => t.name).join(', '))
  }

  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY - REVIEW THESE MATCHES CAREFULLY')
  console.log('='.repeat(60))

  results.forEach(r => {
    const status = r.id ? '[OK]' : '[MISSING]'
    console.log(`${status} ${r.name} -> ${r.matched || 'NOT FOUND'} (ID: ${r.id || 'NULL'})`)
  })

  console.log('\nIf any match is WRONG, update it manually:')
  console.log("UPDATE teams SET football_data_org_id = [correct_id] WHERE name = 'Team Name';")
}

backfillTeamIds()