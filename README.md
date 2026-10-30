# Checkmate & Twist Academy

A learning platform for chess players and Rubik's Cube solvers, built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, React Three Fiber, chess.js, react-chessboard, Stockfish 19 (WASM), cubejs and Supabase.

Everything that can run in the browser does, including the chess engine, the cube solver and camera processing. Supabase is optional. Without it the app runs in a clearly labelled **local guest mode**, where progress is saved in `localStorage`. Accounts, leaderboards, community and admin tools need Supabase. The app never shows fake users or sample leaderboard data.

## Features

| Area | What it does |
| --- | --- |
| Chess Academy (`/chess`) | 13 lessons (rules → openings → middlegame → endgame → tactics) with interactive step-through boards. Every move is validated with chess.js. |
| Tactics (`/chess/puzzles`) | 236 real Lichess puzzles (CC0), filterable by theme and rating, with hints, the solution and attempt tracking. |
| Play (`/chess/play`) | Play Stockfish 19 at levels 1–8, as either colour, with take-back and resign. |
| Analysis (`/chess/analysis`) | Import a FEN or PGN, get MultiPV 1–5 lines up to depth 22, an eval bar and a best-move arrow, step through moves, and copy the FEN/PGN. |
| Board scanner (`/chess/scanner`) | Photo or camera snapshot with an adjustable 8×8 grid overlay. **You place the pieces by hand.** There is no automatic piece recognition. The position is validated, then sent to analysis or play. |
| Cube Academy (`/cube`) | 11 lessons: notation, beginner method, CFOP (cross, F2L, OLL, PLL), Roux, ZZ, Petrus, other puzzles. |
| Algorithm library (`/cube/algorithms`) | 57 OLL, 21 PLL and 12 F2L cases, searchable. Diagrams are generated from the cube state each algorithm solves. |
| 3D simulator (`/cube/simulator`) | R3F cube with buttons and keyboard turns, random-state scrambles, algorithm input, and a two-phase solver whose solution you can play back. |
| Cube scanner (`/cube/scanner`) | Six-face camera capture. Colours are measured from real pixels and grouped by the cube's own centre colours. You can review and correct them. The state is validated (counts, twist, flip, parity), solved, and the solution animated. |
| Timer (`/cube/timer`) | WCA-style inspection, +2/DNF, ao5/ao12. |
| Quizzes, videos, dashboard | 5 quizzes (28 questions), 16 curated YouTube tutorials (privacy-enhanced lazy embeds), and a progress dashboard with achievements. |
| With Supabase | Email/password and magic-link auth, leaderboards (opt-out), a community board with moderation, and a role-gated admin page (stats, roles, moderation). |

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000 (copies Stockfish/cubejs files into public/ first)
# or production:
npm run build && npm start
```

Camera features need a secure context. `http://localhost` counts as secure. When you test on a phone over your LAN, you need HTTPS (for example `next dev --experimental-https`).

## Verification scripts

```bash
npm run verify          # all of the below except videos
npm run test:cube       # cube model vs cubejs, validator, 100 random solves verified, colour classifier (simulated scans)
npm run verify:algs     # every OLL/PLL/F2L algorithm solves its case
npm run verify:content  # every lesson/quiz/puzzle move is legal; cube lesson claims are checked
npm run test:db         # runs the Supabase migration in PGlite with a stubbed auth schema; 25 RLS/trigger/function checks
npm run verify:videos   # checks every YouTube ID via the oEmbed endpoint (needs internet)
```

## Supabase setup (optional)

1. Create a project at [supabase.com](https://supabase.com). The free tier is enough.
2. **SQL Editor →** paste and run `supabase/migrations/0001_init.sql`. It is idempotent, so you can re-run it after updates. It creates:
   - tables and row-level security;
   - leaderboard and admin functions;
   - a trigger that creates a profile for each new user.
3. **Authentication → Providers →** make sure **Email** is enabled. Magic links use the same provider.
4. **Authentication → URL Configuration:**
   - set **Site URL** to your app URL (e.g. `http://localhost:3000`);
   - add `http://localhost:3000/auth/callback` and your production `https://YOUR-DOMAIN/auth/callback` to **Redirect URLs**.
5. **Project Settings → API:** copy the Project URL and the `anon` public key into `.env.local`:

   ```bash
   cp .env.example .env.local
   # NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

   Restart `npm run dev`, or rebuild, because `NEXT_PUBLIC_*` values are inlined at build time.
6. **Make yourself admin:** sign up in the app, then run this in the SQL Editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

   Admins can then promote other users to moderator or admin from `/admin`.

Security notes:
- Users can only read and write their own progress rows.
- Users cannot change their own role or un-hide moderated posts (enforced by triggers).
- Leaderboards are exposed only through aggregate functions that respect each user's opt-out.
- Admin functions check `is_admin()` in the database.
- Never put the `service_role` key in this app.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Supabase project URL. If unset, the app runs in local guest mode. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Supabase anon (public) key. |

## Deploying

The app is a standard Next.js app, and every page is static or client-rendered.

- **Vercel:** import the repo and add the two env vars. Then add `https://YOUR-DOMAIN/auth/callback` to Supabase's redirect URLs.
- **Any Node host:** run `npm run build && npm start` (port 3000; use `-p` to change it).

The site must be served over HTTPS for camera access. Stockfish runs single-threaded, so no COOP/COEP headers are needed.

## Honest limitations

- **Chessboard photo recognition is not automatic.** The scanner aligns a grid on your photo and you place the pieces. No AI model is used, and none is claimed.
- **Cube colour detection** is classical computer vision (Lab colour plus balanced clustering around the centre colours), not a trained model. Glare and similar red/orange stickers can confuse it, so the review step is always shown and impossible states are rejected. It has been tested on simulated noisy scans. Real-world accuracy depends on lighting.
- Leaderboard solve times are self-reported from the in-app timer.

## Credits and licences

- Stockfish 19 (GPLv3), via the `stockfish` npm package. The licence is copied to `public/stockfish/COPYING-GPLv3.txt`.
- Puzzles from the [Lichess puzzle database](https://database.lichess.org/#puzzles) (CC0).
- Two-phase solver: [cubejs](https://github.com/ldez/cubejs) (MIT).
- chess.js (BSD-2), react-chessboard (MIT), three.js / React Three Fiber (MIT).
- Videos belong to their YouTube creators and are embedded, not rehosted.
