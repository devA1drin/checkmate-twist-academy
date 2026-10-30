/** XP needed to reach level n is 100·n(n−1)/2: level 2 = 100, level 3 = 300, level 5 = 1,000. */
export function levelFromXp(xp: number) {
  let level = 1;
  while (100 * ((level + 1) * level) / 2 <= xp) level++;
  const start = (100 * level * (level - 1)) / 2, next = (100 * (level + 1) * level) / 2;
  return { level, start, next, into: xp - start, need: next - start };
}

export const LEAGUES = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 100 },
  { name: "Gold", min: 300 },
  { name: "Diamond", min: 700 },
] as const;
export function leagueFor(weekXp: number) {
  let l: (typeof LEAGUES)[number] = LEAGUES[0];
  for (const x of LEAGUES) if (weekXp >= x.min) l = x;
  return l;
}

/** How XP is earned (mirrors the database rules in migration 0003). */
export const XP_RULES: [string, string][] = [
  ["Finish a lesson", "20 XP"],
  ["Solve a chess puzzle (first time)", "5 XP, up to 100 a day"],
  ["Finish an online game", "10 XP, +10 for a win, +5 for a draw"],
  ["Game against the computer", "2 to 10 XP, up to 60 a day"],
  ["Correct line in an opening drill", "3 XP, up to 90 a day"],
  ["Daily puzzle or daily scramble", "15 XP each"],
  ["Finish a challenge", "50 XP"],
  ["Cube battle round", "3 XP"],
  ["Timed cube solve", "1 XP, up to 50 a day"],
  ["Forum thread / reply", "5 / 2 XP"],
];
