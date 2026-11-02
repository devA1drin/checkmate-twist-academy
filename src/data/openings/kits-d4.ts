// More 1.d4, 1.c4, 1.Nf3 and 1.f4 kits. Same rules as kits.ts.
import type { OpeningKit } from "./kits";

export const D4_KITS: OpeningKit[] = [
  {
    slug: "qga", name: "Queen's Gambit Accepted", short: "QGA", family: "1.d4", side: "black", level: "Beginner", ecoRange: "D20–D29",
    summary: "Black takes the c4 pawn with 2...dxc4, gives up the centre for a moment, and then hits back with ...c5 and ...e6. Black does not try to keep the pawn; the point is free, easy development.",
    goodFor: "Black players who want a clear, classical answer to 1.d4 with little risk and simple plans.",
    ideas: [
      "2...dxc4 is not greed: White gets the pawn back. Black uses the time for ...Nf6, ...e6 and ...c5.",
      "Do not try to keep the pawn with ...b5: a4 and Qf3 tactics punish it.",
      "After ...c5 and cxd4, White often gets an isolated d-pawn. Black blockades on d5.",
    ],
    plans: [
      { side: "White", points: ["Win the pawn back with e3 and Bxc4.", "Or take the centre with 3.e4.", "With an isolated d-pawn, attack with Bd3, Qe2 and Rd1."] },
      { side: "Black", points: ["Develop ...Nf6, ...e6, ...c5, ...a6 and ...b5 at the right moment.", "Trade on d4 and blockade the isolated pawn.", "Against 3.e4, hit back with ...e5 or ...Nf6."] },
    ],
    structures: [
      { name: "Classical QGA", moves: "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6", text: "Symmetrical-looking but White's d-pawn can become isolated after ...cxd4. Black's position is free and healthy." },
    ],
    lines: [
      { id: "qa-classical", name: "Classical (3.Nf3 and 4.e3)", eco: "D27", kind: "main", moves: "d4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 dxc5 Qxd1 Rxd1 Bxc5", note: "Queens come off early; Black has a fully equal endgame with active pieces." },
      { id: "qa-central", name: "Central (3.e4 e5)", eco: "D20", kind: "main", moves: "d4 d5 c4 dxc4 e4 e5 Nf3 exd4 Bxc4 Bb4+ Nbd2 Nc6 O-O Nf6 e5 Nd5", note: "White takes the centre; Black counter-attacks at once." },
      { id: "qa-e4-nf6", name: "Central (3.e4 Nf6)", eco: "D20", kind: "side", moves: "d4 d5 c4 dxc4 e4 Nf6 e5 Nd5 Bxc4 Nb6 Bd3 Nc6 Ne2 Bg4", note: "Black chases White's pieces and attacks d4." },
      { id: "qa-bg4", name: "3...a6 and ...Bg4", eco: "D22", kind: "side", moves: "d4 d5 c4 dxc4 Nf3 a6 e3 Bg4 Bxc4 e6 h3 Bh5 Nc3 Nf6 O-O Nc6", note: "Black develops the light bishop before ...e6." },
    ],
    traps: [
      { name: "Holding the pawn with ...b5", kind: "mistake", moves: "d4 d5 c4 dxc4 e3 b5 a4 c6 axb5 cxb5 Qf3", text: "Trying to keep the extra pawn fails: after a4 and axb5, Qf3 hits the a8 rook along the long diagonal and Black loses material." },
    ],
  },
  {
    slug: "semi-slav", name: "Semi-Slav Defence", short: "Semi-Slav", family: "1.d4", side: "black", level: "Advanced", ecoRange: "D43–D49",
    summary: "Black combines the Slav (...c6) and the Queen's Gambit Declined (...e6) to build a very solid triangle of pawns, then hits back with ...dxc4 and ...b5. It leads to some of the sharpest lines in chess (Meran, Botvinnik, Moscow).",
    goodFor: "Strong, well-prepared players who want a solid base with sharp counter-chances.",
    ideas: [
      "The pawns on c6, d5 and e6 make Black's centre very hard to break.",
      "Black often takes on c4 and expands with ...b5, ...Bb7, ...a6 and ...c5.",
      "Against Bg5, the Botvinnik and Moscow lines are very sharp; learn them before playing them.",
    ],
    plans: [
      { side: "White", points: ["Take space with e4 when possible.", "Against the Meran, use the centre break e4–e5.", "Anti-Meran (Qc2) avoids the sharpest lines."] },
      { side: "Black", points: ["Play ...dxc4, ...b5, ...Bb7, ...a6 and ...c5.", "Free the c8 bishop through b7.", "Use ...e5 or ...c5 breaks when White's centre is not ready."] },
    ],
    structures: [
      { name: "Meran expansion", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7 O-O a6 e4 c5 d5 Qc7", text: "Black has queenside space and the b7 bishop; White has central space and plans e5." },
    ],
    lines: [
      { id: "ss-meran", name: "Meran (6.Bd3 dxc4)", eco: "D47", kind: "main", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7 O-O a6 e4 c5 d5 Qc7", note: "The classical main line. Very rich in ideas; Black's bishop on b7 is key." },
      { id: "ss-anti-meran", name: "Anti-Meran (6.Qc2)", eco: "D46", kind: "main", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Qc2 Bd6 Bd3 O-O O-O dxc4 Bxc4 b5 Be2 Bb7", note: "A popular way for White to avoid the Meran." },
      { id: "ss-moscow", name: "Moscow (5.Bg5 h6)", eco: "D43", kind: "side", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 h6 Bxf6 Qxf6 e3 Nd7 Bd3 dxc4 Bxc4 g6 O-O Bg7", note: "Black gets the bishop pair in return for a little space." },
      { id: "ss-botvinnik", name: "Botvinnik (5.Bg5 dxc4)", eco: "D44", kind: "side", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 dxc4 e4 b5 e5 h6 Bh4 g5 Nxg5 hxg5 Bxg5 Nbd7", note: "One of the sharpest lines in chess. Both sides sacrifice material." },
      { id: "ss-marshall", name: "Marshall Gambit", eco: "D31", kind: "side", moves: "d4 d5 c4 c6 Nc3 e6 e4 dxe4 Nxe4 Bb4+ Bd2 Qxd4 Bxb4 Qxe4+ Be2 Na6", note: "White gives the d-pawn for dark-square pressure. Black must defend precisely." },
    ],
    traps: [],
  },
  {
    slug: "catalan", name: "Catalan Opening", short: "Catalan", family: "1.d4", side: "white", level: "Advanced", ecoRange: "E00–E09",
    summary: "White combines d4 and c4 with a fianchetto (g3, Bg2). The g2 bishop presses along the long diagonal against b7 and a8. It is a favourite of Kramnik, Carlsen and many top players for long-term pressure.",
    goodFor: "Positional players with White who like lasting pressure and endgames.",
    ideas: [
      "The g2 bishop is the soul of the Catalan: it pressures d5, b7 and a8.",
      "In the Open Catalan, Black takes on c4; White often gets the pawn back with Qc2 or Qa4+.",
      "In the Closed Catalan, Black keeps the centre with ...Nbd7 and ...c6; White plays e4.",
    ],
    plans: [
      { side: "White", points: ["Win back the c4 pawn with Qc2, Qa4 or Ne5.", "Pressure the queenside with Rc1, a4 and the g2 bishop.", "In the closed lines, prepare e4."] },
      { side: "Black", points: ["Open: hold the pawn for a while with ...a6 and ...b5, then give it back for development.", "Closed: ...Nbd7, ...c6, ...b6 and ...Bb7.", "Break with ...c5 to challenge d4."] },
    ],
    structures: [
      { name: "Open Catalan", moves: "d4 Nf6 c4 e6 g3 d5 Bg2 dxc4 Nf3 Be7 O-O O-O Qc2 a6 Qxc4 b5 Qc2 Bb7", text: "Black has queenside space; White has the long diagonal and central control." },
    ],
    lines: [
      { id: "ca-open", name: "Open Catalan (4...dxc4)", eco: "E05", kind: "main", moves: "d4 Nf6 c4 e6 g3 d5 Bg2 dxc4 Nf3 Be7 O-O O-O Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4 Qc1", note: "The main line. Black's bishop on e4 challenges the g2 bishop." },
      { id: "ca-closed", name: "Closed Catalan", eco: "E09", kind: "main", moves: "d4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O Nbd7 Qc2 c6 Nbd2 b6 e4 Bb7", note: "Black keeps the centre closed. White plays e4 to gain space." },
      { id: "ca-c5", name: "Open, 5...c5", eco: "E04", kind: "side", moves: "d4 Nf6 c4 e6 g3 d5 Bg2 dxc4 Nf3 c5 O-O Nc6 dxc5 Qxd1 Rxd1 Bxc5 Nbd2", note: "Black hits d4 at once; queens come off quickly." },
      { id: "ca-bb4", name: "4...Bb4+", eco: "E11", kind: "side", moves: "d4 Nf6 c4 e6 g3 d5 Bg2 Bb4+ Bd2 Be7 Nf3 O-O O-O c6 Qc2 b6", note: "Black lures White's bishop to d2, where it is less active. The position is now classed as a Bogo-Indian (E11)." },
    ],
    traps: [],
  },
  {
    slug: "colle", name: "Colle System", short: "Colle", family: "1.d4", side: "white", level: "Beginner", ecoRange: "D04–D05, A46",
    summary: "A simple system for White: d4, Nf3, e3, Bd3, O-O and Nbd2, then the e4 push (Colle-Koltanowski) or b3 and Bb2 (Colle-Zukertort). Few lines to learn and a clear kingside attacking plan.",
    goodFor: "Beginners and club players who want one setup against almost everything.",
    ideas: [
      "Build first, then strike with e4. The d3 bishop aims at h7.",
      "In the Zukertort version, the b2 bishop and a knight on e5 aim at Black's king.",
      "Watch the Greek gift (Bxh7+) when Black's king has few defenders.",
    ],
    plans: [
      { side: "White", points: ["Colle-Koltanowski: c3, Nbd2, then e4.", "Colle-Zukertort: b3, Bb2, Ne5 and f4.", "Attack the kingside with Qe2, Ne5 and Rf3 ideas."] },
      { side: "Black", points: ["Develop with ...c5 and ...Nc6 to pressure d4.", "Answer e4 with ...dxe4 and ...e5 or ...cxd4.", "Keep a defender on f6 to protect h7."] },
    ],
    structures: [
      { name: "Colle-Zukertort", moves: "d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 b3 Nc6 O-O Bd6 Bb2 O-O Nbd2 b6", text: "White's bishops aim at Black's king from b2 and d3. White plans Ne5, f4 and Rf3." },
    ],
    lines: [
      { id: "co-koltanowski", name: "Colle-Koltanowski (c3 and e4)", eco: "D05", kind: "main", moves: "d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 c3 Nc6 Nbd2 Bd6 O-O O-O dxc5 Bxc5 e4", note: "The classical Colle: White opens the centre with e4." },
      { id: "co-zukertort", name: "Colle-Zukertort (b3)", eco: "D05", kind: "main", moves: "d4 d5 Nf3 Nf6 e3 e6 Bd3 c5 b3 Nc6 O-O Bd6 Bb2 O-O Nbd2 b6", note: "The modern favourite. The b2 bishop joins the attack." },
      { id: "co-kid", name: "Against the King's Indian", eco: "A48", kind: "side", moves: "d4 Nf6 Nf3 g6 e3 Bg7 Bd3 d6 O-O O-O c3 Nbd7 Nbd2 e5 e4", note: "White builds the same setup and plays e4 against ...g6 too." },
      { id: "co-bg4", name: "Against ...Bg4 / ...Bf5", eco: "D04", kind: "side", moves: "d4 d5 Nf3 Nf6 e3 Bf5 Bd3 e6 Bxf5 exf5 Qd3 Qc8", note: "If Black develops the light bishop first, trade it and target the weak pawns." },
    ],
    traps: [
      { name: "Greek gift", kind: "trap", moves: "d4 Nf6 Nf3 e6 e3 c5 Bd3 d5 c3 Nc6 Nbd2 Bd6 O-O O-O dxc5 Bxc5 e4 Qc7 e5 Nd7 Bxh7+ Kxh7 Ng5+", text: "When Black's knight is pushed away from f6, Bxh7+ and Ng5+ with Qh5 is a classic attack. Here Black's king is in serious trouble." },
    ],
  },
  {
    slug: "trompowsky", name: "Trompowsky Attack", short: "Trompowsky", family: "1.d4", side: "white", level: "Intermediate", ecoRange: "A45",
    summary: "After 1.d4 Nf6, White plays 2.Bg5 at once, threatening to double Black's pawns with Bxf6. It avoids the big Indian-defence theory and leads to unusual positions.",
    goodFor: "White players who want to avoid King's Indian, Nimzo and Grünfeld theory.",
    ideas: [
      "2.Bg5 attacks f6. If Black allows Bxf6, Black's pawns are damaged.",
      "Against 2...Ne4, the bishop goes to f4 or h4 and White chases the knight with f3.",
      "White often plays e4 and Nc3 quickly to use the extra space.",
    ],
    plans: [
      { side: "White", points: ["Take on f6 when it damages Black's pawns.", "Against ...Ne4, play Bf4 and f3 to kick the knight.", "Build e3, Nd2, c3 or go for e4."] },
      { side: "Black", points: ["2...Ne4 and ...c5 is the most active answer.", "2...e6 and ...h6 gives Black the bishop pair.", "Hit the b2 pawn with ...Qb6 when the dark bishop has left c1."] },
    ],
    structures: [
      { name: "2...e6 with the bishop pair", moves: "d4 Nf6 Bg5 e6 e4 h6 Bxf6 Qxf6 Nc3 d6 Qd2 g5", text: "Black has the two bishops; White has the centre and quick development." },
    ],
    lines: [
      { id: "tr-ne4", name: "2...Ne4 3.Bf4 c5", eco: "A45", kind: "main", moves: "d4 Nf6 Bg5 Ne4 Bf4 c5 f3 Qa5+ c3 Nf6 d5 Qb6", note: "The sharpest main line. Black attacks b2 and the centre." },
      { id: "tr-e6", name: "2...e6", eco: "A45", kind: "main", moves: "d4 Nf6 Bg5 e6 e4 h6 Bxf6 Qxf6 Nc3 d6 Qd2 g5", note: "Black takes the bishop pair and prepares ...Bg7." },
      { id: "tr-c5", name: "2...c5", eco: "A45", kind: "side", moves: "d4 Nf6 Bg5 c5 Bxf6 gxf6 d5 Qb6 Qc1 f5 c3", note: "Black accepts doubled pawns for the bishop pair and pressure on b2." },
      { id: "tr-d5", name: "2...d5", eco: "A45", kind: "side", moves: "d4 Nf6 Bg5 d5 Bxf6 exf6 e3 Bd6 c4 dxc4 Bxc4 O-O Nc3", note: "Black gets doubled f-pawns but two bishops and a solid centre. Opening books file it under the Queen's Pawn Game (A45)." },
    ],
    traps: [],
  },
  {
    slug: "jobava-london", name: "Jobava London", short: "Jobava London", family: "1.d4", side: "white", level: "Intermediate", ecoRange: "D00, A45",
    summary: "A sharper cousin of the London: White plays Nc3 and Bf4 (the Rapport-Jobava System). The knight on c3 supports e4 and a jump to b5, and White often castles long and pushes the kingside pawns.",
    goodFor: "London players who want more aggressive positions and early tactics.",
    ideas: [
      "Nc3 and Bf4 together aim at c7: Nb5 threats come quickly.",
      "White can play f3 and e4 to build a centre, or h4 and g4 to attack.",
      "Black's ...c5 and ...e5 breaks hit back in the centre; know them.",
    ],
    plans: [
      { side: "White", points: ["Nb5 when c7 is weak.", "e3, Qd2 and O-O-O, then g4 and h4.", "Against ...Bf5, chase it with f3 and g4."] },
      { side: "Black", points: ["Cover c7 early (...a6 or ...Na6, or ...c6).", "Strike with ...c5 to open lines toward White's king.", "Against the f3/g4 plan, play ...h6 and keep the bishop safe."] },
    ],
    structures: [
      { name: "Jobava with ...e6 and ...c5", moves: "d4 d5 Nc3 Nf6 Bf4 e6 e3 Bd6 Bg3 O-O Nb5 Be7 Nf3 a6 Nc3 c5", text: "Black has a Queen's Gambit-like setup. White's pieces are active but the knight has spent time." },
    ],
    lines: [
      { id: "jl-e6", name: "3...e6", eco: "D01", kind: "main", moves: "d4 d5 Nc3 Nf6 Bf4 e6 e3 Bd6 Bg3 O-O Nb5 Be7 Nf3 a6 Nc3 c5", note: "Black challenges the f4 bishop with ...Bd6. White keeps the bishop and uses the b5 jump." },
      { id: "jl-c5", name: "3...c5", eco: "D01", kind: "main", moves: "d4 d5 Nc3 Nf6 Bf4 c5 e3 Nc6 Nf3 Bg4 Bb5 e6 h3 Bxf3 Qxf3", note: "Black hits the centre. White pins the knight and keeps the bishop pair." },
      { id: "jl-bf5", name: "3...Bf5", eco: "D01", kind: "side", moves: "d4 d5 Nc3 Nf6 Bf4 Bf5 f3 e6 g4 Bg6 h4 h5 g5 Nfd7 e3", note: "White chases the bishop with pawns, gaining kingside space." },
      { id: "jl-g6", name: "Against ...g6", eco: "A45", kind: "side", moves: "d4 Nf6 Nc3 g6 Bf4 Bg7 e3 d6 h4 h5 Nf3 c5", note: "Against the King's Indian setup, White's h4 attack comes fast." },
    ],
    traps: [],
  },
  {
    slug: "queens-indian", name: "Queen's Indian Defence", short: "Queen's Indian", family: "1.d4", side: "black", level: "Intermediate", ecoRange: "E12–E19",
    summary: "After 1.d4 Nf6 2.c4 e6 3.Nf3, Black fianchettoes the queen's bishop with 3...b6. The b7 or a6 bishop controls e4, and Black's position is solid and flexible. Karpov made it a top-level weapon.",
    goodFor: "Solid Black players who want a sound, classical answer when White avoids the Nimzo-Indian.",
    ideas: [
      "...b6 and ...Bb7 (or ...Ba6) fight for the e4 square.",
      "In the main line with g3, Black often plays ...Ba6 to hit c4.",
      "Black plays ...d5 or ...c5 later to claim a share of the centre.",
    ],
    plans: [
      { side: "White", points: ["Fianchetto with g3 and Bg2 to fight for the long diagonal.", "Petrosian (a3) stops ...Bb4 and prepares Nc3 and e4.", "Play for d5 or e4 when possible."] },
      { side: "Black", points: ["Control e4 with ...Bb7, ...Ne4 and ...f5 ideas.", "Against g3, play ...Ba6 to hit c4.", "Break with ...c5 or ...d5."] },
    ],
    structures: [
      { name: "Fianchetto main line", moves: "d4 Nf6 c4 e6 Nf3 b6 g3 Ba6 b3 Bb4+ Bd2 Be7 Bg2 c6 Bc3 d5 Ne5 Nfd7 Nxd7 Nxd7 Nd2 O-O O-O", text: "A calm, balanced structure. Black's ...c5 or ...b5 will free the game." },
    ],
    lines: [
      { id: "qi-ba6", name: "4.g3 Ba6", eco: "E15", kind: "main", moves: "d4 Nf6 c4 e6 Nf3 b6 g3 Ba6 b3 Bb4+ Bd2 Be7 Bg2 c6 Bc3 d5 Ne5 Nfd7 Nxd7 Nxd7 Nd2 O-O O-O", note: "The modern main line. Black hits c4 and then fights for the centre with ...d5." },
      { id: "qi-bb7", name: "4.g3 Bb7", eco: "E19", kind: "main", moves: "d4 Nf6 c4 e6 Nf3 b6 g3 Bb7 Bg2 Be7 O-O O-O Nc3 Ne4 Qc2 Nxc3 Qxc3", note: "The classical line. Black trades knights to ease the position." },
      { id: "qi-petrosian", name: "Petrosian (4.a3)", eco: "E12", kind: "main", moves: "d4 Nf6 c4 e6 Nf3 b6 a3 Bb7 Nc3 d5 cxd5 Nxd5 Qc2 Nxc3 bxc3 Be7 e4 O-O", note: "White builds a big centre; Black attacks it with ...c5." },
      { id: "qi-e3", name: "4.e3", eco: "E14", kind: "side", moves: "d4 Nf6 c4 e6 Nf3 b6 e3 Bb7 Bd3 Be7 O-O O-O b3 d5", note: "A quiet system. Both sides develop normally." },
    ],
    traps: [
      { name: "Monticelli Trap", kind: "trap", moves: "d4 Nf6 c4 e6 Nf3 b6 g3 Bb7 Bg2 Bb4+ Bd2 Bxd2+ Qxd2 O-O Nc3 Ne4 Qc2 Nxc3 Ng5", text: "After 9...Nxc3? 10.Ng5! White threatens mate on h7 and attacks the b7 bishop at the same time. White wins material." },
    ],
  },
  {
    slug: "bogo-indian", name: "Bogo-Indian Defence", short: "Bogo-Indian", family: "1.d4", side: "black", level: "Intermediate", ecoRange: "E11",
    summary: "After 3.Nf3, Black gives a check with 3...Bb4+. It is a simple, solid way to develop and castle, and it avoids much of the Queen's Indian and Catalan theory.",
    goodFor: "Players with Black who want a low-theory, solid system against 1.d4 c4 Nf3.",
    ideas: [
      "3...Bb4+ develops with tempo; Black often trades the bishop for White's d2 piece.",
      "With ...Qe7 Black keeps the c5/e5 squares under control and prepares ...d6 and ...e5.",
      "Black's structure stays healthy; the game is calm and positional.",
    ],
    plans: [
      { side: "White", points: ["Block with Bd2 and develop with g3, Bg2, O-O.", "Use the bishop pair if Black trades on d2.", "Push e4 to gain space."] },
      { side: "Black", points: ["...Qe7, ...Nc6, ...d6 and ...e5.", "Trade dark bishops and play on the dark squares.", "Or ...a5 and ...d5 for a Catalan-like setup."] },
    ],
    structures: [
      { name: "Bogo with ...Qe7 and ...e5", moves: "d4 Nf6 c4 e6 Nf3 Bb4+ Bd2 Qe7 g3 Nc6 Bg2 Bxd2+ Nbd2 d6 O-O O-O e4 e5", text: "Dark-squared bishops are gone; Black's pawns on d6 and e5 control the dark squares." },
    ],
    lines: [
      { id: "bo-qe7", name: "4.Bd2 Qe7", eco: "E11", kind: "main", moves: "d4 Nf6 c4 e6 Nf3 Bb4+ Bd2 Qe7 g3 Nc6 Bg2 Bxd2+ Nbd2 d6 O-O O-O e4 e5", note: "The classical main line. Black plays for ...e5." },
      { id: "bo-a5", name: "4.Bd2 a5", eco: "E11", kind: "main", moves: "d4 Nf6 c4 e6 Nf3 Bb4+ Bd2 a5 g3 d5 Qc2 Nc6 Bg2 dxc4 Qxc4 Qd5", note: "Black keeps the bishop on b4 and plays ...d5 with active queen play." },
      { id: "bo-bxd2", name: "4.Bd2 Bxd2+", eco: "E11", kind: "side", moves: "d4 Nf6 c4 e6 Nf3 Bb4+ Bd2 Bxd2+ Qxd2 O-O g3 d5 Bg2 Nbd7 O-O dxc4", note: "Black trades at once and plays a Catalan-like setup." },
      { id: "bo-nbd2", name: "4.Nbd2", eco: "E11", kind: "side", moves: "d4 Nf6 c4 e6 Nf3 Bb4+ Nbd2 O-O a3 Be7 e4 d5 e5 Nfd7", note: "White blocks with the knight and wins space with a3 and e4." },
    ],
    traps: [],
  },
  {
    slug: "grunfeld", name: "Grünfeld Defence", short: "Grünfeld", family: "1.d4", side: "black", level: "Advanced", ecoRange: "D70–D99",
    summary: "Black lets White build a big pawn centre (d4, e4, c3) and then attacks it with the g7 bishop, ...c5 and pieces. It is one of the most dynamic answers to 1.d4, used by Fischer, Kasparov and many modern champions.",
    goodFor: "Ambitious, well-prepared players with Black who enjoy counter-attacking a big centre.",
    ideas: [
      "...d5 and ...Nxd5 invite e4; then ...Nxc3 and ...c5 start the attack on d4.",
      "The g7 bishop is Black's best piece; d4 is its target.",
      "White's centre can be strong or a target; timing is everything.",
    ],
    plans: [
      { side: "White", points: ["Exchange: build the centre with e4, c3, Nf3 and Be2 or Bc4.", "Push d5 at the right moment.", "Russian System (Qb3) keeps more pieces and space."] },
      { side: "Black", points: ["Hit d4 with ...c5, ...Nc6, ...Bg4 and ...Qa5.", "Trade on d4 and use the c-file.", "Use queenside majority in endgames."] },
    ],
    structures: [
      { name: "Exchange Grünfeld centre", moves: "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Rb1 O-O Be2", text: "White's centre (c3, d4, e4) against Black's pressure from g7 and c5." },
    ],
    lines: [
      { id: "gr-exchange-rb1", name: "Exchange, 8.Rb1", eco: "D85", kind: "main", moves: "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Rb1 O-O Be2 cxd4 cxd4 Qa5+ Bd2 Qxa2 O-O", note: "The modern main line: White gives the a-pawn for development and central control." },
      { id: "gr-exchange-bc4", name: "Exchange, Classical (Bc4 and Ne2)", eco: "D86", kind: "main", moves: "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Bc4 c5 Ne2 Nc6 Be3 O-O O-O", note: "The classic Spassky line. Ne2 supports d4 and avoids pins." },
      { id: "gr-russian", name: "Russian System (5.Qb3)", eco: "D97", kind: "main", moves: "d4 Nf6 c4 g6 Nc3 d5 Nf3 Bg7 Qb3 dxc4 Qxc4 O-O e4 a6 Be2 b5 Qb3 c5", note: "White takes on c4 with the queen; Black's ...a6 and ...b5 gain time." },
      { id: "gr-bf4", name: "5.Bf4", eco: "D82", kind: "side", moves: "d4 Nf6 c4 g6 Nc3 d5 Bf4 Bg7 e3 c5 dxc5 Qa5 Rc1 dxc4 Bxc4 O-O Nf3 Qxc5", note: "A solid line for White. Black regains the pawn and develops." },
      { id: "gr-g3", name: "Fianchetto (3.g3)", eco: "D79", kind: "side", moves: "d4 Nf6 c4 g6 g3 d5 Bg2 Bg7 Nf3 O-O O-O c6 cxd5 cxd5", note: "A positional line: both bishops on the long diagonals." },
    ],
    traps: [],
  },
  {
    slug: "benoni", name: "Modern Benoni", short: "Benoni", family: "1.d4", side: "black", level: "Advanced", ecoRange: "A56–A79",
    summary: "After ...c5 and d5, Black trades on d5 and gets a queenside pawn majority, an open e-file and a strong g7 bishop, at the cost of a weak d6 pawn and less space. It is sharp and unbalanced, a favourite of Tal and Fischer.",
    goodFor: "Aggressive Black players who want imbalance and winning chances against 1.d4.",
    ideas: [
      "Black's majority on the queenside (a, b, c pawns) advances with ...a6 and ...b5.",
      "The g7 bishop and the e-file are Black's main assets.",
      "White plans e4–e5 or f4–e5 to break through in the centre.",
    ],
    plans: [
      { side: "White", points: ["Stop ...b5 with a4.", "Prepare e5 with f4 or Nd2–c4.", "Use the d6 weakness."] },
      { side: "Black", points: ["Play ...a6 and ...b5.", "Use e5 and the e-file for pieces.", "Knight route ...Na6–c7 supports ...b5."] },
    ],
    structures: [
      { name: "Benoni structure", moves: "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 Nf3 Bg7 Be2 O-O O-O Re8", text: "White has a central majority (e4, d5), Black a queenside majority (a7, b7, c5). Both sides race to push their majority." },
    ],
    lines: [
      { id: "bn-classical", name: "Classical (Nf3, Be2)", eco: "A79", kind: "main", moves: "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 Nf3 Bg7 Be2 O-O O-O Re8 Nd2 Na6 f3 Nc7", note: "White's Nd2–c4 targets d6; Black prepares ...b5." },
      { id: "bn-fianchetto", name: "Fianchetto (g3)", eco: "A64", kind: "main", moves: "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 Nf3 g6 g3 Bg7 Bg2 O-O O-O a6 a4 Nbd7 Nd2 Re8", note: "A positional line. White's g2 bishop restricts Black's play." },
      { id: "bn-taimanov", name: "Taimanov (f4 and Bb5+)", eco: "A67", kind: "side", moves: "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 f4 Bg7 Bb5+ Nfd7 a4", note: "The most dangerous line for Black. White aims for e5." },
      { id: "bn-czech", name: "Czech Benoni (...e5)", eco: "A56", kind: "side", moves: "d4 Nf6 c4 c5 d5 e5 Nc3 d6 e4 Be7 Nf3 O-O Be2", note: "A closed version. Black plays slowly on the kingside with ...Ne8 and ...f5." },
    ],
    traps: [
      { name: "Taimanov: 8...Bd7?", kind: "mistake", moves: "d4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 f4 Bg7 Bb5+ Bd7 e5", text: "In the Taimanov line, blocking the check with the bishop lets White play e5 at once and break through. Black must block with 8...Nfd7." },
    ],
  },
  {
    slug: "benko", name: "Benko Gambit", short: "Benko", family: "1.d4", side: "black", level: "Intermediate", ecoRange: "A57–A59",
    summary: "Black gives a queenside pawn with 3...b5 to open the a- and b-files for the rooks and the g7 bishop. Black's pressure lasts deep into the endgame, so the gambit is a long-term investment.",
    goodFor: "Positional players with Black who like long-term pressure rather than quick tactics.",
    ideas: [
      "After ...b5 and ...a6, the a- and b-files open for Black's rooks.",
      "The g7 bishop hits the a1–h8 diagonal and the b2 pawn.",
      "Black's pressure often wins the pawn back in the endgame.",
    ],
    plans: [
      { side: "White", points: ["Keep the extra pawn and consolidate: g3, Bg2, O-O or Kf1–g2.", "Play e4–e5 to open the centre.", "Defend the queenside with Nd2–c4 and Rb1."] },
      { side: "Black", points: ["...Bxa6, ...g6, ...Bg7, ...O-O, ...Nbd7, ...Qa5, ...Rfb8.", "Press on a2 and b2.", "Use the Nb6/Ne5 squares."] },
    ],
    structures: [
      { name: "Benko pressure", moves: "d4 Nf6 c4 c5 d5 b5 cxb5 a6 bxa6 g6 Nc3 Bxa6 e4 Bxf1 Kxf1 d6 Nf3 Bg7 g3 O-O Kg2 Nbd7", text: "White is a pawn up; Black's rooks will use the open a- and b-files." },
    ],
    lines: [
      { id: "bk-accepted", name: "Accepted, e4 and Kxf1", eco: "A59", kind: "main", moves: "d4 Nf6 c4 c5 d5 b5 cxb5 a6 bxa6 g6 Nc3 Bxa6 e4 Bxf1 Kxf1 d6 Nf3 Bg7 g3 O-O Kg2 Nbd7", note: "White gives up castling but tucks the king on g2." },
      { id: "bk-fianchetto", name: "Accepted, fianchetto", eco: "A58", kind: "main", moves: "d4 Nf6 c4 c5 d5 b5 cxb5 a6 bxa6 Bxa6 Nc3 d6 Nf3 g6 g3 Bg7 Bg2 O-O O-O Nbd7", note: "White castles normally; Black presses with ...Qa5 and ...Rfb8." },
      { id: "bk-b6", name: "5.b6", eco: "A57", kind: "side", moves: "d4 Nf6 c4 c5 d5 b5 cxb5 a6 b6 Qxb6 Nc3 d6 e4 g6 Nf3 Bg7", note: "White gives back the pawn to avoid the open files." },
      { id: "bk-nf3", name: "4.Nf3", eco: "A57", kind: "side", moves: "d4 Nf6 c4 c5 d5 b5 Nf3 bxc4 Nc3 g6 e4 d6 Bxc4 Bg7", note: "White declines and develops quickly." },
    ],
    traps: [],
  },
  {
    slug: "dutch", name: "Dutch Defence", short: "Dutch", family: "1.d4", side: "black", level: "Intermediate", ecoRange: "A80–A99",
    summary: "1...f5 fights for e4 from the side and prepares a kingside attack. Black can choose the Leningrad (...g6), the Stonewall (...e6 and ...d5) or the Classical (...e6 and ...d6).",
    goodFor: "Fighting players who want unbalanced positions and kingside attacking chances with Black.",
    ideas: [
      "...f5 controls e4 and opens the f-file for Black's rook.",
      "Stonewall: pawns on c6, d5, e6, f5 make a fortress; the knight goes to e4.",
      "Leningrad: ...g6, ...Bg7 and ...d6 with ...e5 later, like a King's Indian.",
    ],
    plans: [
      { side: "White", points: ["Fianchetto with g3 and Bg2 to fight for e4.", "Against the Stonewall, trade dark bishops (Bf4 or Ba3) and use e5.", "Break with e4 to open the centre."] },
      { side: "Black", points: ["Put a knight on e4.", "Attack on the kingside with ...Qe8–h5 and ...g5.", "In the Leningrad, prepare ...e5."] },
    ],
    structures: [
      { name: "Stonewall", moves: "d4 f5 g3 Nf6 Bg2 e6 Nf3 d5 O-O Bd6 c4 c6 b3 Qe7 Bb2 O-O", text: "A solid pawn wall. The e5 hole is White's target; e4 is Black's outpost." },
    ],
    lines: [
      { id: "du-leningrad", name: "Leningrad", eco: "A88", kind: "main", moves: "d4 f5 g3 Nf6 Bg2 g6 Nf3 Bg7 O-O O-O c4 d6 Nc3 c6 d5 e5", note: "Black plays a King's Indian with ...f5 included." },
      { id: "du-stonewall", name: "Stonewall", eco: "A90", kind: "main", moves: "d4 f5 g3 Nf6 Bg2 e6 Nf3 d5 O-O Bd6 c4 c6 b3 Qe7 Bb2 O-O", note: "A solid setup with clear plans for both sides." },
      { id: "du-classical", name: "Classical (...e6 and ...d6)", eco: "A97", kind: "side", moves: "d4 f5 c4 Nf6 g3 e6 Bg2 Be7 Nf3 O-O O-O d6 Nc3 Qe8", note: "Black's queen goes to h5 for a kingside attack." },
      { id: "du-staunton", name: "Staunton Gambit (2.e4)", eco: "A83", kind: "side", moves: "d4 f5 e4 fxe4 Nc3 Nf6 Bg5 Nc6 d5 Ne5 Qd4 Nf7", note: "White gives a pawn for fast development." },
    ],
    traps: [
      { name: "Bishop mate on g6", kind: "mistake", moves: "d4 f5 Bg5 h6 Bh4 g5 Bg3 f4 e3 h5 Bd3 Rh6 Qxh5+ Rxh5 Bg6#", text: "Black's pawn rush on the kingside opens the e8–h5 diagonal. After 6...Rh6?? White sacrifices the queen and mates with Bg6." },
    ],
  },
  {
    slug: "budapest", name: "Budapest Gambit", short: "Budapest", family: "1.d4", side: "black", level: "Beginner", ecoRange: "A51–A52",
    summary: "After 1.d4 Nf6 2.c4, Black plays 2...e5 and offers a pawn. Black usually wins it back with ...Ng4, ...Nc6 and ...Bb4+, getting active pieces. A great surprise weapon with lots of tricks.",
    goodFor: "Club players who want an aggressive, low-theory answer to 1.d4 2.c4.",
    ideas: [
      "After 3.dxe5 Ng4, Black attacks e5 with ...Nc6 and ...Qe7 and usually wins it back.",
      "...Bb4+ develops with check; ...Qe7 adds pressure on e5.",
      "Watch for the Kieninger trap: a pinned e2 pawn cannot take a knight on d3.",
    ],
    plans: [
      { side: "White", points: ["Keep the extra pawn for a while with Bf4 and Nf3.", "Or give it back for development (e4 lines).", "Watch the e1–h4 diagonal and the e-file."] },
      { side: "Black", points: ["Win the e5 pawn back with ...Nc6 and ...Qe7.", "Develop fast and castle.", "Use the Rook lift ...Ra6–h6 in some lines."] },
    ],
    structures: [
      { name: "Rubinstein line", moves: "d4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 e3 Ngxe5 Nxe5 Nxe5 Be2 O-O O-O", text: "Black has won the pawn back; the game is balanced, with Black's pieces active." },
    ],
    lines: [
      { id: "bu-rubinstein", name: "Rubinstein (4.Bf4)", eco: "A52", kind: "main", moves: "d4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 e3 Ngxe5 Nxe5 Nxe5 Be2 O-O O-O", note: "The main line. Black regains the pawn with good development." },
      { id: "bu-nf3", name: "4.Nf3", eco: "A52", kind: "main", moves: "d4 Nf6 c4 e5 dxe5 Ng4 Nf3 Bc5 e3 Nc6 Be2 Ngxe5 Nxe5 Nxe5 O-O O-O", note: "White develops simply; Black recovers the pawn." },
      { id: "bu-e4", name: "Alekhine (4.e4)", eco: "A52", kind: "side", moves: "d4 Nf6 c4 e5 dxe5 Ng4 e4 Nxe5 f4 Nec6 Be3 Bb4+ Nc3 Qe7", note: "White builds a big centre; Black attacks it with pieces." },
      { id: "bu-fajarowicz", name: "Fajarowicz (3...Ne4)", eco: "A51", kind: "side", moves: "d4 Nf6 c4 e5 dxe5 Ne4 Nf3 Nc6 a3 d6 Qc2 d5", note: "A trickier, less sound version of the gambit." },
    ],
    traps: [
      { name: "Kieninger Trap", kind: "trap", moves: "d4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 a3 Ngxe5 axb4 Nd3#", text: "If White takes the bishop with axb4??, ...Nd3 is mate: the e2 pawn cannot capture because it is pinned by the queen on e7." },
    ],
  },
  {
    slug: "reti", name: "Réti Opening", short: "Réti", family: "1.Nf3", side: "white", level: "Intermediate", ecoRange: "A04–A09, A11–A14",
    summary: "1.Nf3 and 2.c4 attack Black's centre from the side instead of occupying it. White fianchettoes and keeps options open, often transposing to English or Catalan structures.",
    goodFor: "Flexible, positional White players who like to avoid main-line theory.",
    ideas: [
      "White controls the centre with pieces and the c4 pawn, not with d4 and e4.",
      "Both bishops often go on the long diagonals (g2 and b2).",
      "If Black pushes ...d4, White attacks it with e3 and b4.",
    ],
    plans: [
      { side: "White", points: ["g3, Bg2, O-O, b3 and Bb2.", "Hit d5 with c4 and cxd5.", "Against ...d4, play e3 and b4."] },
      { side: "Black", points: ["Hold the centre with ...d5 and ...e6, or ...c6.", "Develop the c8 bishop before ...e6.", "Use ...d4 to gain space."] },
    ],
    structures: [
      { name: "Double fianchetto", moves: "Nf3 d5 c4 e6 g3 Nf6 Bg2 Be7 O-O O-O b3 c5 Bb2 Nc6 e3", text: "White's bishops on b2 and g2 bear down on the centre from long range." },
    ],
    lines: [
      { id: "re-main", name: "Réti with b3 and Bb2", eco: "A14", kind: "main", moves: "Nf3 d5 c4 e6 g3 Nf6 Bg2 Be7 O-O O-O b3 c5 Bb2 Nc6 e3", note: "The classical Réti setup: pieces control the centre." },
      { id: "re-c6", name: "Against ...c6 and ...Bf5", eco: "A12", kind: "main", moves: "Nf3 d5 c4 c6 b3 Nf6 g3 Bf5 Bg2 e6 O-O Nbd7 Bb2 h6 d3", note: "A Slav-like setup for Black. White plays slowly." },
      { id: "re-dxc4", name: "Réti Gambit accepted", eco: "A09", kind: "side", moves: "Nf3 d5 c4 dxc4 e3 Nf6 Bxc4 e6 O-O c5 b3 Nc6 Bb2", note: "White regains the pawn with good development." },
      { id: "re-d4", name: "Advance (2...d4)", eco: "A09", kind: "side", moves: "Nf3 d5 c4 d4 b4 g6 Bb2 Bg7 e3 c5", note: "Black gains space; White attacks the d4 pawn." },
    ],
    traps: [],
  },
  {
    slug: "bird", name: "Bird's Opening", short: "Bird", family: "1.f4", side: "white", level: "Beginner", ecoRange: "A02–A03",
    summary: "1.f4 controls e5 and prepares a kingside setup, like a Dutch Defence with an extra move. White often plays Nf3, e3, b3, Bb2 and Be2 with a kingside attack.",
    goodFor: "White players who want an unusual, attacking system.",
    ideas: [
      "f4 controls e5; White's knight often goes to e5.",
      "The b2 bishop and the f-file aim at Black's king.",
      "Know From's Gambit (1...e5): it is Black's sharpest try.",
    ],
    plans: [
      { side: "White", points: ["Nf3, e3, b3, Bb2, Be2, O-O.", "Knight to e5, then Qe1–h4 or Rf3.", "Against From's Gambit, play 4.Nf3."] },
      { side: "Black", points: ["Fianchetto on g7 to hit b2.", "Fight for e5 with ...Nc6 and ...d6.", "From's Gambit: ...e5 for quick play against White's king."] },
    ],
    structures: [
      { name: "Bird with b3", moves: "f4 d5 Nf3 Nf6 e3 g6 b3 Bg7 Bb2 O-O Be2 c5 O-O Nc6", text: "White's dark bishop and f-pawn control e5. Black's g7 bishop challenges the long diagonal." },
    ],
    lines: [
      { id: "bi-main", name: "1...d5 with b3", eco: "A03", kind: "main", moves: "f4 d5 Nf3 Nf6 e3 g6 b3 Bg7 Bb2 O-O Be2 c5 O-O Nc6", note: "The main Bird setup. Both sides fight for e5 and the long diagonal." },
      { id: "bi-leningrad", name: "Leningrad style (g3)", eco: "A03", kind: "main", moves: "f4 d5 Nf3 g6 g3 Bg7 Bg2 Nf6 O-O O-O d3 c5", note: "White plays a reversed Leningrad Dutch." },
      { id: "bi-from", name: "From's Gambit (1...e5)", eco: "A02", kind: "side", moves: "f4 e5 fxe5 d6 exd6 Bxd6 Nf3 g5", note: "Black gives a pawn for fast attack against White's king. 4.Nf3 is the safe answer." },
      { id: "bi-c5", name: "1...c5", eco: "A02", kind: "side", moves: "f4 c5 Nf3 Nc6 e3 g6 Bb5 Bg7 O-O", note: "A reversed Grand Prix Sicilian setup." },
    ],
    traps: [
      { name: "From's Gambit mate", kind: "mistake", moves: "f4 e5 fxe5 d6 exd6 Bxd6 Nc3 Qh4+ g3 Qxg3+ hxg3 Bxg3#", text: "Against From's Gambit, 4.Nc3?? loses at once: ...Qh4+ and ...Qxg3+ open White's king and ...Bxg3 is mate. Play 4.Nf3 to cover h4." },
    ],
  },
  {
    slug: "kings-indian-attack", name: "King's Indian Attack", short: "KIA", family: "1.Nf3", side: "white", level: "Beginner", ecoRange: "A07–A08",
    summary: "A system for White: Nf3, g3, Bg2, O-O, d3, Nbd2 and e4. The same setup works against many defences. Fischer used it to win many attacking games, often with e5 and a kingside attack.",
    goodFor: "Players who want one setup with clear plans and little theory.",
    ideas: [
      "Same development every game: Nf3, g3, Bg2, O-O, d3, Nbd2, e4.",
      "After e4–e5, White attacks on the kingside with h4, Nf1–h2–g4 and Bf4.",
      "Black often plays on the queenside with ...b5 and ...a5.",
    ],
    plans: [
      { side: "White", points: ["Push e5 to gain space and attack the king.", "Knight route Nbd2–f1–h2–g4.", "h4–h5 to open lines."] },
      { side: "Black", points: ["Expand on the queenside: ...b5, ...a5, ...b4.", "Take space with ...d5 and ...c5.", "Break with ...f6 against the e5 pawn."] },
    ],
    structures: [
      { name: "KIA with e5 (against the French)", moves: "e4 e6 d3 d5 Nd2 Nf6 Ngf3 c5 g3 Nc6 Bg2 Be7 O-O O-O Re1 b5 e5 Nd7", text: "White's e5 pawn cramps Black's kingside. A race: White attacks the king, Black the queenside." },
    ],
    lines: [
      { id: "kia-nf3", name: "1.Nf3 move order", eco: "A07", kind: "main", moves: "Nf3 d5 g3 Nf6 Bg2 c6 O-O Bg4 d3 Nbd7 Nbd2 e5 e4", note: "White builds the KIA against ...d5 and ...c6." },
      { id: "kia-french", name: "Against the French", eco: "A08", kind: "main", moves: "e4 e6 d3 d5 Nd2 Nf6 Ngf3 c5 g3 Nc6 Bg2 Be7 O-O O-O Re1 b5 e5 Nd7", note: "The classic KIA structure with the e5 wedge. By transposition this is filed as a Réti/KIA (A08), not a French." },
      { id: "kia-sicilian", name: "Against the Sicilian", eco: "A08", kind: "side", moves: "e4 c5 Nf3 e6 d3 Nc6 g3 d5 Nbd2 Nf6 Bg2 Be7 O-O O-O Re1", note: "The same setup works against ...e6 Sicilians, and transposes to the same A08 position type." },
      { id: "kia-caro", name: "Against the Caro-Kann", eco: "B10", kind: "side", moves: "e4 c6 d3 d5 Nd2 e5 Ngf3 Bd6 g3 Nf6 Bg2 O-O O-O", note: "Black takes space with ...e5; White plays for d4 or b4 later." },
    ],
    traps: [],
  },
];
