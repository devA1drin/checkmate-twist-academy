// chess-game: server-authoritative move validation for live games.
// The client sends { gameId, ply, from, to, promotion }. The function checks the caller's JWT,
// replays the stored moves with chess.js, rejects illegal moves, detects game end, and records the
// move through public.server_apply_move (callable only with the service role). Turn order, stale
// positions and clocks are enforced inside that SQL function under a row lock.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Chess } from "npm:chess.js@1.4.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SQUARE = /^[a-h][1-8]$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !auth?.user) return json({ ok: false, error: "Please sign in again." }, 401);
  const userId = auth.user.id;

  let body: { gameId?: string; ply?: number; from?: string; to?: string; promotion?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
  const { gameId, ply, from, to } = body;
  const promotion = body.promotion && ["q", "r", "b", "n"].includes(body.promotion) ? body.promotion : undefined;
  if (typeof gameId !== "string" || !/^[0-9a-f-]{36}$/i.test(gameId) || !Number.isInteger(ply) || !SQUARE.test(from ?? "") || !SQUARE.test(to ?? "")) {
    return json({ ok: false, error: "Invalid move." }, 400);
  }

  const { data: game, error } = await admin.from("games").select("id, status, white, black, moves, ply").eq("id", gameId).maybeSingle();
  if (error || !game) return json({ ok: false, error: "Game not found." }, 404);
  if (game.status !== "active") return json({ ok: false, error: "The game is not in progress." }, 409);
  if (userId !== game.white && userId !== game.black) return json({ ok: false, error: "You are not playing in this game." }, 403);
  if (ply !== game.ply) return json({ ok: false, error: "The position changed. Please try again." }, 409);

  const chess = new Chess();
  for (const uci of game.moves as string[]) {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
  }
  const mover = chess.turn() === "w" ? game.white : game.black;
  if (mover !== userId) return json({ ok: false, error: "It is not your turn." }, 409);

  let san: string;
  try {
    san = chess.move({ from: from!, to: to!, promotion }).san;
  } catch {
    return json({ ok: false, error: "Illegal move." }, 422);
  }
  const uci = `${from}${to}${promotion && san.includes("=") ? promotion : ""}`;

  let result: string | null = null;
  let reason: string | null = null;
  if (chess.isCheckmate()) {
    result = chess.turn() === "w" ? "0-1" : "1-0";
    reason = "checkmate";
  } else if (chess.isStalemate()) {
    result = "1/2-1/2"; reason = "stalemate";
  } else if (chess.isInsufficientMaterial()) {
    result = "1/2-1/2"; reason = "insufficient";
  } else if (chess.isThreefoldRepetition()) {
    result = "1/2-1/2"; reason = "repetition";
  } else if (chess.isDrawByFiftyMoves()) {
    result = "1/2-1/2"; reason = "fifty_move";
  }

  const { data: applied, error: rpcError } = await admin.rpc("server_apply_move", {
    p_game: gameId, p_user: userId, p_ply: ply, p_uci: uci, p_san: san, p_fen: chess.fen(), p_result: result, p_reason: reason,
  });
  if (rpcError) return json({ ok: false, error: "Could not save the move. Please try again." }, 500);
  if (!applied?.ok) return json(applied, 409);
  return json({ ok: true, san, uci, fen: chess.fen(), result, reason });
});
