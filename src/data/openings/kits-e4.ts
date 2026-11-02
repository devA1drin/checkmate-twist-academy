// More 1.e4 kits. Same rules as kits.ts: every move string is SAN from the start and is
// checked by scripts/verify-openings.ts (legality with chess.js, ECO with lichess data, and a trap ending in # must be mate).
import type { OpeningKit } from "./kits";

export const E4_KITS: OpeningKit[] = [
  {
    slug: "two-knights", name: "Two Knights Defence", short: "Two Knights", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "C55–C59",
    summary: "Against the Italian bishop, Black plays 3...Nf6 and attacks e4 instead of copying with ...Bc5. If White grabs at f7 with Ng5, Black gives a pawn for fast, active pieces. If White plays the calm 4.d3, it becomes a slow fight like the Giuoco Pianissimo.",
    goodFor: "Black players who meet the Italian often and want active, counter-attacking play instead of a quiet copy of White's moves.",
    ideas: [
      "3...Nf6 hits e4 at once. White must defend it or counter-attack; the common answers are 4.d3, 4.Ng5 and 4.d4.",
      "After 4.Ng5 d5 5.exd5, play 5...Na5. It chases the c4 bishop and gives a pawn for a big lead in development. 5...Nxd5 walks into the Fried Liver.",
      "In the 4.d3 lines, Black plays ...Be7, ...d6 and ...O-O, and later frees the game with ...d5 or ...Na5 to trade White's good bishop.",
      "Against 4.d4, take on d4 and hit back in the centre with ...Nxe4 or ...Bc5. Black's pieces come out quickly.",
    ],
    plans: [
      { side: "White", points: ["Quiet route: d3, c3, Re1, Nbd2–f1–g3, then a4 and Bb3 or Ba2.", "Sharp route: Ng5 to win the f7 or d5 pawn, then hold on to the extra pawn.", "Use the e-file and the pin on e4/e5 in the open lines after 4.d4."] },
      { side: "Black", points: ["After 4.Ng5, give the pawn and play ...h6, ...e4 and ...Bd6 with fast development.", "After 4.d3, castle and play ...d5 or ...Na5 at the right moment.", "Do not leave f7 weak while your king is still in the centre."] },
    ],
    structures: [
      { name: "Quiet 4.d3 centre", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3", text: "Closed centre with pawns on d3/e4 and d6/e5. A slow game: the plans are knight manoeuvres and the timing of d4 or ...d5." },
      { name: "4.Ng5 pawn sacrifice", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5", text: "White is a pawn up, but Black's pieces are faster and the e4 pawn cramps White. Black plays ...Bd6, ...O-O and ...Qc7." },
    ],
    lines: [
      { id: "tk-d3", name: "Modern 4.d3", eco: "C55", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3 Na5 Bb5 a6 Ba4 b5 Bc2 c5", note: "The most common line in top play. Black gains queenside space and keeps everything protected." },
      { id: "tk-ng5", name: "Knight Attack 4.Ng5, 5...Na5", eco: "C59", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5 Bd6 d4 exd3 Nxd3 Qc7", note: "The main gambit line. Black is a pawn down but develops quickly and attacks." },
      { id: "tk-d4", name: "Modern 4.d4, ...Nxe4", eco: "C56", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 d4 exd4 O-O Nxe4 Re1 d5 Bxd5 Qxd5 Nc3 Qa5 Nxe4 Be6", note: "White opens the centre while Black's king is still on e8. Black returns material to finish development." },
      { id: "tk-traxler", name: "Traxler Counterattack (4...Bc5)", eco: "C57", kind: "side", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 Bc5 Bxf7+ Ke7 Bd5 Rf8", note: "A wild gamble: Black ignores f7 and attacks f2. Only for players who have studied it." },
      { id: "tk-ulvestad", name: "Ulvestad (5...b5)", eco: "C57", kind: "side", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 b5", note: "A rare try to deflect the c4 bishop. Worth knowing as a surprise." },
    ],
    traps: [
      { name: "Fried Liver Attack", kind: "mistake", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3", text: "5...Nxd5? lets White sacrifice on f7 and drag the king to e6. Black's king is in danger for many moves. Play 5...Na5 instead." },
    ],
  },
  {
    slug: "evans-gambit", name: "Evans Gambit", short: "Evans", family: "1.e4", side: "white", level: "Intermediate", ecoRange: "C51–C52",
    summary: "In the Italian Game after 3...Bc5, White plays 4.b4 and offers a pawn. If Black takes, White gains time with c3 and d4 and builds a big centre. It was the favourite attack of the 19th century and Kasparov used it to beat Anand.",
    goodFor: "Attacking players with White who want quick open lines and are happy to be a pawn down for activity.",
    ideas: [
      "4.b4 deflects the c5 bishop. After 4...Bxb4 5.c3 the bishop must move again, so White wins time for d4.",
      "White's main pieces aim at f7 and the black king: Bc4, Qb3, Ba3 to stop castling, Re1 on the open e-file.",
      "Black should give back the pawn at the right moment to finish development. Greed (taking more pawns) is dangerous.",
    ],
    plans: [
      { side: "White", points: ["Play c3 and d4 fast, castle, and open the centre.", "Use Qb3 and Ba3 to hit f7 and stop Black castling.", "If Black's king stays in the centre, open the e-file with e5 or Re1."] },
      { side: "Black", points: ["Accept with 4...Bxb4 and retreat to a5 or e7.", "Return the pawn with ...d6 or ...d5 to free the pieces.", "Castle early; do not take a third pawn with ...dxc3."] },
    ],
    structures: [
      { name: "Open centre after the gambit", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nge7 cxd4 d5 exd5 Nxd5", text: "The centre is open and both sides have pieces out. White's compensation is activity: Ba3, Qb3 and the e-file." },
    ],
    lines: [
      { id: "ev-ba5-d6", name: "Accepted, 5...Ba5 6...d6", eco: "C52", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 d6 Qb3 Qd7 dxe5 Bb6", note: "A solid defence: Black keeps e5 under control and gives back the pawn." },
      { id: "ev-ba5-exd4", name: "Accepted, 6...exd4 7.O-O", eco: "C52", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O Nge7 cxd4 d5 exd5 Nxd5", note: "Black takes the centre pawn and hits back with ...d5. Very open play." },
      { id: "ev-be7", name: "Accepted, 5...Be7", eco: "C51", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Be7 d4 Na5 Be2 exd4 Qxd4 Nf6 e5 Nc6 Qh4 Nd5", note: "A modern defence that trades White's c4 bishop. White's queen goes to the kingside." },
      { id: "ev-bc5", name: "Accepted, 5...Bc5", eco: "C51", kind: "side", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Bc5 d4 exd4 O-O d6 cxd4 Bb6 Nc3", note: "The bishop goes back to c5 and then b6. White has a strong centre for the pawn." },
      { id: "ev-declined", name: "Declined, 4...Bb6", eco: "C51", kind: "side", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bb6 a4 a6 Nc3 Nf6 Nd5 Nxd5 exd5 Nd4", note: "Black refuses the pawn. White has gained some queenside space." },
    ],
    traps: [
      { name: "Taking a third pawn", kind: "mistake", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O dxc3 Qb3 Qf6 e5 Qg6 Nxc3", text: "7...dxc3? grabs more material but opens lines for White. With Qb3 hitting f7, e5 and fast development, White's attack is very strong." },
    ],
  },
  {
    slug: "vienna", name: "Vienna Game", short: "Vienna", family: "1.e4", side: "white", level: "Beginner", ecoRange: "C25–C29",
    summary: "2.Nc3 develops a knight and keeps the f-pawn free for f4, like a King's Gambit with better preparation. White can choose an aggressive gambit or a calm fianchetto with g3.",
    goodFor: "Players who like the King's Gambit idea but want a safer version, and beginners who want simple development.",
    ideas: [
      "2.Nc3 protects e4 and prepares f4 to attack Black's e5 pawn.",
      "In the Vienna Gambit (3.f4) White opens the f-file for the rook and gains space with e5.",
      "With g3 and Bg2 White plays a quiet game where the bishop presses on d5 and b7.",
    ],
    plans: [
      { side: "White", points: ["Push f4 and, after fxe5, use the f-file.", "Gain space with e5 and play d4.", "In the g3 line: Bg2, Nge2, O-O and later f4."] },
      { side: "Black", points: ["Answer f4 with ...d5, striking in the centre.", "Develop with ...Nf6, ...Bc5 or ...Bb4 and castle quickly.", "Against g3, take on d5 and trade knights to free the game."] },
    ],
    structures: [
      { name: "Vienna Gambit centre", moves: "e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4 O-O Bd3 f5", text: "White has a pawn on e5 and space; Black has a strong knight on e4 supported by ...f5. The fight is about that knight." },
      { name: "Fianchetto (3.g3)", moves: "e4 e5 Nc3 Nf6 g3 d5 exd5 Nxd5 Bg2 Nxc3 bxc3 Bd6 Nf3 O-O O-O", text: "Quiet and positional. White's g2 bishop presses on the long diagonal; the c3/d3 pawns give a flexible centre." },
    ],
    lines: [
      { id: "vi-gambit", name: "Vienna Gambit 3.f4 d5", eco: "C29", kind: "main", moves: "e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 Nf3 Be7 d4 O-O Bd3 f5", note: "The main line. Black's knight on e4 is strong; White hopes to remove it with Nxe4 or Bxe4." },
      { id: "vi-g3", name: "Mieses (3.g3)", eco: "C26", kind: "main", moves: "e4 e5 Nc3 Nf6 g3 d5 exd5 Nxd5 Bg2 Nxc3 bxc3 Bd6 Nf3 O-O O-O", note: "A positional way to play the Vienna. Good if you do not want gambits." },
      { id: "vi-nc6", name: "2...Nc6 3.Bc4", eco: "C24", kind: "side", moves: "e4 e5 Nc3 Nc6 Bc4 Nf6 d3 Na5 Nge2 Nxc4 dxc4 Bc5 O-O d6", note: "Black trades White's good bishop. White has a solid position and plans f4." },
      { id: "vi-bc5", name: "2...Bc5", eco: "C25", kind: "side", moves: "e4 e5 Nc3 Bc5 Nf3 d6 d4 exd4 Nxd4 Nf6 Be2 O-O O-O Re8", note: "Black develops the bishop first. White takes space in the centre." },
      { id: "vi-frankenstein", name: "Frankenstein-Dracula (3.Bc4 Nxe4)", eco: "C27", kind: "side", moves: "e4 e5 Nc3 Nf6 Bc4 Nxe4 Qh5 Nd6 Bb3 Nc6 Nb5 g6 Qf3 f5 Qd5 Qe7 Nxc7+ Kd8 Nxa8 b6", note: "One of the craziest lines in chess. White wins the a8 rook, but the knight is trapped there and Black gets play." },
    ],
    traps: [
      { name: "Würzburger Trap", kind: "trap", moves: "e4 e5 Nc3 Nf6 f4 d5 fxe5 Nxe4 d3 Qh4+ g3 Nxg3 Nf3 Qh5 Nxd5", text: "Black's ...Qh4+ and ...Nxg3 look crushing, but after 7.Nf3 Qh5 8.Nxd5 White threatens Nxc7+ and the g3 knight is still hanging. White comes out ahead." },
    ],
  },
  {
    slug: "kings-gambit", name: "King's Gambit", short: "King's Gambit", family: "1.e4", side: "white", level: "Advanced", ecoRange: "C30–C39",
    summary: "2.f4 offers a pawn to open the f-file and take the centre with d4. It is the most romantic opening in chess: risky, sharp, and full of famous attacking games. Modern defences are good for Black, so White needs to know the ideas well.",
    goodFor: "Bold players who want sharp positions and like to attack, mostly in faster games.",
    ideas: [
      "After 2...exf4, White wants d4 and Bxf4 to get the pawn back with a big centre.",
      "Black often holds the f4 pawn with ...g5, which weakens Black's kingside. White attacks it with h4.",
      "Black's best antidote is often to give the pawn back with ...d5 and develop fast.",
      "White's own king is a little weak after f4: watch the e1–h4 diagonal (...Qh4+).",
    ],
    plans: [
      { side: "White", points: ["Play Nf3 (to stop ...Qh4+), d4 and Bxf4.", "Use the f-file after castling.", "Against ...g5, break with h4 to open lines."] },
      { side: "Black", points: ["Give the pawn back with ...d5 and develop.", "Or hold it with ...g5 and ...Bg7, but watch the h-file.", "Against declining lines, ...Bc5 stops White castling short."] },
    ],
    structures: [
      { name: "Kieseritzky: ...g5 chain broken by h4", moves: "e4 e5 f4 exf4 Nf3 g5 h4 g4 Ne5 Nf6 d4 d6 Nd3 Nxe4 Bxf4", text: "White has given a pawn; Black's kingside pawns are advanced and loose. Very sharp: both kings are exposed." },
      { name: "Falkbeer: Black's e4 wedge", moves: "e4 e5 f4 d5 exd5 e4 d3 Nf6 dxe4 Nxe4 Nf3 Bc5 Qe2", text: "Black gives a pawn to keep a pawn or piece on e4 and stop White developing smoothly." },
    ],
    lines: [
      { id: "kg-kieseritzky", name: "Accepted, Kieseritzky (4.h4 g4 5.Ne5)", eco: "C39", kind: "main", moves: "e4 e5 f4 exf4 Nf3 g5 h4 g4 Ne5 Nf6 d4 d6 Nd3 Nxe4 Bxf4", note: "The classical main line against ...g5. White breaks Black's pawn chain at once." },
      { id: "kg-fischer", name: "Accepted, Fischer Defence (3...d6)", eco: "C34", kind: "main", moves: "e4 e5 f4 exf4 Nf3 d6 d4 g5 h4 g4 Ng1", note: "Fischer's recommendation. ...d6 stops Ne5, and the odd-looking Ng1 is White's best answer." },
      { id: "kg-modern", name: "Accepted, Modern (3...d5)", eco: "C36", kind: "main", moves: "e4 e5 f4 exf4 Nf3 d5 exd5 Nf6 Bb5+ c6 dxc6 Nxc6 d4", note: "Black gives the pawn back and develops quickly. A practical, safe answer." },
      { id: "kg-bishops", name: "Bishop's Gambit (3.Bc4)", eco: "C33", kind: "side", moves: "e4 e5 f4 exf4 Bc4 Nf6 Nc3 c6 Bb3 d5 exd5 cxd5 d4", note: "White allows ...Qh4+ but gets fast development." },
      { id: "kg-falkbeer", name: "Falkbeer Countergambit", eco: "C32", kind: "side", moves: "e4 e5 f4 d5 exd5 e4 d3 Nf6 dxe4 Nxe4 Nf3 Bc5 Qe2", note: "Black declines with a counter-gambit in the centre." },
      { id: "kg-classical-declined", name: "Declined, 2...Bc5", eco: "C30", kind: "side", moves: "e4 e5 f4 Bc5 Nf3 d6 Nc3 Nf6 Bc4 Nc6 d3", note: "The bishop stops White castling short. Calm, healthy development for both." },
    ],
    traps: [
      { name: "Taking on e5 after 2...Bc5", kind: "trap", moves: "e4 e5 f4 Bc5 fxe5 Qh4+ g3 Qxe4+ Qe2 Qxh1", text: "3.fxe5?? Qh4+ is a disaster: after 4.g3 Qxe4+ the queen forks the king and the h1 rook. Against 2...Bc5, play 3.Nf3 first." },
    ],
  },
  {
    slug: "four-knights", name: "Four Knights Game", short: "Four Knights", family: "1.e4", side: "white", level: "Beginner", ecoRange: "C46–C49",
    summary: "Both sides develop their knights first: 1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6. It follows the classic opening rules and leads to solid, symmetrical positions. White can play the Spanish (4.Bb5) or Scotch (4.d4) version.",
    goodFor: "Beginners who want a sound opening with clear rules, and anyone who wants fewer forcing lines than the Ruy Lopez.",
    ideas: [
      "Knights before bishops: both sides keep options for the bishops.",
      "In the Spanish Four Knights, White pins or pressures the c6 knight with Bb5, then plays d3 and Bg5.",
      "In the Scotch Four Knights, 4.d4 opens the centre and Black usually plays ...Bb4 and ...d5.",
    ],
    plans: [
      { side: "White", points: ["Choose Bb5 for a slow game or d4 for an open one.", "Use the pin Bg5 against the f6 knight.", "Castle short and push d4 when ready."] },
      { side: "Black", points: ["Copy White's development carefully; avoid early ...Nxe4 tricks unless they work.", "In the Spanish line, the Rubinstein 4...Nd4 is a sharp, good choice.", "Free the game with ...d5."] },
    ],
    structures: [
      { name: "Spanish Four Knights symmetry", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4 O-O O-O d3 d6 Bg5", text: "A closed, symmetrical centre. White's Bg5 and Nd5 ideas give White a small, lasting initiative." },
      { name: "Scotch Four Knights with ...d5", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 d4 exd4 Nxd4 Bb4 Nxc6 bxc6 Bd3 d5 exd5 cxd5", text: "Black has a strong pawn on d5 but an isolated a-pawn and a hanging c-pawn. Both sides have open lines." },
    ],
    lines: [
      { id: "fk-spanish", name: "Spanish, Symmetrical", eco: "C49", kind: "main", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4 O-O O-O d3 d6 Bg5", note: "The classical main line. Both sides mirror each other; White moves first, which matters." },
      { id: "fk-rubinstein", name: "Spanish, Rubinstein (4...Nd4)", eco: "C48", kind: "main", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Nd4 Ba4 Bc5 Nxe5 O-O Nd3 Bb6", note: "Black's sharpest and best-scoring reply. Black gives the e5 pawn for active pieces." },
      { id: "fk-scotch", name: "Scotch Four Knights (4.d4)", eco: "C47", kind: "main", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 d4 exd4 Nxd4 Bb4 Nxc6 bxc6 Bd3 d5 exd5 cxd5 O-O O-O Bg5 c6", note: "Open centre. Black's ...d5 equalises; White plays for small pluses with Bg5 and Qf3." },
      { id: "fk-glek", name: "Glek System (4.g3)", eco: "C47", kind: "side", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 g3 Bc5 Bg2 d6 d3", note: "A quiet fianchetto plan: White later plays h3, Be3 and d4." },
      { id: "fk-halloween", name: "Halloween Gambit (4.Nxe5)", eco: "C47", kind: "side", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 Nxe5 Nxe5 d4 Ng6 e5 Ng8 Bc4", note: "White gives a whole knight to chase Black's knights with pawns. Unsound, but dangerous if Black does not know it." },
    ],
    traps: [
      { name: "Rubinstein: grabbing e5", kind: "mistake", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Nd4 Nxe5 Qe7 f4 Nxb5 Nxb5 d6 Nf3 Qxe4+ Kf2 Ng4+ Kg3 Qg6", text: "Against the Rubinstein, 5.Nxe5? Qe7 lets Black win the pawn back with a strong attack on White's king." },
      { name: "The fork trick (4.Bc4?)", kind: "mistake", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6 Bc4 Nxe4 Nxe4 d5", text: "After 4.Bc4, Black plays ...Nxe4 and ...d5: the pawn forks bishop and knight, and Black gets the piece back with a free game." },
    ],
  },
  {
    slug: "petrov", name: "Petrov's Defence", short: "Petrov", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "C42–C43",
    summary: "Black answers 2.Nf3 with 2...Nf6 and counter-attacks e4 instead of defending e5. It is one of the most solid defences to 1.e4, used by Kramnik, Caruana and many world-class players to make draws with Black, but it has its own sharp lines too.",
    goodFor: "Solid players with Black who want an equal, low-risk position against 1.e4.",
    ideas: [
      "2...Nf6 counter-attacks: if White takes on e5, Black must not take back on e4 at once (3...Nxe4? 4.Qe2!).",
      "First 3...d6, kick the knight, then 4...Nxe4. Black gets the pawn back with a symmetrical position.",
      "In the main lines, Black's knight on e4 is strong; White tries to undermine it with c4 or Nc3.",
    ],
    plans: [
      { side: "White", points: ["Play for a small lead in development with d4, Bd3, O-O, c4.", "5.Nc3 and long castling give a sharper game.", "Pressure the e4 knight and the e-file."] },
      { side: "Black", points: ["Keep the knight on e4 supported with ...d5 and ...Bd6 or ...Be7.", "Develop smoothly and castle.", "Remember: 3...d6 first, never 3...Nxe4."] },
    ],
    structures: [
      { name: "Classical Petrov (symmetrical d-pawns)", moves: "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Nc6 O-O Be7 c4 Nb4 Be2 O-O", text: "Symmetrical pawns on d4 and d5. White undermines the e4 knight with c4; Black supports it and develops." },
    ],
    lines: [
      { id: "pe-classical", name: "Classical (5.d4 d5 6.Bd3)", eco: "C42", kind: "main", moves: "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Nc6 O-O Be7 c4 Nb4 Be2 O-O", note: "The old main line. Black's knights are active; White pushes c4 to hit d5." },
      { id: "pe-nc3", name: "5.Nc3 (Nimzowitsch Attack)", eco: "C42", kind: "main", moves: "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 Nc3 Nxc3 dxc3 Be7 Be3 Nc6 Qd2 Be6 O-O-O", note: "White trades knights and castles long. Opposite-side castling gives a real fight." },
      { id: "pe-steinitz", name: "Steinitz (3.d4)", eco: "C43", kind: "main", moves: "e4 e5 Nf3 Nf6 d4 Nxe4 Bd3 d5 Nxe5 Nd7 Nxd7 Bxd7 O-O Bd6", note: "White opens the centre at once. Black keeps the e4 knight and develops." },
      { id: "pe-three-knights", name: "3.Nc3", eco: "C42", kind: "side", moves: "e4 e5 Nf3 Nf6 Nc3 Bb4 Nxe5 O-O Be2 Re8 Nd3 Bxc3 dxc3 Nxe4", note: "Black does not need to transpose to the Four Knights; ...Bb4 is a good independent answer." },
      { id: "pe-cochrane", name: "Cochrane Gambit (4.Nxf7)", eco: "C42", kind: "side", moves: "e4 e5 Nf3 Nf6 Nxe5 d6 Nxf7 Kxf7 d4", note: "White gives a knight for two pawns and Black's king. Not sound, but tricky." },
    ],
    traps: [
      { name: "Copying with 3...Nxe4?", kind: "mistake", moves: "e4 e5 Nf3 Nf6 Nxe5 Nxe4 Qe2 Nf6 Nc6+", text: "After 3...Nxe4? 4.Qe2, the natural 4...Nf6?? loses the queen to 5.Nc6+, a discovered check. Play 3...d6 first." },
      { name: "Marshall Trap", kind: "trap", moves: "e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Bd6 O-O O-O c4 Bg4 cxd5 f5 Re1 Bxh2+", text: "10.Re1? walks into ...Bxh2+! The bishop sacrifice opens White's king, and Black's attack wins material." },
    ],
  },
  {
    slug: "philidor", name: "Philidor Defence", short: "Philidor", family: "1.e4", side: "black", level: "Beginner", ecoRange: "C41",
    summary: "Black defends e5 with 2...d6. The modern way is the Lion/Hanham setup: ...Nf6, ...Nbd7, ...Be7 and ...c6, keeping a solid pawn on e5. Black gets less space but a position that is hard to break.",
    goodFor: "Players who want a solid, easy-to-learn system with Black and do not mind a little less space.",
    ideas: [
      "...d6 keeps the e5 pawn, so Black's position in the centre stays solid.",
      "In the Hanham setup, Black never lets White trade on e5 for free: ...Nbd7 and ...c6 support the centre.",
      "Black's dark-squared bishop is passive on e7. Black waits for ...b5, ...exd4 or ...d5 to free the game.",
    ],
    plans: [
      { side: "White", points: ["Take space with d4, Nc3, Bc4 and O-O.", "Pressure f7 with Bc4 and Ng5 ideas.", "Use the extra space for a4 and a slow kingside build-up."] },
      { side: "Black", points: ["Build ...Nf6, ...Nbd7, ...Be7, ...O-O, ...c6.", "Gain space with ...b5 or ...a5.", "Free the game with ...exd4 and ...Re8, or with ...d5."] },
    ],
    structures: [
      { name: "Hanham (Lion) setup", moves: "e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7 Bc4 Be7 O-O O-O Re1 c6 a4", text: "Black holds e5 with pieces and pawns. White has more space; Black waits for the right moment for ...b5 or ...exd4." },
    ],
    lines: [
      { id: "ph-hanham", name: "Hanham / Lion setup", eco: "C41", kind: "main", moves: "e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7 Bc4 Be7 O-O O-O Re1 c6 a4", note: "The main modern line. Black's position is cramped but solid." },
      { id: "ph-exchange", name: "Exchange (3...exd4)", eco: "C41", kind: "main", moves: "e4 e5 Nf3 d6 d4 exd4 Nxd4 Nf6 Nc3 Be7 Be2 O-O O-O Re8 f4 Bf8", note: "Black gives up the centre but gets free development and pressure on e4." },
      { id: "ph-dxe5", name: "4.dxe5 Nxe4", eco: "C41", kind: "side", moves: "e4 e5 Nf3 d6 d4 Nf6 dxe5 Nxe4 Qd5 Nc5 Bg5 Qd7 exd6 Bxd6", note: "A dangerous try for White. Black must know these moves to keep the balance." },
      { id: "ph-countergambit", name: "Philidor Countergambit (3...f5)", eco: "C41", kind: "side", moves: "e4 e5 Nf3 d6 d4 f5 dxe5 fxe4 Ng5 d5 e6", note: "A risky counter-gambit. White's e6 pawn is a thorn in Black's position." },
    ],
    traps: [
      { name: "Légal's Mate", kind: "mistake", moves: "e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#", text: "White leaves the queen en prise. If Black takes it with 5...Bxd1??, the bishop and knights deliver mate. After 5.Nxe5, Black should play 5...dxe5 and accept being a pawn down." },
      { name: "Hanham move-order trap", kind: "mistake", moves: "e4 e5 Nf3 d6 d4 Nd7 Bc4 Ngf6 dxe5 Nxe5 Nxe5 dxe5 Bxf7+ Kxf7 Qxd8", text: "With the bishop on c4, Black must not recapture on e5 with the knight: the d-file opens and Bxf7+ wins the queen. Use the ...Nf6 first move order." },
    ],
  },
  {
    slug: "sicilian-dragon", name: "Sicilian Dragon", short: "Dragon", family: "1.e4", side: "black", level: "Advanced", ecoRange: "B70–B79, B34–B39",
    summary: "Black fianchettoes the bishop on g7, where it bites along the long diagonal. Against the Yugoslav Attack, both sides castle on opposite sides and race to mate. The kit also covers the Accelerated Dragon, which avoids the Yugoslav.",
    goodFor: "Sharp, ambitious players who enjoy attacking races and are willing to learn concrete lines.",
    ideas: [
      "The g7 bishop is Black's best piece: it hits d4, c3 and b2. Trading it with Bh6 is White's main idea.",
      "Black attacks on the queenside: ...Rc8, ...Ne5–c4, ...b5 and the exchange sacrifice ...Rxc3.",
      "In the Accelerated Dragon, Black plays ...g6 before ...d6 to save a tempo and to play ...d5 in one move.",
    ],
    plans: [
      { side: "White", points: ["Yugoslav: Be3, f3, Qd2, O-O-O, then h4–h5 and Bh6.", "Classical: Be2, O-O, and slow pressure on d5.", "Against the Accelerated Dragon, the Maroczy Bind (c4) restricts Black."] },
      { side: "Black", points: ["Castle short and attack on the c-file.", "Look for ...Rxc3 to break White's king cover.", "Play ...d5 when possible to free the game."] },
    ],
    structures: [
      { name: "Yugoslav race", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O", text: "Opposite castling: White pushes h4–h5, Black uses the c-file and the g7 bishop. Speed matters more than material." },
      { name: "Maroczy Bind", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6 c4 Bg7 Be3 Nf6 Nc3 O-O Be2 d6 O-O Bd7", text: "White's pawns on c4 and e4 stop ...b5 and ...d5. Black plays slowly with ...a5, ...Nxd4 and ...Bc6." },
    ],
    lines: [
      { id: "dr-yugoslav-bc4", name: "Yugoslav Attack, 9.Bc4", eco: "B78", kind: "main", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Rc8 Bb3 Ne5", note: "The main battleground. Black's knight heads for c4 to trade White's best attacker." },
      { id: "dr-yugoslav-ooo", name: "Yugoslav Attack, 9.O-O-O d5", eco: "B76", kind: "main", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 O-O-O d5 exd5 Nxd5 Nxc6 bxc6 Bd4", note: "Black strikes in the centre at once and gives a pawn for open lines against White's king." },
      { id: "dr-classical", name: "Classical (6.Be2)", eco: "B74", kind: "side", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be2 Bg7 Be3 Nc6 O-O O-O Nb3 Be6 f4 Qc8", note: "A calmer line. Black has easy development." },
      { id: "dr-levenfish", name: "Levenfish (6.f4)", eco: "B71", kind: "side", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 f4 Nbd7", note: "White threatens e5 at once. ...Nbd7 controls e5." },
      { id: "dr-accelerated", name: "Accelerated Dragon, Maroczy Bind", eco: "B38", kind: "main", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6 c4 Bg7 Be3 Nf6 Nc3 O-O Be2 d6 O-O Bd7", note: "White's most ambitious answer to the Accelerated Dragon. Black must play patiently." },
    ],
    traps: [
      { name: "Magnus Smith Trap", kind: "trap", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 d6 Bc4 g6 Nxc6 bxc6 e5", text: "With White's bishop already on c4, ...g6 is a mistake: Nxc6 and e5 hit the f6 knight and open the bishop's diagonal to f7. Against Bc4 setups, play ...e6 or ...Qb6 first." },
    ],
  },
  {
    slug: "sveshnikov", name: "Sicilian Sveshnikov", short: "Sveshnikov", family: "1.e4", side: "black", level: "Advanced", ecoRange: "B32–B33",
    summary: "Black plays ...e5 early and accepts a hole on d5 and a backward d-pawn in return for activity, the bishop pair and kingside play. Carlsen used it in his 2018 world title match. The kit also covers the related Kalashnikov.",
    goodFor: "Dynamic players with Black who like concrete, forcing positions and are happy with structural weaknesses for activity.",
    ideas: [
      "...e5 kicks the d4 knight and gains time. In return d5 becomes a weak square.",
      "After Bg5, Bxf6 gxf6 Black gets doubled f-pawns but the bishop pair and a strong ...f5 break.",
      "The a3 knight is White's problem piece; it must come back via c2 or c4.",
    ],
    plans: [
      { side: "White", points: ["Put a knight on d5 and keep it there.", "Bring the a3 knight back via c2–e3 or c4.", "Play a4 to attack Black's b5 pawn."] },
      { side: "Black", points: ["Break with ...f5 to fight for d5.", "Use the two bishops and the open g-file.", "Keep the b5 pawn safe and use ...b4 to dislodge the c3 knight."] },
    ],
    structures: [
      { name: "Chelyabinsk: doubled f-pawns, hole on d5", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5", text: "Black's pawns look ugly, but ...f5 breaks open the centre and the bishops become strong." },
    ],
    lines: [
      { id: "sv-bxf6", name: "Main line 9.Bxf6 gxf6 10.Nd5 f5", eco: "B33", kind: "main", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5", note: "The main line. Sharp and well analysed: both sides need to know the ideas." },
      { id: "sv-nd5", name: "9.Nd5 Be7", eco: "B33", kind: "main", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Nd5 Be7 Bxf6 Bxf6 c3 O-O Nc2 Bg5", note: "A calmer line. Black keeps a healthy pawn structure; White holds d5." },
      { id: "sv-7nd5", name: "7.Nd5", eco: "B33", kind: "side", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Nd5 Nxd5 exd5 Nb8 c4 Be7", note: "White trades on d5 at once to get a space advantage. Black's knight re-routes via d7." },
      { id: "sv-kalashnikov", name: "Kalashnikov (4...e5)", eco: "B32", kind: "side", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 e5 Nb5 d6 c4 Be7 N1c3 a6 Na3 f5", note: "A relative of the Sveshnikov without ...Nf6. Black plays for ...f5 quickly." },
    ],
    traps: [
      { name: "6.Nf5? d5!", kind: "mistake", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Nf5 d5 exd5 Bxf5", text: "Retreating the knight to f5 lets Black strike with ...d5 and take the knight. Black gets a free, active game. The only good square is b5." },
    ],
  },
  {
    slug: "taimanov", name: "Sicilian Taimanov", short: "Taimanov", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "B44–B49",
    summary: "Black plays ...e6 and ...Nc6 with flexible development: ...Qc7, ...a6 and pieces chosen to fit White's setup. It is less theoretical than the Najdorf and rich in strategic ideas.",
    goodFor: "Players who want an active Sicilian with flexible plans rather than memorised forcing lines.",
    ideas: [
      "...Nc6 and ...e6 control d4 and d5; Black keeps the d-pawn on d7 or d6 as needed.",
      "...Qc7 and ...a6 stop White's knights from jumping into b5.",
      "Black often trades on d4 and puts the bishop on c5 or b4 to pressure White's centre.",
    ],
    plans: [
      { side: "White", points: ["English Attack: Be3, Qd2, O-O-O, f3, g4.", "Quiet: Be2, O-O, Kh1, f4.", "Use the d6 square if Black's d-pawn stays on d7."] },
      { side: "Black", points: ["Develop with ...Qc7, ...a6, ...Nf6 and ...Bb4 or ...Be7.", "Play ...b5 and ...Bb7 to hit e4.", "Free the game with ...d5 when possible."] },
    ],
    structures: [
      { name: "Taimanov with ...Qc7 and ...a6", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Qd2 Nf6 O-O-O Bb4 f3 Na5 Nb3", text: "Black's pieces are flexible; the d7 pawn can go to d5 in one move. White castles long and pushes the kingside pawns." },
    ],
    lines: [
      { id: "ta-english", name: "English Attack (6.Be3 a6 7.Qd2)", eco: "B48", kind: "main", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Qd2 Nf6 O-O-O Bb4 f3 Na5 Nb3", note: "The most dangerous line for Black. Black uses ...Bb4 and ...Na5–c4 to hit back on the queenside." },
      { id: "ta-be2", name: "6.Be2", eco: "B47", kind: "main", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be2 a6 O-O Nf6 Kh1 Nxd4 Qxd4 Bc5 Qd3 b5", note: "A positional line. Black trades knights and develops quickly." },
      { id: "ta-g3", name: "6.g3", eco: "B47", kind: "side", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 g3 a6 Bg2 Nf6 O-O Nxd4 Qxd4 Bc5 Bf4 d6 Qd2", note: "White's bishop on g2 supports e4 and watches the long diagonal." },
      { id: "ta-nb5", name: "5.Nb5 d6 6.c4", eco: "B44", kind: "side", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nb5 d6 c4 Nf6 N1c3 a6 Na3 Be7 Be2 O-O O-O b6", note: "White sets up a Maroczy-like bind. Black becomes a Hedgehog and waits for ...d5 or ...b5." },
    ],
    traps: [
      { name: "Early ...Nf6 lets Ndb5 in", kind: "mistake", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 Nf6 Ndb5 Qb8 Bf4 e5 Bg5 a6 Bxf6 gxf6 Na3", text: "Without ...a6, the knight jumps to b5 with gain of time. After Bf4 and Bg5, Black's queen is passive and the pawns are broken. Play ...a6 before ...Nf6." },
    ],
  },
  {
    slug: "kan", name: "Sicilian Kan", short: "Kan", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "B41–B43",
    summary: "Black plays 4...a6 and keeps every option open: the knights, the bishops and the d-pawn wait for White to commit. It often becomes a Hedgehog, with Black's pawns on a6, b6, d6 and e6.",
    goodFor: "Patient players who like flexible structures and counter-punching.",
    ideas: [
      "4...a6 stops Nb5 and Bb5 and prepares ...b5 and ...Bb7.",
      "Black delays ...Nc6 and ...Nf6 so White cannot pick the best setup against them.",
      "Against c4 (the Maroczy Bind), Black builds the Hedgehog and breaks later with ...b5 or ...d5.",
    ],
    plans: [
      { side: "White", points: ["Bd3, O-O, c4: take space and restrict Black.", "Nc3 and Be3 with a kingside attack.", "Against the Hedgehog, keep control of b5 and d5."] },
      { side: "Black", points: ["...Qc7, ...b5 and ...Bb7 to hit e4.", "In the Hedgehog: ...b6, ...d6, ...Be7, ...O-O and wait for ...b5 or ...d5.", "Use ...Bc5 to hit the d4 knight early."] },
    ],
    structures: [
      { name: "Hedgehog", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Bd3 Nf6 O-O Qc7 Qe2 d6 c4 g6 Nc3 Bg7", text: "Black's pawns on a6, d6 and e6 control the fourth rank. White has space; Black waits for a break." },
    ],
    lines: [
      { id: "ka-bd3", name: "5.Bd3 Bc5", eco: "B42", kind: "main", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Bd3 Bc5 Nb3 Ba7 Qe2 Nc6 Be3 d6", note: "Black puts the bishop on the strong a7–g1 diagonal at once." },
      { id: "ka-bd3-nf6", name: "5.Bd3 Nf6 with ...g6", eco: "B42", kind: "main", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Bd3 Nf6 O-O Qc7 Qe2 d6 c4 g6 Nc3 Bg7", note: "A Hedgehog with the bishop on g7, a modern way to handle the Maroczy." },
      { id: "ka-maroczy", name: "5.c4 (Maroczy)", eco: "B41", kind: "side", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 c4 Nf6 Nc3 Bb4 Bd3 Nc6 Nxc6 dxc6 e5 Qa5", note: "White builds the bind immediately; Black hits back with ...Bb4." },
      { id: "ka-nc3", name: "5.Nc3 Qc7", eco: "B43", kind: "side", moves: "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Nc3 Qc7 Bd3 Nc6 Be3 Nf6 O-O Ne5 h3 Bc5", note: "Black's knight comes to e5 to hit the d3 bishop." },
    ],
    traps: [],
  },
  {
    slug: "alapin", name: "Alapin Sicilian (2.c3)", short: "Alapin", family: "1.e4", side: "white", level: "Beginner", ecoRange: "B22",
    summary: "White answers 1...c5 with 2.c3 and prepares d4, so that after ...cxd4 White can take back with a pawn and keep a big centre. It avoids the huge Open Sicilian theory and leads to clear, healthy positions.",
    goodFor: "White players who want a sound, low-theory weapon against the Sicilian.",
    ideas: [
      "2.c3 prepares d4. If Black takes, cxd4 gives White two strong centre pawns.",
      "Black usually hits e4 at once with 2...Nf6 or 2...d5.",
      "Many lines give White an isolated d-pawn with active pieces: attack with Bd3, Qe2 and Ne5.",
    ],
    plans: [
      { side: "White", points: ["Get d4 in and keep the centre.", "Against 2...Nf6, gain space with e5 and Nf3, Bc4.", "With an isolated d-pawn, attack the kingside."] },
      { side: "Black", points: ["Hit e4 at once: 2...Nf6 or 2...d5.", "Blockade the isolated d-pawn on d5.", "Develop fast; c3 takes the c3 square from White's knight."] },
    ],
    structures: [
      { name: "Isolated d-pawn", moves: "e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 e6 Be2 Nc6 O-O cxd4 cxd4", text: "White has an isolated d-pawn but free pieces. White attacks; Black blockades d5 and trades pieces." },
    ],
    lines: [
      { id: "ap-nf6", name: "2...Nf6", eco: "B22", kind: "main", moves: "e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5", note: "White gains space; Black attacks the e5 pawn with ...d6." },
      { id: "ap-d5", name: "2...d5", eco: "B22", kind: "main", moves: "e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 e6 Be2 Nc6 O-O cxd4 cxd4", note: "Black's queen can come out early because White's knight cannot go to c3." },
      { id: "ap-e6", name: "2...e6", eco: "C02", kind: "side", moves: "e4 c5 c3 e6 d4 d5 e5 Nc6 Nf3 Qb6 a3", note: "This transposes to a French Advance (C02). White plays a3 and b4 to gain queenside space." },
      { id: "ap-d6", name: "2...d6", eco: "B22", kind: "side", moves: "e4 c5 c3 d6 d4 Nf6 Bd3 Nc6 Nf3 cxd4 cxd4 Bg4", note: "Black allows White a full centre and pressures d4." },
    ],
    traps: [],
  },
  {
    slug: "smith-morra", name: "Smith-Morra Gambit", short: "Smith-Morra", family: "1.e4", side: "white", level: "Intermediate", ecoRange: "B21",
    summary: "White gives a pawn with 2.d4 cxd4 3.c3 for fast development and open c- and d-files. It is a popular club weapon: Black must defend accurately, and many natural moves lose quickly.",
    goodFor: "Attacking White players who want to avoid main-line Sicilian theory and get the initiative.",
    ideas: [
      "After 3...dxc3 4.Nxc3, White has a lead in development and pressure on d6 and f7.",
      "White's rooks come to c1 and d1 quickly; the queen goes to e2.",
      "Black's best plan is solid development (...e6, ...Nf6, ...Be7, ...d6) and waiting before ...b5 or ...d5.",
    ],
    plans: [
      { side: "White", points: ["Develop with Nf3, Bc4, O-O, Qe2, Rd1.", "Push e5 to open lines when Black's king is still in the centre.", "Use Nb5 and Nd5 jumps."] },
      { side: "Black", points: ["Accept the pawn and develop calmly.", "Do not open the centre early; castle first.", "Decline with 3...Nf6 or 3...d3 if you prefer to avoid theory."] },
    ],
    structures: [
      { name: "Accepted: White's open files", moves: "e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 e6 O-O Nf6 Qe2 Be7 Rd1", text: "White has an e4 pawn against Black's d6/e6. The rooks on c1 and d1 put pressure on Black's centre." },
    ],
    lines: [
      { id: "sm-classical", name: "Accepted, Classical", eco: "B21", kind: "main", moves: "e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 e6 O-O Nf6 Qe2 Be7 Rd1 e5 h3 O-O Be3", note: "The main line. Black gets a solid position and keeps the pawn; White has activity." },
      { id: "sm-chicago", name: "Accepted, ...a6 and ...Bg4", eco: "B21", kind: "main", moves: "e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 a6 O-O Nf6 Qe2 Bg4", note: "Black pins the f3 knight before playing ...e6." },
      { id: "sm-nf6", name: "Declined, 3...Nf6", eco: "B22", kind: "side", moves: "e4 c5 d4 cxd4 c3 Nf6 e5 Nd5 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5", note: "Black declines and transposes to an Alapin." },
      { id: "sm-d3", name: "Declined, 3...d3", eco: "B21", kind: "side", moves: "e4 c5 d4 cxd4 c3 d3 Bxd3 Nc6 Nf3 g6 c4 Bg7", note: "Black returns the pawn at once to keep White's knight off c3." },
    ],
    traps: [
      { name: "Siberian Trap", kind: "trap", moves: "e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 Qc7 Qe2 Nf6 O-O Ng4 h3 Nd4", text: "In the Siberian setup, the natural 9.h3?? loses the queen: ...Nd4 hits e2 and threatens ...Qh2 mate at the same time. White should play 9.h3 only after dealing with ...Nd4; 9.Kh1 or 9.Nb5 are better." },
    ],
  },
  {
    slug: "closed-sicilian", name: "Closed Sicilian and Grand Prix", short: "Closed Sicilian", family: "1.e4", side: "white", level: "Intermediate", ecoRange: "B21, B23–B26",
    summary: "White plays 2.Nc3 and builds slowly with g3, Bg2, d3 and f4, or attacks quickly with f4 and Bc4 (the Grand Prix). There is little theory, and the kingside attack with f4–f5 is easy to learn.",
    goodFor: "White players who want a system against the Sicilian with a clear kingside plan.",
    ideas: [
      "White does not open the centre with d4; instead f4 and f5 attack Black's king.",
      "Black usually plays on the queenside with ...Rb8 and ...b5, or blocks the centre with ...e5.",
      "In the Grand Prix, Bc4 or Bb5 and f5 give White quick attacking chances.",
    ],
    plans: [
      { side: "White", points: ["Closed: g3, Bg2, d3, Be3, Qd2, f4, Nf3, O-O, then f5.", "Grand Prix: f4, Nf3, Bc4 or Bb5, O-O, Qe1–h4.", "Trade Black's g7 bishop with Be3–Qd2–Bh6."] },
      { side: "Black", points: ["Play ...Rb8 and ...b5–b4 on the queenside.", "Use the d4 square for a knight.", "Block the kingside with ...e5 or ...f5."] },
    ],
    structures: [
      { name: "Closed Sicilian", moves: "e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 Be3 e6 Qd2 Rb8 Nge2 Nd4 O-O", text: "A closed centre. White attacks on the kingside, Black on the queenside." },
    ],
    lines: [
      { id: "cs-main", name: "Closed, 6.Be3", eco: "B26", kind: "main", moves: "e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 Be3 e6 Qd2 Rb8 Nge2 Nd4 O-O", note: "White's queen and bishop aim to trade Black's g7 bishop with Bh6." },
      { id: "cs-f4", name: "Closed, 6.f4", eco: "B25", kind: "main", moves: "e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 f4 e6 Nf3 Nge7 O-O O-O", note: "White prepares f5 at once." },
      { id: "cs-grand-prix", name: "Grand Prix (2.Nc3 and 3.f4)", eco: "B23", kind: "main", moves: "e4 c5 Nc3 Nc6 f4 g6 Nf3 Bg7 Bc4 e6 f5 Nge7", note: "Fast attack: White sacrifices a pawn with f5 to open the f-file." },
      { id: "cs-2f4", name: "Grand Prix 2.f4 d5", eco: "B21", kind: "side", moves: "e4 c5 f4 d5 exd5 Nf6 Bb5+ Bd7 Bxd7+ Qxd7 c4 e6", note: "2.f4 at once allows ...d5, Black's best reply." },
    ],
    traps: [],
  },
  {
    slug: "pirc", name: "Pirc Defence", short: "Pirc", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "B07–B09",
    summary: "Black lets White build a big centre with pawns on e4 and d4, then attacks it with pieces and pawn breaks (...c5, ...e5). The g7 bishop is Black's key piece. It is a hypermodern, counter-attacking defence.",
    goodFor: "Players who like to counter-attack and are comfortable giving White space early.",
    ideas: [
      "Black develops ...d6, ...Nf6, ...g6, ...Bg7 and castles, then strikes with ...c5 or ...e5.",
      "White's sharpest tries are the Austrian Attack (f4) and the 150 Attack (Be3, Qd2).",
      "If White's centre advances too far, it becomes a target.",
    ],
    plans: [
      { side: "White", points: ["Austrian: f4, Nf3, Bd3, O-O, then e5 or f5.", "150 Attack: Be3, Qd2, Bh6, h4–h5.", "Classical: Nf3, Be2, O-O and quiet space."] },
      { side: "Black", points: ["Castle and break with ...c5 or ...e5.", "Against the 150 Attack, play ...c6 and ...b5 quickly.", "Use the g7 bishop against d4."] },
    ],
    structures: [
      { name: "Austrian Attack", moves: "e4 d6 d4 Nf6 Nc3 g6 f4 Bg7 Nf3 O-O Bd3 Na6 O-O c5 d5 Nc7", text: "White has a huge centre; Black undermines it with ...c5 and plays on the queenside." },
    ],
    lines: [
      { id: "pi-austrian", name: "Austrian Attack (4.f4)", eco: "B09", kind: "main", moves: "e4 d6 d4 Nf6 Nc3 g6 f4 Bg7 Nf3 O-O Bd3 Na6 O-O c5 d5 Nc7", note: "White's most aggressive system. Black must counter-attack quickly." },
      { id: "pi-classical", name: "Classical (4.Nf3 and Be2)", eco: "B08", kind: "main", moves: "e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O O-O c6 a4 Nbd7", note: "A solid system for White. Black prepares ...e5." },
      { id: "pi-150", name: "150 Attack (4.Be3)", eco: "B07", kind: "side", moves: "e4 d6 d4 Nf6 Nc3 g6 Be3 c6 Qd2 b5 f3 Nbd7", note: "White plans Bh6 and h4. Black hurries with ...b5." },
      { id: "pi-bg5", name: "Byrne (4.Bg5)", eco: "B07", kind: "side", moves: "e4 d6 d4 Nf6 Nc3 g6 Bg5 Bg7 Qd2 h6 Bh4 c6", note: "White pins and prepares long castling." },
    ],
    traps: [],
  },
  {
    slug: "modern-defence", name: "Modern Defence", short: "Modern", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "B06",
    summary: "Black plays 1...g6 and 2...Bg7 before deciding where the knights go. It is related to the Pirc but more flexible, and it can reach many other openings. Black gives White the centre and fights it later.",
    goodFor: "Creative players who like flexible positions and avoiding theory.",
    ideas: [
      "...g6 and ...Bg7 first: the bishop hits d4 before Black commits the knights.",
      "Black often delays ...Nf6 to avoid e5 attacks and plays ...a6 and ...b5 on the queenside.",
      "The plan ...c6 and ...d5 can transpose to a Caro-Kann-like position.",
    ],
    plans: [
      { side: "White", points: ["Take space with d4, Nc3 and Be3.", "Attack with Qd2, Bh6 and h4.", "Keep the centre stable before opening lines."] },
      { side: "Black", points: ["...d6, ...a6, ...b5 and ...Bb7 to hit e4.", "Break with ...c5 or ...e5.", "Keep the king flexible; sometimes it stays in the centre."] },
    ],
    structures: [
      { name: "Modern with ...a6 and ...b5", moves: "e4 g6 d4 Bg7 Nc3 d6 Be3 a6 Qd2 Nd7 f4 b5 Nf3 Bb7 Bd3 c5", text: "Black expands on the queenside and pressures e4 with the b7 bishop; White has a strong centre." },
    ],
    lines: [
      { id: "mo-a6", name: "...a6 and ...b5 system", eco: "B06", kind: "main", moves: "e4 g6 d4 Bg7 Nc3 d6 Be3 a6 Qd2 Nd7 f4 b5 Nf3 Bb7 Bd3 c5", note: "The main modern approach: Black counters on the queenside." },
      { id: "mo-c6", name: "...c6 system", eco: "B06", kind: "main", moves: "e4 g6 d4 Bg7 Nc3 c6 Bc4 d6 Qf3 e6 Nge2 b5 Bb3 a5", note: "Black blunts the c4 bishop with ...e6 and expands with ...b5." },
      { id: "mo-nf3", name: "3.Nf3", eco: "B06", kind: "side", moves: "e4 g6 d4 Bg7 Nf3 d6 Bc4 Nf6 Qe2 O-O O-O Bg4", note: "A classical setup for White. Black pins the knight." },
      { id: "mo-c4", name: "3.c4", eco: "A42", kind: "side", moves: "e4 g6 d4 Bg7 c4 d6 Nc3 Nc6 Be3 e5 d5 Nce7 g4", note: "White builds a big pawn centre; with c4 the position is filed as A42. Black can transpose to a King's Indian." },
    ],
    traps: [],
  },
  {
    slug: "alekhine", name: "Alekhine's Defence", short: "Alekhine", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "B02–B05",
    summary: "1...Nf6 invites White's pawns forward to chase the knight. Black hopes the advanced pawns become targets. It is provocative but sound, and was used by Alekhine and Fischer.",
    goodFor: "Players who like unusual positions and counter-attacking a big centre.",
    ideas: [
      "After 2.e5 Nd5, White can chase the knight with c4 and d4, but every pawn move weakens White.",
      "Black attacks the centre with ...d6 and pieces: ...Bg4, ...Nc6, ...e6.",
      "In the Modern line (4.Nf3), Black's pieces are calm and the play is positional.",
    ],
    plans: [
      { side: "White", points: ["Keep the e5 pawn and develop: Nf3, Be2, O-O, c4.", "Four Pawns: build a huge centre with c4, d4, e5, f4.", "Exchange: trade on d6 for a small space plus."] },
      { side: "Black", points: ["Undermine e5 with ...d6 and ...Nc6.", "Pin the f3 knight with ...Bg4.", "Against the Four Pawns, hit the centre at once with ...Bf5 and ...Nc6."] },
    ],
    structures: [
      { name: "Modern line, e5 pawn", moves: "e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2 e6 O-O Be7 c4 Nb6 h3 Bh5 Nc3 O-O Be3 d5", text: "White has space; Black has a solid French-like structure and pressure on d4." },
    ],
    lines: [
      { id: "al-modern-bg4", name: "Modern, 4...Bg4", eco: "B05", kind: "main", moves: "e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2 e6 O-O Be7 c4 Nb6 h3 Bh5 Nc3 O-O Be3 d5", note: "The classical main line. Black pins the knight and builds a solid wall." },
      { id: "al-modern-dxe5", name: "Modern, 4...dxe5", eco: "B04", kind: "main", moves: "e4 Nf6 e5 Nd5 d4 d6 Nf3 dxe5 Nxe5 c6 Be2 Bf5 O-O Nd7 Nf3 e6", note: "Black trades the e5 pawn and develops calmly. A popular modern choice." },
      { id: "al-four-pawns", name: "Four Pawns Attack", eco: "B03", kind: "side", moves: "e4 Nf6 e5 Nd5 d4 d6 c4 Nb6 f4 dxe5 fxe5 Nc6 Be3 Bf5 Nc3 e6 Nf3", note: "White grabs maximum space. Black attacks the centre with pieces." },
      { id: "al-exchange", name: "Exchange Variation", eco: "B03", kind: "side", moves: "e4 Nf6 e5 Nd5 d4 d6 c4 Nb6 exd6 cxd6 Nc3 g6 Be3 Bg7 Rc1 O-O b3", note: "White trades on d6 and keeps a little space." },
      { id: "al-nc3", name: "2.Nc3", eco: "B02", kind: "side", moves: "e4 Nf6 Nc3 d5 exd5 Nxd5 Bc4 Nb6 Bb3 Nc6", note: "White avoids the main lines. Black gets easy development." },
    ],
    traps: [],
  },
];
