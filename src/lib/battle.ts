export interface Room { id: string; host: string | null; name: string; status: "lobby" | "running" | "finished"; rounds: number; inspection_s: number; visibility: "public" | "link"; current_round: number; created_at: string; finished_at: string | null }
export interface Result { round_no: number; user_id: string; time_ms: number | null; dnf: boolean; created_at: string }
export interface Player { user_id: string; display_name: string; joined_at: string }
export const ROOM_COLUMNS = "id, host, name, status, rounds, inspection_s, visibility, current_round, created_at, finished_at";

/** Standings: most round wins first, then the lowest mean of finished solves. */
export function standings(players: Player[], results: Result[], rounds: number) {
  const rows = players.map((p) => ({ ...p, wins: 0, done: 0, dnfs: 0, total: 0, mean: null as number | null }));
  for (let r = 1; r <= rounds; r++) {
    const rr = results.filter((x) => x.round_no === r);
    const best = rr.filter((x) => !x.dnf && x.time_ms).sort((a, b) => a.time_ms! - b.time_ms!)[0];
    if (best && rr.length >= 2) { const w = rows.find((x) => x.user_id === best.user_id); if (w) w.wins++; }
  }
  for (const row of rows) {
    const mine = results.filter((x) => x.user_id === row.user_id);
    const ok = mine.filter((x) => !x.dnf && x.time_ms);
    row.done = ok.length; row.dnfs = mine.length - ok.length;
    row.total = ok.reduce((a, x) => a + x.time_ms!, 0);
    row.mean = ok.length ? Math.round(row.total / ok.length) : null;
  }
  return rows.sort((a, b) => b.wins - a.wins || a.dnfs - b.dnfs || (a.mean ?? Infinity) - (b.mean ?? Infinity));
}
