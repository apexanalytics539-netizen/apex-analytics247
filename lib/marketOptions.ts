// Curated from the Bet9ja market-code sheet. The raw sheet has ~300 entries
// because every stat (shots on target, fouls, offsides...) gets its own row
// per 0.5 line increment, and several sections repeat with typos. That's not
// dropdown-friendly, so lines-based markets are collapsed into ONE entry with
// a free "line" input (e.g. "Over/Under" + line "2.5") instead of one entry
// per threshold. Codes below are ours (used as `primary_market_code` in our
// own DB) — they don't need to match Bet9ja's internal numeric codes.

export type MarketSelection = { code: string; label: string }

export type MarketGroup = {
  code: string
  label: string
  category: string
  hasLine?: boolean
  defaultLine?: string
  selections: MarketSelection[]
}

const sel = (labels: string[]): MarketSelection[] =>
  labels.map((l) => ({ code: l.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''), label: l }))

export const MARKET_GROUPS: MarketGroup[] = [
  // --- FULL TIME ---
  { code: '1x2', label: '1X2', category: 'Full Time', selections: sel(['Home', 'Draw', 'Away']) },
  { code: 'double_chance', label: 'Double Chance', category: 'Full Time', selections: sel(['Home or Draw', 'Home or Away', 'Draw or Away']) },
  { code: 'draw_no_bet', label: 'Draw No Bet', category: 'Full Time', selections: sel(['Home', 'Away']) },
  { code: 'over_under', label: 'Over/Under Goals', category: 'Full Time', hasLine: true, defaultLine: '2.5', selections: sel(['Over', 'Under']) },
  { code: 'btts', label: 'Both Teams to Score', category: 'Full Time', selections: sel(['Yes', 'No']) },
  { code: 'handicap', label: 'Handicap', category: 'Full Time', hasLine: true, defaultLine: '-1', selections: sel(['Home', 'Draw', 'Away']) },
  { code: 'correct_score', label: 'Correct Score', category: 'Full Time', selections: sel(['0-0', '1-0', '0-1', '1-1', '2-0', '0-2', '2-1', '1-2', '2-2', '3-0', '0-3', '3-1', '1-3', '3-2', '2-3', '3-3', 'Other']) },
  { code: 'ht_ft', label: 'HT/FT', category: 'Full Time', selections: sel(['Home/Home', 'Home/Draw', 'Home/Away', 'Draw/Home', 'Draw/Draw', 'Draw/Away', 'Away/Home', 'Away/Draw', 'Away/Away']) },
  { code: 'first_goal', label: 'First Goal', category: 'Full Time', selections: sel(['Home', 'Away', 'No Goal']) },
  { code: 'last_goal', label: 'Last Goal', category: 'Full Time', selections: sel(['Home', 'Away', 'No Goal']) },
  { code: 'odd_even', label: 'Odd/Even Goals', category: 'Full Time', selections: sel(['Odd', 'Even']) },
  { code: 'total_goals', label: 'Total Goals', category: 'Full Time', selections: sel(['0 Goals', '1 Goal', '2 Goals', '3 Goals', '4 Goals', '5 Goals', '6+ Goals']) },
  { code: 'goals_home', label: 'Goals - Home Team', category: 'Full Time', selections: sel(['0', '1', '2', '3+']) },
  { code: 'goals_away', label: 'Goals - Away Team', category: 'Full Time', selections: sel(['0', '1', '2', '3+']) },
  { code: 'win_margin', label: 'Winning Margin', category: 'Full Time', selections: sel(['Home by 1', 'Home by 2', 'Home by 3+', 'Away by 1', 'Away by 2', 'Away by 3+', 'Draw']) },
  { code: 'team_to_score', label: 'Team to Score', category: 'Full Time', selections: sel(['Home Only', 'Away Only', 'Both', 'Neither']) },
  { code: 'win_to_nil', label: 'Win to Nil', category: 'Full Time', selections: sel(['Home Yes', 'Home No', 'Away Yes', 'Away No']) },
  { code: 'multi_goal', label: 'Multi Goal Range', category: 'Full Time', selections: sel(['1-2', '1-3', '2-3', '1-4', '1-5', '1-6', '2-4', '2-5', '2-6', '3-4', '3-5', '3-6', '4-5', '4-6', '5-6', '7+']) },

  // --- HALF TIME ---
  { code: '1x2_ht', label: '1X2 (Half Time)', category: 'Half Time', selections: sel(['Home', 'Draw', 'Away']) },
  { code: 'double_chance_ht', label: 'Double Chance (HT)', category: 'Half Time', selections: sel(['Home or Draw', 'Home or Away', 'Draw or Away']) },
  { code: 'btts_ht', label: 'Both Teams to Score (HT)', category: 'Half Time', selections: sel(['Yes', 'No']) },
  { code: 'over_under_ht', label: 'Over/Under Goals (HT)', category: 'Half Time', hasLine: true, defaultLine: '0.5', selections: sel(['Over', 'Under']) },
  { code: 'correct_score_ht', label: 'Correct Score (HT)', category: 'Half Time', selections: sel(['0-0', '0-1', '1-0', '1-1', '1-2', '2-0', '2-1', '2-2', 'Other']) },
  { code: 'total_goals_ht', label: 'Total Goals (HT)', category: 'Half Time', selections: sel(['0', '1', '2+']) },

  // --- SECOND HALF ---
  { code: '1x2_2ht', label: '1X2 (2nd Half)', category: 'Second Half', selections: sel(['Home', 'Draw', 'Away']) },
  { code: 'double_chance_2ht', label: 'Double Chance (2nd Half)', category: 'Second Half', selections: sel(['Home or Draw', 'Home or Away', 'Draw or Away']) },
  { code: 'btts_2ht', label: 'Both Teams to Score (2nd Half)', category: 'Second Half', selections: sel(['Yes', 'No']) },
  { code: 'over_under_2ht', label: 'Over/Under Goals (2nd Half)', category: 'Second Half', hasLine: true, defaultLine: '0.5', selections: sel(['Over', 'Under']) },
  { code: 'correct_score_2ht', label: 'Correct Score (2nd Half)', category: 'Second Half', selections: sel(['0-0', '1-0', '2-0', '0-1', '1-1', '2-1', '0-2', '1-2', '2-2', 'Other']) },
  { code: 'total_goals_2ht', label: 'Total Goals (2nd Half)', category: 'Second Half', selections: sel(['0', '1', '2+']) },

  // --- COMBOS ---
  { code: '1x2_ou', label: '1X2 & Over/Under', category: 'Combos', hasLine: true, defaultLine: '2.5', selections: sel(['Home & Over', 'Home & Under', 'Draw & Over', 'Draw & Under', 'Away & Over', 'Away & Under']) },
  { code: '1x2_btts', label: '1X2 & BTTS', category: 'Combos', selections: sel(['Home & Yes', 'Home & No', 'Draw & Yes', 'Draw & No', 'Away & Yes', 'Away & No']) },
  { code: 'dc_ou', label: 'Double Chance & Over/Under', category: 'Combos', hasLine: true, defaultLine: '2.5', selections: sel(['Home/Draw & Over', 'Home/Draw & Under', 'Home/Away & Over', 'Home/Away & Under', 'Draw/Away & Over', 'Draw/Away & Under']) },
  { code: 'dc_btts', label: 'Double Chance & BTTS', category: 'Combos', selections: sel(['Home/Draw & Yes', 'Home/Draw & No', 'Home/Away & Yes', 'Home/Away & No', 'Draw/Away & Yes', 'Draw/Away & No']) },
  { code: 'btts_ou_2_5', label: 'BTTS & Over/Under 2.5', category: 'Combos', selections: sel(['Yes & Over', 'Yes & Under', 'No & Over', 'No & Under']) },
  { code: 'first_goal_1x2', label: 'First Goal & Match Result', category: 'Combos', selections: sel(['Home 1st Goal & Home Win', 'Home 1st Goal & Draw', 'Home 1st Goal & Away Win', 'Away 1st Goal & Home Win', 'Away 1st Goal & Draw', 'Away 1st Goal & Away Win', 'No Goal (0-0)']) },

  // --- CORNERS ---
  { code: '1x2_corners', label: '1X2 - Corners', category: 'Corners', selections: sel(['Home', 'Draw', 'Away']) },
  { code: 'over_under_corners', label: 'Over/Under Corners', category: 'Corners', hasLine: true, defaultLine: '9.5', selections: sel(['Over', 'Under']) },
  { code: 'total_corners', label: 'Total Corners Range', category: 'Corners', selections: sel(['0-8', '9-11', '12+']) },
  { code: 'odd_even_corners', label: 'Odd/Even Corners', category: 'Corners', selections: sel(['Odd', 'Even']) },

  // --- SPECIALS ---
  { code: 'penalty_awarded', label: 'Penalty Awarded', category: 'Specials', selections: sel(['Yes', 'No']) },
  { code: 'penalty_result', label: 'Penalty Scored/Missed', category: 'Specials', selections: sel(['Scored', 'Missed']) },
  { code: 'red_card', label: 'Red Card', category: 'Specials', selections: sel(['Yes', 'No']) },
  { code: 'extra_time', label: 'Extra Time', category: 'Specials', selections: sel(['Yes', 'No']) },
  { code: 'how_decided', label: 'How Match is Decided', category: 'Specials', selections: sel(['Home in 90', 'Away in 90', 'Home in Extra Time', 'Away in Extra Time', 'Home on Penalties', 'Away on Penalties']) },
  { code: 'highest_scoring_half', label: 'Highest Scoring Half', category: 'Specials', selections: sel(['1st Half', '2nd Half', 'Equal']) },
  { code: 'minute_first_goal', label: 'Minute of First Goal', category: 'Specials', selections: sel(['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', 'No Goal']) },

  // --- TEAM STATS (collapsed; line + scope both editable) ---
  { code: 'shots_on_target', label: 'Shots on Target O/U', category: 'Team Stats', hasLine: true, defaultLine: '4.5', selections: sel(['Home Over', 'Home Under', 'Away Over', 'Away Under', 'Total Over', 'Total Under']) },
  { code: 'fouls', label: 'Fouls O/U', category: 'Team Stats', hasLine: true, defaultLine: '22.5', selections: sel(['Home Over', 'Home Under', 'Away Over', 'Away Under', 'Total Over', 'Total Under']) },
  { code: 'offsides', label: 'Offsides O/U', category: 'Team Stats', hasLine: true, defaultLine: '2.5', selections: sel(['Home Over', 'Home Under', 'Away Over', 'Away Under', 'Total Over', 'Total Under']) },
]

export const MARKET_CATEGORIES = Array.from(new Set(MARKET_GROUPS.map((g) => g.category)))

export function findMarket(code: string): MarketGroup | undefined {
  return MARKET_GROUPS.find((g) => g.code === code)
}