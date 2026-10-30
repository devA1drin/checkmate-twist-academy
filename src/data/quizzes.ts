export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
  fen?: string; // position shown with the question
  correctSan?: string; // verified with chess.js
  alg?: string;
  algCheck?: "solves-sune";
}
export interface Quiz { id: string; title: string; topic: "chess" | "cube"; level: string; questions: QuizQuestion[] }

export const QUIZZES: Quiz[] = [
  { id: "chess-rules", title: "Chess Rules & Fundamentals", topic: "chess", level: "Beginner", questions: [
    { q: "Which corner square should be light when you set up the board?", options: ["Left-hand corner nearest you", "Right-hand corner nearest you", "It doesn't matter", "Both near corners"], answer: 1, explain: "'Light on the right': h1 for White is a light square." },
    { q: "What is the standard value of a rook?", options: ["3", "4", "5", "9"], answer: 2, explain: "Pawn 1, knight 3, bishop 3, rook 5, queen 9." },
    { q: "Which of these makes castling illegal?", options: ["The rook is attacked", "The king is in check", "You castled in a previous game", "Your queen has moved"], answer: 1, explain: "You may not castle out of, through, or into check. An attacked rook does not matter." },
    { q: "En passant must be played…", options: ["Any time later", "Only on the very next move", "Only by a knight", "Only on the 7th rank"], answer: 1, explain: "The right to capture en passant expires if not used immediately." },
    { q: "The side to move has no legal moves and is not in check. The result is…", options: ["Checkmate", "Stalemate (draw)", "A loss on time", "The player passes"], answer: 1, explain: "No legal moves without being in check is stalemate — a draw." },
    { q: "White to move. Find the checkmate.", fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", correctSan: "Rd8#", options: ["Rd7", "Rd8#", "f4", "Kf1"], answer: 1, explain: "A classic back-rank mate: the black king is boxed in by its own pawns." },
    { q: "White to move. Which move mates?", fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", correctSan: "Qxf7#", options: ["Qxe5+", "Bxf7+", "Qxf7#", "Nf3"], answer: 2, explain: "Scholar's mate: f7 is defended only by the king, and the bishop supports the queen." },
  ] },
  { id: "chess-openings", title: "Openings & Strategy", topic: "chess", level: "Intermediate", questions: [
    { q: "1.e4 e5 2.Nf3 Nc6 3.Bb5 is called…", options: ["Italian Game", "Ruy Lopez", "Scotch Game", "Petrov Defence"], answer: 1, explain: "3.Bb5 defines the Ruy Lopez (Spanish Game)." },
    { q: "Which move defines the Najdorf Sicilian (after 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3)?", options: ["5...g6", "5...Nc6", "5...a6", "5...e6"], answer: 2, explain: "5...a6 is the Najdorf; 5...g6 is the Dragon." },
    { q: "1.d4 d5 2.c4 dxc4 is the…", options: ["Slav Defence", "Queen's Gambit Accepted", "Queen's Gambit Declined", "London System"], answer: 1, explain: "Black takes the c4-pawn: Queen's Gambit Accepted." },
    { q: "A pawn with no friendly pawns on adjacent files is…", options: ["Passed", "Backward", "Isolated", "Doubled"], answer: 2, explain: "That is an isolated pawn (e.g. an IQP on d4/d5)." },
    { q: "The minority attack (b4–b5) typically arises from which structure?", options: ["Carlsbad (QGD Exchange)", "Maroczy Bind", "Hedgehog", "Stonewall"], answer: 0, explain: "In the Carlsbad structure White uses two queenside pawns against three to create weaknesses." },
  ] },
  { id: "chess-endgames", title: "Endgame Essentials", topic: "chess", level: "Advanced", questions: [
    { q: "In the Lucena position, the winning technique is known as…", options: ["The Vancura", "Building a bridge", "Triangulation", "The Philidor defence"], answer: 1, explain: "The rook goes to the 4th rank to shield the king from checks." },
    { q: "In the Philidor position the defender's rook stays on…", options: ["The first rank at once", "Its third rank (the 6th from the attacker's side)", "The 7th rank", "The long diagonal"], answer: 1, explain: "Keep the attacking king out; drop to the first rank only after the pawn advances to the 6th." },
    { q: "Ke4 + Pe3 vs Ke6, White to move. With best play the result is…", fen: "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1", options: ["White wins", "Draw", "Black wins"], answer: 1, explain: "Black has the opposition. (Stockfish 19 evaluates 0.00.)" },
    { q: "The maximum number of moves needed to mate with K+R vs K (from any position) is about…", options: ["5", "16", "40", "75"], answer: 1, explain: "K+R vs K is a forced mate in at most 16 moves." },
  ] },
  { id: "cube-basics", title: "Cube Notation & Beginner Method", topic: "cube", level: "Beginner", questions: [
    { q: "What does R' mean?", options: ["Right face clockwise", "Right face counter-clockwise", "Right face 180°", "Rotate the whole cube"], answer: 1, explain: "A prime means counter-clockwise when looking at that face." },
    { q: "Which move turns the slice between L and R in the same direction as L?", options: ["E", "S", "M", "x"], answer: 2, explain: "M follows L; E follows D; S follows F." },
    { q: "How many times does R U R' U' have to be repeated to return a solved cube to solved?", options: ["4", "5", "6", "12"], answer: 2, explain: "The sexy move has order 6 (verified by our cube model)." },
    { q: "In the beginner method, which algorithm makes the yellow cross?", options: ["F R U R' U' F'", "R U R' U R U2 R'", "R' D' R D", "U R U' L' U R' U' L"], answer: 0, explain: "F R U R' U' F' turns dot → L → line → cross." },
    { q: "How many colors does a standard cube have and which is opposite white?", options: ["6, yellow", "6, blue", "6, red", "9, yellow"], answer: 0, explain: "In the standard (Western) scheme white is opposite yellow, green opposite blue, red opposite orange." },
  ] },
  { id: "cube-cfop", title: "CFOP & Speedcubing", topic: "cube", level: "Intermediate", questions: [
    { q: "How many OLL cases are there in full OLL?", options: ["21", "41", "57", "78"], answer: 2, explain: "57 OLL cases (plus the solved state)." },
    { q: "How many PLL cases are there?", options: ["13", "21", "42", "57"], answer: 1, explain: "21 PLLs." },
    { q: "Which algorithm solves the case set up by Sune's inverse (R U2 R' U' R U' R')?", alg: "R U R' U R U2 R'", algCheck: "solves-sune", options: ["R U R' U R U2 R'", "F R U R' U' F'", "R2 D' R U2 R' D R U2 R", "M2 U M2 U2 M2 U M2"], answer: 0, explain: "Sune solves the Sune case (OLL 27)." },
    { q: "WCA inspection time before a solve is…", options: ["8 seconds", "15 seconds", "30 seconds", "No limit"], answer: 1, explain: "15 s; going over 15 s is +2, over 17 s is DNF." },
    { q: "In ZZ, what is solved during the first step (EOLine)?", options: ["A 2×2×2 block", "All edges oriented + DF and DB edges", "The white cross", "The first block"], answer: 1, explain: "EOLine orients all 12 edges and places the DF/DB line." },
    { q: "Roux's last step is…", options: ["PLL", "LSE (last six edges)", "ZBLL", "CMLL"], answer: 1, explain: "Roux: first block, second block, CMLL, then LSE." },
    { q: "An average of 5 (ao5) is calculated by…", options: ["Mean of all 5", "Dropping best and worst, mean of the middle 3", "Median of 5", "Best of 5"], answer: 1, explain: "WCA averages remove the best and worst times." },
  ] },
];
