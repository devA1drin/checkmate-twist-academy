// Opening kits. Every move string is plain SAN from the starting position and is
// checked by scripts/verify-openings.ts with chess.js. ECO codes are checked against
// the lichess-org/chess-openings data set (scripts/data/lichess-openings.tsv).
export type Level = "Beginner" | "Intermediate" | "Advanced";
export interface KitLine { id: string; name: string; eco: string; kind: "main" | "side"; moves: string; note: string }
export interface KitTrap { name: string; moves: string; text: string; kind: "trap" | "mistake" }
export interface KitStructure { name: string; moves: string; text: string }
export interface OpeningKit {
  slug: string;
  name: string;
  short: string;
  family: "1.e4" | "1.d4" | "1.c4";
  side: "white" | "black";
  level: Level;
  ecoRange: string;
  summary: string;
  goodFor: string;
  ideas: string[];
  plans: { side: "White" | "Black"; points: string[] }[];
  structures: KitStructure[];
  lines: KitLine[];
  traps: KitTrap[];
}

export const KITS: OpeningKit[] = [
  {
    slug: "italian", name: "Italian Game", short: "Italian", family: "1.e4", side: "white", level: "Beginner", ecoRange: "C50–C54",
    summary: "White develops the bishop to c4, where it looks at Black's weakest square, f7. Then White builds a centre with c3 and d4 (or the calm d3). It teaches the basic rules of the opening: develop, castle, fight for the centre.",
    goodFor: "First opening for White. Simple ideas, quick castling, and many games end in direct attacks.",
    ideas: [
      "The bishop on c4 points at f7, the square next to Black's king that only the king defends.",
      "c3 prepares d4. If White gets pawns on e4 and d4, Black's pieces have less space.",
      "The quiet plan (d3, Re1, Nbd2–f1–g3) is called Giuoco Pianissimo. It is slow but full of ideas, and top players use it.",
      "Castle early. The centre can open quickly in this opening, and a king in the middle gets attacked.",
    ],
    plans: [
      { side: "White", points: ["Play c3 and d4 at the right moment.", "Move the queen's knight d2–f1–g3 to join the kingside.", "Push a4 to win space on the queenside and give the bishop a retreat on a2."] },
      { side: "Black", points: ["Copy White: Bc5, Nf6, d6, castle.", "Break with ...d5 when White's centre is not ready.", "Keep the bishop on the a7–g1 diagonal, aimed at White's king."] },
    ],
    structures: [
      { name: "Giuoco Pianissimo (pawns on d3 and d6)", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O", text: "Both sides keep the centre closed. The game is about slow piece moves: Re1, Nbd2–f1–g3, and the timing of d4 or ...d5." },
      { name: "Open centre after c3 and d4", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5", text: "White has two centre pawns; Black hits them at once with ...d5. Piece activity matters more than pawn count here." },
    ],
    lines: [
      { id: "it-pianissimo", name: "Giuoco Pianissimo", eco: "C54", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 Nbd2", note: "The modern main line. White keeps everything protected and plans Nf1–g3." },
      { id: "it-classical-d4", name: "Giuoco Piano, centre attack", eco: "C54", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5 exd5 Nxd5 Qb3 Nce7 O-O O-O", note: "White builds the big centre at once. Black must hit back with ...d5." },
      { id: "it-two-knights-d3", name: "Two Knights, quiet d3", eco: "C55", kind: "main", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3", note: "Against 3...Nf6, the calm d3 avoids long forcing lines." },
      { id: "it-two-knights-ng5", name: "Two Knights, Knight attack (4.Ng5)", eco: "C59", kind: "side", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5", note: "White grabs a pawn; Black gets fast development for it. Do not play 5...Nxd5 here (see Fried Liver)." },
      { id: "it-evans", name: "Evans Gambit", eco: "C52", kind: "side", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O", note: "White gives a pawn to win time for the centre. Played by Kasparov; great fun in fast games." },
    ],
    traps: [
      { name: "Fried Liver Attack", kind: "trap", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3", text: "After 5...Nxd5? White sacrifices on f7 and Black's king is pulled into the centre. Black should play 5...Na5 instead." },
      { name: "Blackburne Shilling trap", kind: "trap", moves: "e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#", text: "3...Nd4 looks like a mistake, but taking on e5 is the real mistake. Simply play 4.Nxd4 or 4.O-O." },
    ],
  },
  {
    slug: "ruy-lopez", name: "Ruy Lopez (Spanish Game)", short: "Ruy Lopez", family: "1.e4", side: "white", level: "Intermediate", ecoRange: "C60–C99",
    summary: "White puts the bishop on b5 to put pressure on the knight that defends e5. It is one of the oldest and deepest openings, and a favourite of world champions from Steinitz to Carlsen.",
    goodFor: "Players who like long plans and lasting pressure rather than quick attacks.",
    ideas: [
      "Bb5 attacks the defender of e5. White is not threatening Bxc6 and Nxe5 at once (because ...Qd4 wins back the pawn), but the pressure stays.",
      "After ...a6 Ba4 ...b5 Bb3, the bishop moves to a great diagonal aiming at f7.",
      "White plays c3 and d4 to build a strong centre, and h3 to stop ...Bg4.",
      "The knight often travels b1–d2–f1–g3 to help on the kingside.",
    ],
    plans: [
      { side: "White", points: ["Build c3 + d4 and keep the e4 pawn.", "Move the knight to g3 or e3, then attack on the kingside with Nf5 or f4.", "Against ...b5 play a4 to open the a-file."] },
      { side: "Black", points: ["Keep e5 solid with ...d6.", "Gain queenside space with ...b5, ...Na5 and ...c5.", "Look for the ...d5 break, or the Marshall Gambit with ...d5 early."] },
    ],
    structures: [
      { name: "Closed Spanish (Chigorin-type)", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7", text: "Black has space on the queenside, White in the centre. White usually plays Nbd2–f1–g3; Black looks for ...cxd4 and ...Nc6." },
      { name: "Berlin endgame", moves: "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8", text: "Queens are off early. White has a kingside pawn majority; Black has the two bishops and a very solid position." },
    ],
    lines: [
      { id: "rl-closed", name: "Closed Ruy Lopez", eco: "C92", kind: "main", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3", note: "The main road. Both sides finish development before the real fight starts." },
      { id: "rl-berlin", name: "Berlin Defence", eco: "C67", kind: "main", moves: "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8", note: "Kramnik used it to beat Kasparov in 2000. Black accepts a slightly worse endgame that is very hard to win." },
      { id: "rl-exchange", name: "Exchange Variation", eco: "C69", kind: "side", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6 d4", note: "White gives the bishop to damage Black's pawns. Fischer liked it. White hopes for a good endgame." },
      { id: "rl-open", name: "Open Ruy Lopez", eco: "C80", kind: "side", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4 b5 Bb3 d5 dxe5 Be6", note: "Black takes on e4 and plays actively in the centre." },
      { id: "rl-marshall", name: "Marshall Attack", eco: "C89", kind: "side", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5 exd5 Nxd5 Nxe5 Nxe5 Rxe5 c6", note: "Black gives a pawn for a fast attack on White's king. Many top players avoid it with 8.a4 or 8.h3." },
    ],
    traps: [
      { name: "Noah's Ark trap", kind: "trap", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 d6 d4 b5 Bb3 Nxd4 Nxd4 exd4 Qxd4 c5 Qd5 Be6 Qc6+ Bd7 Qd5 c4", text: "If White takes back on d4 with the queen, Black's pawns chase it and then trap the bishop on b3 with ...c4." },
      { name: "Taking on e5 too early", kind: "mistake", moves: "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Bxc6 dxc6 Nxe5 Qd4", text: "Bxc6 and Nxe5 does not win a pawn here: ...Qd4 attacks the knight and e4, and Black gets the pawn back." },
    ],
  },
  {
    slug: "scotch", name: "Scotch Game", short: "Scotch", family: "1.e4", side: "white", level: "Beginner", ecoRange: "C44–C45",
    summary: "White opens the centre at once with 3.d4. The position becomes open and clear, with fewer long theory lines than the Ruy Lopez. Kasparov brought it back to top level in 1990.",
    goodFor: "Players who want open positions and active pieces without learning huge amounts of theory.",
    ideas: [
      "3.d4 removes Black's e5 pawn. White gets more space and free lines for the pieces.",
      "White's knight on d4 is strong, so Black often trades it with ...Nxd4 or attacks it with ...Bc5 or ...Qh4.",
      "In the Mieses line, e5 kicks the f6 knight and White plays c4 to gain space.",
    ],
    plans: [
      { side: "White", points: ["Develop fast: Nc3, Be3 or Bd3, castle.", "Use the extra central space; put a rook on the e-file.", "Against ...Bc5, keep the d4 knight protected with Be3 and c3."] },
      { side: "Black", points: ["Attack the d4 knight right away.", "Free your game with ...d5 when possible.", "Watch the e-file: your king can get stuck in the centre."] },
    ],
    structures: [
      { name: "Mieses: Black's doubled c-pawns", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4", text: "Black has doubled pawns but a strong centre with ...d6 or ...Ba6. White has space and an easy plan." },
    ],
    lines: [
      { id: "sc-mieses", name: "Mieses Variation", eco: "C45", kind: "main", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4", note: "The sharpest main line. White's queen on e2 stops ...Qxe5." },
      { id: "sc-classical", name: "Classical (4...Bc5 5.Be3)", eco: "C45", kind: "main", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4", note: "Black puts pressure on d4. White defends with Be3 and c3." },
      { id: "sc-classical-nxc6", name: "Classical with 5.Nxc6", eco: "C45", kind: "side", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Nxc6 Qf6 Qd2 dxc6 Nc3", note: "White trades on c6 first. Black gets quick development." },
      { id: "sc-gambit", name: "Scotch Gambit", eco: "C56", kind: "side", moves: "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5 d5 Bb5 Ne4 Nxd4", note: "White develops first and takes the pawn back later. With ...Nf6 and Bc4 it reaches the Max Lange Attack, which is why the ECO code is an Italian one." },
      { id: "sc-steinitz", name: "Steinitz (4...Qh4)", eco: "C45", kind: "side", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Qh4 Nc3 Bb4 Be2", note: "Black attacks e4 at once. White gives a pawn back for fast development." },
    ],
    traps: [
      { name: "Scotch Gambit: 5...Nh6", kind: "trap", moves: "e4 e5 Nf3 Nc6 d4 exd4 Bc4 Bc5 Ng5 Nh6 Nxf7 Nxf7 Bxf7+ Kxf7 Qh5+ g6 Qxc5", text: "White gives knight and bishop for the f7 pawn and knight, then wins the c5 bishop with a queen check. Material ends equal, but Black's king has lost the right to castle." },
    ],
  },
  {
    slug: "sicilian", name: "Sicilian Defence: Najdorf, Dragon and Alapin", short: "Sicilian", family: "1.e4", side: "black", level: "Advanced", ecoRange: "B20–B99",
    summary: "1...c5 fights for d4 from the side. Black accepts an unbalanced game to play for a win. This kit covers the Najdorf (the main weapon of Fischer and Kasparov), an overview of the Dragon, and how to meet White's most popular anti-Sicilian, the Alapin (2.c3).",
    goodFor: "Ambitious players who want to win with Black and are ready to learn concrete lines.",
    ideas: [
      "After 2...d6 3.d4 cxd4, Black trades a side pawn for a centre pawn. Black gets a half-open c-file and two centre pawns.",
      "Najdorf 5...a6 stops Nb5 and Bb5 and prepares ...e5 or ...e6 and ...b5.",
      "Dragon ...g6 and ...Bg7: the bishop on the long diagonal is Black's best piece. Do not trade it lightly.",
      "Against 2.c3, Black hits e4 at once with 2...Nf6 or 2...d5.",
    ],
    plans: [
      { side: "White", points: ["Open Sicilian: castle long and push the kingside pawns (g4, h4).", "Use the d5 square: Nd5 can be very strong.", "Alapin: build d4 with c3 support and aim for an isolated d-pawn with active pieces."] },
      { side: "Black", points: ["Attack on the queenside: ...b5, ...Rc8, an exchange sacrifice on c3.", "Control d5. In the ...e5 Najdorf, ...Be6 and ...Nbd7 guard it.", "In the Dragon, use the c-file and the g7 bishop against White's king."] },
    ],
    structures: [
      { name: "Najdorf with ...e5 (hole on d5)", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6", text: "Black has a hole on d5 but a strong pawn on e5. The fight is about d5: if White keeps a knight there, Black suffers." },
      { name: "Dragon: opposite-side castling", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O", text: "A race. White plays h4–h5 to open the h-file; Black uses the c-file and the long diagonal." },
    ],
    lines: [
      { id: "si-najdorf-english", name: "Najdorf, English Attack", eco: "B90", kind: "main", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4", note: "White castles long and pushes g4–g5. Black answers with ...b5 and ...b4." },
      { id: "si-najdorf-bg5", name: "Najdorf, 6.Bg5", eco: "B99", kind: "main", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7 Qf3 Qc7 O-O-O Nbd7", note: "The classical attacking line. Very sharp: both kings face attacks." },
      { id: "si-najdorf-be2", name: "Najdorf, 6.Be2", eco: "B92", kind: "side", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3 Be7 O-O O-O Be3 Be6", note: "A calmer line. Good to learn first because the ideas (d5 square, ...Be6) are clear." },
      { id: "si-dragon-yugoslav", name: "Dragon, Yugoslav Attack", eco: "B78", kind: "main", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Rc8 Bb3 Ne5", note: "The main test of the Dragon. Opposite castling and a race to mate." },
      { id: "si-alapin-nf6", name: "Alapin, 2...Nf6", eco: "B22", kind: "main", moves: "e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5", note: "Black attacks e4 at once. White gains space with e5; Black hits the centre with ...d6." },
      { id: "si-alapin-d5", name: "Alapin, 2...d5", eco: "B22", kind: "side", moves: "e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 e6 Be2 Nc6 O-O cxd4 cxd4", note: "Black's queen comes out early because c3 takes away the Nc3 square." },
      { id: "si-moscow", name: "Moscow Variation (3.Bb5+)", eco: "B52", kind: "side", moves: "e4 c5 Nf3 d6 Bb5+ Bd7 Bxd7+ Qxd7 O-O Nc6 c3 Nf6", note: "White avoids the main lines and trades bishops." },
    ],
    traps: [
      { name: "Siberian trap (Smith-Morra Gambit)", kind: "trap", moves: "e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 Qc7 O-O Nf6 Qe2 Ng4 h3 Nd4 Nxd4 Qh2#", text: "If White plays h3 too early, ...Nd4 hits the queen and opens the way for ...Qh2 mate." },
      { name: "Grabbing on b2 in the Najdorf", kind: "mistake", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Qb6 Qd2 Qxb2 Rb1 Qa3", text: "The 'Poisoned Pawn'. It is playable for experts only. Black's queen can get trapped if you do not know the lines." },
    ],
  },
  {
    slug: "french", name: "French Defence", short: "French", family: "1.e4", side: "black", level: "Intermediate", ecoRange: "C00–C19",
    summary: "1...e6 and 2...d5. Black builds a solid pawn chain and attacks White's centre from the base with ...c5 and ...f6. It is a fighting defence with clear plans.",
    goodFor: "Patient players who like clear pawn-structure plans and counter-attacks.",
    ideas: [
      "Black's main problem is the light-squared bishop on c8, which is blocked by e6. Plan to trade it or bring it out with ...b6 and ...Ba6.",
      "Attack the pawn chain at its base: ...c5 hits d4.",
      "...f6 attacks the head of the chain (e5) and opens the f-file.",
      "When White plays e5, the game is about d4 (Black attacks it) and f7/h7 (White attacks Black's king).",
    ],
    plans: [
      { side: "White", points: ["Keep the d4–e5 chain alive with c3 and Nf3.", "Use the space on the kingside: Qg4, f4–f5.", "In the Winawer, use the bishop pair after ...Bxc3."] },
      { side: "Black", points: ["...c5, ...Nc6, ...Qb6 to pile up on d4.", "...f6 to break the chain.", "Find a good square for the c8 bishop."] },
    ],
    structures: [
      { name: "Advance chain (e5/d4 against e6/d5)", moves: "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6", text: "Black attacks d4 with pawn, knight and queen. White defends it and attacks on the kingside." },
      { name: "Winawer: doubled c-pawns", moves: "e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3", text: "White has the bishop pair and weak c-pawns. Black is solid but has dark-square holes around the king." },
    ],
    lines: [
      { id: "fr-advance", name: "Advance Variation", eco: "C02", kind: "main", moves: "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4", note: "Black closes the queenside with ...c4 and plans ...Na5–b3." },
      { id: "fr-winawer", name: "Winawer Variation", eco: "C18", kind: "main", moves: "e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4", note: "Very sharp. White attacks g7; Black attacks White's centre and queenside." },
      { id: "fr-steinitz", name: "Classical, Steinitz", eco: "C11", kind: "main", moves: "e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6 Be3", note: "White builds a big centre with f4. Black hits it with ...c5 and ...cxd4." },
      { id: "fr-tarrasch", name: "Tarrasch Variation", eco: "C09", kind: "side", moves: "e4 e6 d4 d5 Nd2 c5 exd5 exd5 Ngf3 Nc6 Bb5 Bd6", note: "Black accepts an isolated d-pawn for active pieces." },
      { id: "fr-exchange", name: "Exchange Variation", eco: "C01", kind: "side", moves: "e4 e6 d4 d5 exd5 exd5 Bd3 Nc6 c3 Bd6", note: "Symmetrical and calm. Black's c8 bishop is free now." },
      { id: "fr-rubinstein", name: "Rubinstein Variation", eco: "C10", kind: "side", moves: "e4 e6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Nf3 Ngf6", note: "Black gives up the centre for a very solid position." },
    ],
    traps: [
      { name: "Queen lost on d4", kind: "trap", moves: "e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 Bd3 cxd4 cxd4 Nxd4 Nxd4 Qxd4 Bb5+", text: "Black wins the d4 pawn twice, but Bb5+ is a discovered attack: after Black answers the check, White's queen takes Black's queen on d4." },
    ],
  },
  {
    slug: "caro-kann", name: "Caro-Kann Defence", short: "Caro-Kann", family: "1.e4", side: "black", level: "Beginner", ecoRange: "B10–B19",
    summary: "1...c6 and 2...d5. Like the French, Black challenges e4 with a pawn, but the light-squared bishop can come out to f5 or g4 before ...e6. Solid, easy to learn, and used by world champions.",
    goodFor: "Players who want a safe, solid answer to 1.e4 with clear plans.",
    ideas: [
      "...c6 supports ...d5. Black's pawn structure is very healthy.",
      "Develop the light-squared bishop (to f5 or g4) before playing ...e6.",
      "In the Advance line, attack White's centre with ...c5, often after ...e6.",
      "Black's pieces are a little passive at first, but the endgames are usually good for Black.",
    ],
    plans: [
      { side: "White", points: ["Gain space with e5 and attack on the kingside.", "In the Classical, chase the f5 bishop with Ng3 and h4–h5.", "In the Panov, play against the isolated d-pawn or use it to attack."] },
      { side: "Black", points: ["Bf5 or Bg4, then ...e6, ...Nd7, ...Ngf6.", "Break with ...c5 in the Advance.", "Castle and trade into a safe endgame if White over-extends."] },
    ],
    structures: [
      { name: "Advance: Black's bishop outside the chain", moves: "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5", text: "Like a French, but the bishop is already on f5. Black attacks d4 with ...c5 and ...Nc6." },
      { name: "Classical: the h-pawn pushes", moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7", text: "White gains space with h5; Black's position is compact. Black usually castles long or keeps the king in the centre." },
    ],
    lines: [
      { id: "ck-advance-short", name: "Advance, Short Variation", eco: "B12", kind: "main", moves: "e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3", note: "The modern quiet main line. White develops; Black plays ...Nd7, ...Ne7 and ...Nc6." },
      { id: "ck-advance-nc3", name: "Advance, 4.Nc3 and g4", eco: "B12", kind: "side", moves: "e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2 c5", note: "White chases the bishop with pawns. Black hits back in the centre with ...c5." },
      { id: "ck-classical", name: "Classical Variation", eco: "B19", kind: "main", moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3", note: "The old main line. Black is solid; White has a little more space." },
      { id: "ck-exchange", name: "Exchange Variation", eco: "B13", kind: "side", moves: "e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4", note: "Symmetrical pawns. Black develops the bishop first, then ...e6." },
      { id: "ck-panov", name: "Panov Attack", eco: "B14", kind: "side", moves: "e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7", note: "White plays with an isolated d-pawn. Black blockades on d5." },
      { id: "ck-two-knights", name: "Two Knights", eco: "B11", kind: "side", moves: "e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 e6", note: "White keeps the bishop pair; Black gets a solid centre." },
    ],
    traps: [
      { name: "Smothered mate on d6", kind: "trap", moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Qe2 Ngf6 Nd6#", text: "The e7 pawn is pinned by White's queen, so it cannot take the knight. Play ...e6 or ...Nb6 before ...Ngf6 when the queen is on e2." },
    ],
  },
  {
    slug: "queens-gambit", name: "Queen's Gambit: Declined and Accepted", short: "Queen's Gambit", family: "1.d4", side: "black", level: "Intermediate", ecoRange: "D06–D69",
    summary: "After 1.d4 d5 2.c4, Black can hold the centre with 2...e6 (Declined) or take the pawn and give it back later for free development (Accepted). Both are classical, sound and used at every level.",
    goodFor: "Players who want healthy positions against 1.d4 and want to learn classical strategy.",
    ideas: [
      "2.c4 is not a true gambit: if Black keeps the pawn with ...b5, White wins it back or gets a great position.",
      "QGD: Black holds d5 with ...e6, castles, then frees the game with ...c5 or ...e5.",
      "QGD's problem piece is the c8 bishop. ...b6 and ...Bb7 is one fix.",
      "QGA: Black gives up the centre for a moment, then hits it with ...c5 and ...e6.",
    ],
    plans: [
      { side: "White", points: ["In the Exchange QGD, play the minority attack: b4–b5 to make a weak c6 pawn.", "Or castle long and push the kingside pawns.", "In the QGA, use the isolated d-pawn (d4–d5 push, attack on the king)."] },
      { side: "Black", points: ["QGD: ...c5 or ...e5 at the right moment.", "Exchange QGD: use the e-file and the e4 square.", "QGA: ...c5, ...a6, ...b5 and ...Bb7."] },
    ],
    structures: [
      { name: "Carlsbad structure (QGD Exchange)", moves: "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6", text: "White's plan is the minority attack (b4–b5). Black's plan is ...Ne4 and play on the kingside." },
      { name: "Isolated queen's pawn (QGA)", moves: "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 Qe2 cxd4 exd4", text: "White has an isolated d-pawn: it is a weakness in the endgame but gives space and attacking chances in the middlegame." },
    ],
    lines: [
      { id: "qg-orthodox", name: "QGD, Tartakower", eco: "D58", kind: "main", moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6", note: "Black solves the c8-bishop problem with ...b6 and ...Bb7." },
      { id: "qg-exchange", name: "QGD, Exchange", eco: "D36", kind: "main", moves: "d4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 O-O Qc2 Nbd7 Nge2 Re8", note: "The Carlsbad structure. Very instructive: learn the minority attack here." },
      { id: "qg-bf4", name: "QGD, 5.Bf4", eco: "D37", kind: "side", moves: "d4 d5 c4 e6 Nc3 Nf6 Nf3 Be7 Bf4 O-O e3 c5 dxc5 Bxc5", note: "A modern line. Black frees the game with ...c5 at once." },
      { id: "qg-qga-classical", name: "QGA, Classical", eco: "D27", kind: "main", moves: "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6", note: "Black returns the pawn and gets free, natural development." },
      { id: "qg-qga-e4", name: "QGA, Central (3.e4)", eco: "D20", kind: "side", moves: "d4 d5 c4 dxc4 e4 e5 Nf3 exd4 Bxc4 Nc6 O-O", note: "White takes the whole centre; Black hits it at once with ...e5." },
      { id: "qg-albin", name: "Albin Countergambit", eco: "D09", kind: "side", moves: "d4 d5 c4 e5 dxe5 d4 Nf3 Nc6 g3", note: "A sharp sideline for Black. Know it so it does not surprise you." },
    ],
    traps: [
      { name: "Elephant trap", kind: "trap", moves: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5 Nxd5 Nxd5 Bxd8 Bb4+ Qd2 Bxd2+ Kxd2 Kxd8", text: "The d5 pawn looks free because the knight on f6 is pinned. It is not: ...Nxd5! gives up the queen and wins a piece back with interest." },
      { name: "Lasker trap (Albin)", kind: "trap", moves: "d4 d5 c4 e5 dxe5 d4 e3 Bb4+ Bd2 dxe3 Bxb4 exf2+ Ke2 fxg1=N+", text: "A famous underpromotion. After 7.Ke2, promoting to a knight with check wins material." },
      { name: "Keeping the c4 pawn", kind: "mistake", moves: "d4 d5 c4 dxc4 e3 b5 a4 c6 axb5 cxb5 Qf3", text: "Defending c4 with ...b5 opens the long diagonal. Qf3 attacks the rook on a8." },
    ],
  },
  {
    slug: "london", name: "London System", short: "London", family: "1.d4", side: "white", level: "Beginner", ecoRange: "D02, A46, A48",
    summary: "White plays d4, Bf4, e3, Nf3, c3, Nbd2 and Bd3 in almost every game. It is a system, not a line: the same set-up against nearly everything. Easy to learn, solid, and with a clear kingside attack plan.",
    goodFor: "Busy players who want one set-up for White that works against everything.",
    ideas: [
      "Get the dark-squared bishop out to f4 before playing e3.",
      "The pyramid c3–d4–e3 is very solid. Black finds it hard to attack.",
      "Ne5 plus f4, or Qf3 and h4, give a kingside attack.",
      "If Black plays ...c5 and ...Qb6, look at b2: defend it with Qb3 or Qc1, or use tricks like Nc3 and Nb5.",
    ],
    plans: [
      { side: "White", points: ["Bf4, e3, Nf3, c3, Bd3, Nbd2, O-O in any order that is safe.", "Put a knight on e5 and support it with f4.", "If Black castles short, attack with Qf3/Qh5 and g4 or h4."] },
      { side: "Black", points: ["Hit the centre with ...c5 and ...Qb6.", "Trade the f4 bishop with ...Bd6 or ...Nh5.", "Play ...e5 in King's Indian set-ups."] },
    ],
    structures: [
      { name: "The London pyramid", moves: "d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3", text: "White's c3–d4–e3 pawns are a fortress. The fight is about e4 and e5: White wants Ne5, Black wants ...e5." },
    ],
    lines: [
      { id: "lo-main", name: "Against ...d5 and ...c5", eco: "D02", kind: "main", moves: "d4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3", note: "The standard set-up. Bg3 keeps the bishop when Black offers a trade with ...Bd6." },
      { id: "lo-kid", name: "Against a King's Indian set-up", eco: "A48", kind: "main", moves: "d4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6 h3 c5 c3", note: "Bishop on e2 and h3 give the f4 bishop a safe home on h2." },
      { id: "lo-qb6", name: "Against an early ...Qb6", eco: "D00", kind: "side", moves: "d4 d5 Bf4 c5 e3 Nc6 c3 Qb6 Qb3 c4 Qc2", note: "Meet the queen with your queen. After ...c4, the queen goes back to c2 with an eye on h7." },
      { id: "lo-bf5", name: "Against ...Bf5 (copycat)", eco: "D00", kind: "side", moves: "d4 d5 Bf4 Nf6 e3 Bf5 c4 e6 Nc3", note: "When Black copies, c4 and Qb3 put pressure on b7." },
      { id: "lo-jobava", name: "Jobava London (Nc3)", eco: "D01", kind: "side", moves: "d4 d5 Nc3 Nf6 Bf4 c5 e3", note: "An aggressive cousin: Nc3 and Nb5 ideas against c7." },
    ],
    traps: [
      { name: "Poisoned b2 pawn", kind: "trap", moves: "d4 d5 Bf4 c5 e3 Qb6 Nc3 Qxb2 Nb5", text: "Black takes b2, but Nb5 threatens Nc7+ forking king and rook, and Rb1 will chase the queen." },
      { name: "Bishop trapped by ...Nh5", kind: "mistake", moves: "d4 Nf6 Bf4 d5 e3 c5 Nf3 Nc6 Nbd2 Nh5 Bg5 h6 Bh4 g5 Bg3 Nxg3 hxg3", text: "Not a disaster, but White loses the London bishop. Play h3 early or have Bg3 ready so ...Nh5 just trades." },
    ],
  },
  {
    slug: "kings-indian", name: "King's Indian Defence", short: "King's Indian", family: "1.d4", side: "black", level: "Advanced", ecoRange: "E60–E99",
    summary: "Black lets White build a big centre, then attacks it. Black fianchettoes the king's bishop, castles, and strikes with ...e5 (or ...c5). In the main lines Black attacks on the kingside while White attacks on the queenside. Fischer and Kasparov used it to win famous games.",
    goodFor: "Attacking players with Black who do not mind being under pressure for a while.",
    ideas: [
      "Allow White's big centre (c4, d4, e4), then hit it with ...e5.",
      "When White closes the centre with d5, the pawn chains point the way: Black attacks the kingside (...f5, ...f4, ...g5), White attacks the queenside (c5, b4).",
      "The g7 bishop looks blocked by e5, but it comes back to life when the position opens.",
      "Speed matters more than material in the Mar del Plata race.",
    ],
    plans: [
      { side: "White", points: ["Close the centre with d5 and attack with b4 and c5.", "Or keep tension with Be3 and dxe5.", "In the Sämisch, castle long and push g4 and h4."] },
      { side: "Black", points: ["Knight to e8 or d7, then ...f5.", "...f4 and ...g5–g4 for a pawn storm.", "Use ...Nf6–h5–f4 and ...Rf7–g7."] },
    ],
    structures: [
      { name: "Mar del Plata (closed centre)", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7", text: "The famous race: Black plays ...Nd7 and ...f5 on the kingside; White plays Ne1, f3 and c5 on the queenside." },
    ],
    lines: [
      { id: "kid-mardelplata", name: "Classical, Mar del Plata", eco: "E98", kind: "main", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5", note: "The main line. Black's kingside attack against White's queenside play." },
      { id: "kid-petrosian", name: "Petrosian System", eco: "E92", kind: "side", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 d5 a5 Bg5 h6 Bh4 Na6", note: "White closes the centre early and pins the f6 knight." },
      { id: "kid-samisch", name: "Sämisch Variation", eco: "E87", kind: "main", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 Nh5", note: "White protects e4 with f3 and often castles long. ...Nh5 aims at f4." },
      { id: "kid-fourpawns", name: "Four Pawns Attack", eco: "E76", kind: "side", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4 O-O Nf3 c5 d5 e6", note: "White takes maximum space. Black attacks it right away with ...c5 and ...e6." },
      { id: "kid-fianchetto", name: "Fianchetto Variation", eco: "E68", kind: "side", moves: "d4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5 e4", note: "A positional line. White's king is very safe." },
      { id: "kid-averbakh", name: "Averbakh Variation", eco: "E75", kind: "side", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Be2 O-O Bg5 c5 d5 e6", note: "Bg5 stops ...e5 for a moment. Black switches to ...c5." },
    ],
    traps: [
      { name: "The e5 pawn is not hanging", kind: "trap", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 dxe5 dxe5 Qxd8 Rxd8 Nxe5 Nxe4 Nxe4 Bxe5", text: "After the queen trade, Nxe5 looks like it wins a pawn. ...Nxe4! uses the g7 bishop to win it back." },
    ],
  },
  {
    slug: "nimzo-indian", name: "Nimzo-Indian Defence", short: "Nimzo-Indian", family: "1.d4", side: "black", level: "Advanced", ecoRange: "E20–E59",
    summary: "After 1.d4 Nf6 2.c4 e6 3.Nc3, Black pins the knight with 3...Bb4. Black controls e4 with pieces, not pawns, and is often happy to give the bishop for the knight to double White's pawns. One of the most respected defences in chess.",
    goodFor: "Players who like flexible, strategic positions and fighting for squares instead of space.",
    ideas: [
      "The pin on c3 stops White from playing e4 easily.",
      "...Bxc3 gives White the bishop pair but can leave doubled c-pawns. Black then blocks the position for the knights.",
      "Control e4 with ...Ne4, ...b6 and ...Bb7, ...d5 or ...f5.",
      "White has many 4th moves; learn the plans, not just moves.",
    ],
    plans: [
      { side: "White", points: ["Win the bishop pair (a3 or Qc2) and open the position.", "Play f3 and e4 to build a big centre in the Sämisch.", "In the Rubinstein (4.e3), develop quietly and castle."] },
      { side: "Black", points: ["Double White's pawns and attack them with ...c5, ...Na5, ...Ba6.", "Keep the position closed if White has two bishops.", "Fight for e4 with ...b6 and ...Bb7."] },
    ],
    structures: [
      { name: "Doubled c-pawns (Sämisch)", moves: "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 f3 d5", text: "White has the bishop pair and the centre; Black targets the weak c4 pawn." },
    ],
    lines: [
      { id: "ni-rubinstein", name: "Rubinstein (4.e3)", eco: "E59", kind: "main", moves: "d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O Nc6 a3 Bxc3 bxc3 dxc4 Bxc4 Qc7", note: "Classical main line. Black hits the centre with ...c5 and ...d5." },
      { id: "ni-classical", name: "Classical (4.Qc2)", eco: "E32", kind: "main", moves: "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 f3 h6 Bh4 d5", note: "White avoids doubled pawns. Black gets fast development and fights for e4." },
      { id: "ni-samisch", name: "Sämisch (4.a3)", eco: "E25", kind: "side", moves: "d4 Nf6 c4 e6 Nc3 Bb4 a3 Bxc3+ bxc3 c5 f3 d5 cxd5 Nxd5", note: "White forces the trade at once. Very sharp." },
      { id: "ni-leningrad", name: "Leningrad (4.Bg5)", eco: "E31", kind: "side", moves: "d4 Nf6 c4 e6 Nc3 Bb4 Bg5 h6 Bh4 c5 d5 d6 e3", note: "White pins back." },
      { id: "ni-kasparov", name: "Kasparov (4.Nf3 and g3)", eco: "E21", kind: "side", moves: "d4 Nf6 c4 e6 Nc3 Bb4 Nf3 c5 g3 cxd4 Nxd4 O-O Bg2 d5", note: "Kasparov's fianchetto. White's g2 bishop presses on the long diagonal." },
    ],
    traps: [
      { name: "Pawn grab on c5 that backfires", kind: "mistake", moves: "d4 Nf6 c4 e6 Nc3 Bb4 Qc2 c5 dxc5 Bxc5 Nf3 Qb6 e3 Qa5", text: "Taking on c5 is fine for White, but Black gets very quick development and pressure on c3 in return. Know the follow-up before you play it." },
    ],
  },
  {
    slug: "english", name: "English Opening", short: "English", family: "1.c4", side: "white", level: "Intermediate", ecoRange: "A10–A39",
    summary: "1.c4 controls d5 from the side. White often fianchettoes the king's bishop with g3 and Bg2 and plays a Sicilian with an extra move. Flexible and positional, it can transpose into many 1.d4 openings.",
    goodFor: "Positional players who like flexible set-ups and long plans.",
    ideas: [
      "c4 and Nc3 fight for d5.",
      "g3 and Bg2: the bishop on the long diagonal is White's key piece.",
      "Against ...e5 it is a Reversed Sicilian with an extra tempo for White.",
      "Queenside play with a3, Rb1, b4 is a typical plan.",
    ],
    plans: [
      { side: "White", points: ["Fianchetto, castle, then b4–b5 on the queenside.", "Use the d5 square and the long diagonal.", "In the Botvinnik set-up (e4), play f4 and attack on the kingside."] },
      { side: "Black", points: ["Take space in the centre with ...e5 or ...d5.", "Copy with ...c5, ...g6, ...Bg7 (Symmetrical).", "Watch the long diagonal; ...c6 and ...d5 can block it."] },
    ],
    structures: [
      { name: "Botvinnik set-up", moves: "c4 e5 Nc3 Nc6 g3 g6 Bg2 Bg7 e4 d6 Nge2", text: "White's pawns on c4 and e4 grip d5. White plays d3, O-O, then f4 or a queenside push." },
    ],
    lines: [
      { id: "en-reversed", name: "Reversed Sicilian (2...Nf6 3.g3 d5)", eco: "A29", kind: "main", moves: "c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O Be7", note: "A Dragon with colours reversed and White a move up." },
      { id: "en-four-knights", name: "Four Knights", eco: "A29", kind: "main", moves: "c4 e5 Nc3 Nf6 Nf3 Nc6 g3 Bb4 Bg2 O-O O-O e4 Ng5 Bxc3 bxc3 Re8", note: "Black gains space with ...e4; White gets the bishop pair." },
      { id: "en-botvinnik", name: "Botvinnik System", eco: "A25", kind: "side", moves: "c4 e5 Nc3 Nc6 g3 g6 Bg2 Bg7 e4 d6 Nge2", note: "A closed set-up with a firm grip on d5." },
      { id: "en-symmetrical", name: "Symmetrical", eco: "A39", kind: "main", moves: "c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 Nf3 Nf6 O-O O-O d4 cxd4 Nxd4", note: "Black copies. White opens the centre with d4." },
      { id: "en-agincourt", name: "Against ...e6 and ...d5", eco: "A14", kind: "side", moves: "c4 e6 Nf3 d5 g3 Nf6 Bg2 Be7 O-O O-O b3", note: "White develops calmly; the game is like a Catalan or Réti." },
    ],
    traps: [
      { name: "Fork trick on e5", kind: "trap", moves: "c4 e5 Nc3 Nf6 Nf3 Nc6 e4 Bc5 Nxe5 Nxe5 d4 Bb4 dxe5 Nxe4", text: "White gives the knight on e5 and wins it back with the pawn fork d4. Watch for this idea in all symmetrical positions." },
    ],
  },
  {
    slug: "slav", name: "Slav Defence", short: "Slav", family: "1.d4", side: "black", level: "Intermediate", ecoRange: "D10–D19",
    summary: "After 1.d4 d5 2.c4, Black supports d5 with 2...c6. Unlike the Queen's Gambit Declined, the c8 bishop is free to come out to f5 or g4. Very solid and popular at all levels.",
    goodFor: "Players who want a rock-solid defence against 1.d4 without a bad bishop.",
    ideas: [
      "...c6 keeps the centre and leaves the c8 bishop free.",
      "In the main line, Black takes on c4 and then develops the bishop to f5.",
      "White's a4 stops ...b5, but leaves a hole on b4 for Black's pieces.",
      "Watch b7: once the bishop leaves c8, Qb3 can attack it.",
    ],
    plans: [
      { side: "White", points: ["Win back c4 and build e4.", "Use Qb3 to attack b7.", "Exchange Slav: use the c-file and Bf4."] },
      { side: "Black", points: ["...Bf5 or ...Bg4, then ...e6, ...Nbd7, ...Bb4/...Be7.", "Use the b4 square after a4.", "Break with ...c5 or ...e5."] },
    ],
    structures: [
      { name: "Slav main line", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4", text: "Black gave up the centre but has active pieces. b4 is a great square for Black's bishop." },
    ],
    lines: [
      { id: "sl-main", name: "Main line (4...dxc4)", eco: "D19", kind: "main", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2", note: "Black takes on c4 and develops quickly with ...Bf5 and ...Bb4." },
      { id: "sl-exchange", name: "Exchange Variation", eco: "D10", kind: "side", moves: "d4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3 Bf5", note: "Symmetrical. Draw-ish if you copy, so look for imbalances." },
      { id: "sl-quiet", name: "Quiet line (4.e3 Bf5)", eco: "D12", kind: "main", moves: "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4 Bg6 Nxg6 hxg6", note: "White takes the bishop pair, but Black gets a half-open h-file." },
      { id: "sl-chebanenko", name: "Chebanenko (4...a6)", eco: "D15", kind: "side", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 a6 e3 b5 b3 Bg4", note: "Black prepares ...b5 without taking on c4 first." },
      { id: "sl-qb3", name: "Early Qb3 line", eco: "D12", kind: "side", moves: "d4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Qb3 Qb6", note: "White hits b7 at once; Black meets queen with queen." },
    ],
    traps: [
      { name: "Bishop out too early", kind: "mistake", moves: "d4 d5 c4 c6 Nf3 Bf5 cxd5 cxd5 Qb3", text: "With the bishop gone from c8, Qb3 attacks b7 and d5 at the same time. Play ...Nf6 first." },
    ],
  },
  {
    slug: "scandinavian", name: "Scandinavian Defence", short: "Scandinavian", family: "1.e4", side: "black", level: "Beginner", ecoRange: "B01",
    summary: "1...d5 hits e4 at once. After 2.exd5 Qxd5 the queen comes out early, but White's knight on c3 cannot win much time if Black knows where to put it (a5, d6 or d8). Easy to learn because White's first moves are almost forced.",
    goodFor: "Beginners who want a simple answer to 1.e4 with little theory.",
    ideas: [
      "Black decides the type of position from move one.",
      "Put the queen on a5, d6 or d8 after Nc3 hits it.",
      "Develop the c8 bishop to f5 or g4 before ...e6.",
      "Black gets a solid 'Caro-Kann-like' structure with ...c6 and ...e6.",
    ],
    plans: [
      { side: "White", points: ["Gain time on the queen and develop quickly.", "Push d4 and use the extra centre space.", "Chase the f5 bishop with Ne5, g4 and h4."] },
      { side: "Black", points: ["...Nf6, ...c6, ...Bf5, ...e6, ...Nbd7, castle.", "Keep the queen safe from knight jumps (Nd5, Nb5).", "Trade pieces and reach a healthy endgame."] },
    ],
    structures: [
      { name: "Queen on a5, pawns on c6 and e6", moves: "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6", text: "Black's pieces are developed and the pawn structure is very healthy. White has a bit more space." },
    ],
    lines: [
      { id: "sc-qa5", name: "Main line (3...Qa5)", eco: "B01", kind: "main", moves: "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6", note: "The classic main line. Watch for Nd5 tricks once the bishop is on d2." },
      { id: "sc-qd6", name: "Modern (3...Qd6)", eco: "B01", kind: "main", moves: "e4 d5 exd5 Qxd5 Nc3 Qd6 d4 Nf6 Nf3 a6 g3", note: "The queen on d6 is harder to attack. ...a6 stops Nb5." },
      { id: "sc-qd8", name: "Retreat (3...Qd8)", eco: "B01", kind: "side", moves: "e4 d5 exd5 Qxd5 Nc3 Qd8 d4 Nf6 Nf3 Bg4 h3 Bxf3 Qxf3 c6", note: "Very solid. Black gives White a little more space." },
      { id: "sc-nf6", name: "Modern 2...Nf6", eco: "B01", kind: "side", moves: "e4 d5 exd5 Nf6 d4 Nxd5 Nf3 g6 c4 Nb6", note: "Black takes back with the knight instead of the queen." },
      { id: "sc-e5", name: "When White plays 2.e5", eco: "B01", kind: "side", moves: "e4 d5 e5 Bf5 d4 e6", note: "A French Advance with Black's good bishop already outside." },
    ],
    traps: [
      { name: "The f5 bishop gets chased", kind: "mistake", moves: "e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Ne5 e6 g4 Bg6 h4", text: "White threatens h5, trapping the bishop. Black must react now with ...Nbd7 or ...Bb4. Know this pattern before you play ...Bf5." },
    ],
  },
];

export const KIT_BY_SLUG = Object.fromEntries(KITS.map((k) => [k.slug, k]));
