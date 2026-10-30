import type { Lesson } from "./lesson-types";

/**
 * Chess curriculum. All positions (FEN) and move sequences (SAN) are validated with chess.js
 * by `npm run verify:content`; endgame verdicts were checked with Stockfish 19.
 */
export const CHESS_LESSONS: Lesson[] = [
  {
    slug: "rules-and-pieces", title: "The Board, the Pieces and How They Move", level: "Beginner", module: "Fundamentals", minutes: 12,
    summary: "Set up the board, learn how every piece moves and captures, and the standard piece values.",
    videos: ["OCSbzArwB10"],
    sections: [
      { heading: "The board", p: ["Chess is played on an 8×8 board of 64 squares. Columns are called **files** (a–h) and rows are **ranks** (1–8). Place the board so each player has a **light square in the right-hand corner**.", "White's pieces start on ranks 1–2 and Black's on ranks 7–8. White always moves first."],
        board: { caption: "Starting position. Remember: the queen starts on her own color (white queen on d1, a light square; black queen on d8, a dark square)." } },
      { heading: "How the pieces move", list: [
        "**King** – one square in any direction. It may never move into check.",
        "**Queen** – any number of squares along ranks, files and diagonals.",
        "**Rook** – any number of squares along ranks and files.",
        "**Bishop** – any number of squares diagonally; each bishop stays on one color.",
        "**Knight** – in an L-shape (two squares one way, one square sideways). It is the only piece that jumps over others.",
        "**Pawn** – moves straight forward one square (two from its starting square) but **captures diagonally** one square forward.",
      ] },
      { heading: "Piece values", p: ["A widely used guide to material: pawn = 1, knight = 3, bishop = 3, rook = 5, queen = 9. The king is priceless — losing it loses the game. These numbers are guidelines; activity and position matter too."],
        board: { fen: "8/8/8/3N4/8/8/8/k1K5 w - - 0 1", caption: "Explore: a knight in the center controls 8 squares. Try moving it — it always lands on a square of the opposite color." } },
    ],
  },
  {
    slug: "special-moves", title: "Special Moves: Castling, En Passant, Promotion", level: "Beginner", module: "Fundamentals", minutes: 10,
    summary: "The three special rules every player must know.",
    sections: [
      { heading: "Castling", p: ["Castling moves the king two squares toward a rook and puts that rook on the square the king crossed. It is legal only if neither piece has moved, the squares between them are empty, the king is not in check, and the king does not pass through or land on an attacked square."],
        board: { moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "O-O"], caption: "Step through: White develops the knight and bishop, then castles kingside (O-O)." } },
      { heading: "En passant", p: ["If a pawn advances two squares from its starting square and lands beside an enemy pawn, that enemy pawn may capture it **as if it had moved only one square** — but only on the very next move."],
        board: { moves: ["e4", "Nf6", "e5", "d5", "exd6"], caption: "After 3...d5, White's e5-pawn captures en passant: exd6. The black pawn on d5 disappears." } },
      { heading: "Promotion", p: ["A pawn reaching the last rank must be promoted to a queen, rook, bishop or knight of the same color. Almost always you choose a queen."],
        board: { fen: "8/4P3/8/8/8/k7/8/4K3 w - - 0 1", moves: ["e8=Q"], caption: "The pawn on e7 promotes: e8=Q." } },
    ],
  },
  {
    slug: "checkmate-basics", title: "Check, Checkmate and Stalemate", level: "Beginner", module: "Fundamentals", minutes: 10,
    summary: "How games end — and the traps beginners fall into.",
    sections: [
      { heading: "Check and checkmate", p: ["A king that is attacked is in **check**. You must get out of check by moving the king, blocking, or capturing the attacker. If no legal move escapes, it is **checkmate** and the game is over."] },
      { heading: "Fool's mate — the fastest checkmate", board: { moves: ["f3", "e5", "g4", "Qh4#"], caption: "White weakens the king's diagonal with f3 and g4; Black mates in two with Qh4#." } },
      { heading: "Scholar's mate — and how to defend it", board: { moves: ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"], caption: "The queen and bishop both hit f7. 3...Nf6?? allows Qxf7#. Correct is 3...g6 or 3...Qe7, defending f7." } },
      { heading: "Back-rank mate", board: { fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", moves: ["Rd8#"], caption: "Black's own pawns trap the king on the back rank: Rd8#. Making 'luft' (e.g. ...h6) prevents this." } },
      { heading: "Stalemate", p: ["If the player to move has **no legal moves** but is **not** in check, the game is a draw by stalemate. When you are winning, always make sure your opponent has a legal move!"],
        board: { fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1", caption: "Black to move is not in check but has no legal move: stalemate — a draw, despite White's extra queen." } },
    ],
  },
  {
    slug: "opening-principles", title: "Opening Principles", level: "Beginner", module: "Fundamentals", minutes: 10,
    summary: "Control the center, develop pieces, castle early — the ideas behind every good opening.",
    sections: [
      { heading: "Five principles", ordered: [
        "**Control the center** (e4, d4, e5, d5) with pawns and pieces.",
        "**Develop** knights and bishops quickly, usually knights before bishops.",
        "**Castle** early to keep your king safe and connect your rooks.",
        "**Don't move the same piece twice** without a good reason, and avoid early queen adventures.",
        "**Connect your rooks** and put them on open or half-open files.",
      ] },
      { heading: "A model opening", board: { moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O"], caption: "Italian Game (Giuoco Pianissimo): both sides fight for the center, develop and castle within six moves." } },
      { heading: "Punishing a broken principle", board: { moves: ["e4", "e5", "Qh5", "Nc6", "Bc4", "g6", "Qf3", "Nf6"], caption: "An early queen raid achieves nothing against accurate defence: Black develops with tempo while the queen retreats." } },
    ],
  },
  {
    slug: "open-games", title: "Open Games: Italian, Ruy Lopez, Scotch", level: "Intermediate", module: "Openings", minutes: 15,
    summary: "The classical answers to 1.e4 e5 with their real main-line move orders.",
    sections: [
      { heading: "Italian Game", p: ["White aims the bishop at f7 and plans c3 + d4 (or a slow d3 build-up)."], board: { moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4", "Bb4+"], caption: "Giuoco Piano main line: 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+." } },
      { heading: "Ruy Lopez (Spanish Game)", p: ["One of the oldest and most respected openings. White pressures the knight that defends e5."], board: { moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O"], caption: "Closed Ruy Lopez: 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 O-O." } },
      { heading: "Scotch Game", board: { moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nxc6", "bxc6", "e5"], caption: "Scotch, Mieses line: White opens the center immediately with 3.d4." } },
    ],
  },
  {
    slug: "semi-open-games", title: "Answering 1.e4: Sicilian, French, Caro-Kann", level: "Intermediate", module: "Openings", minutes: 15,
    summary: "Asymmetrical defences that fight for the center indirectly.",
    sections: [
      { heading: "Sicilian Defence – Najdorf", p: ["1...c5 trades a flank pawn for White's center pawn, creating imbalanced, fighting positions."], board: { moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], caption: "Open Sicilian, Najdorf Variation: 5...a6." } },
      { heading: "French Defence", board: { moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7"], caption: "French Classical: Black's solid but slightly passive light-squared bishop is the typical problem piece." } },
      { heading: "Caro-Kann Defence", board: { moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"], caption: "Caro-Kann Classical: Black develops the light-squared bishop before playing ...e6." } },
    ],
  },
  {
    slug: "closed-games", title: "1.d4 Openings: Queen's Gambit, King's Indian, London", level: "Intermediate", module: "Openings", minutes: 15,
    summary: "Queen-pawn structures and the plans that come with them.",
    sections: [
      { heading: "Queen's Gambit Declined", board: { moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6"], caption: "QGD, Tartakower Variation: Black keeps a pawn on d5 and develops harmoniously." } },
      { heading: "Queen's Gambit Accepted & Slav", boards: [
        { moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "e6", "Bxc4", "c5"], caption: "QGA: Black gives up the center temporarily; White regains the pawn with Bxc4." },
        { moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5"], caption: "Slav Defence main line: ...c6 supports d5 while keeping the c8-bishop free." },
      ] },
      { heading: "King's Indian Defence", board: { moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5", "O-O", "Nc6", "d5", "Ne7"], caption: "KID Classical: White plays on the queenside, Black typically attacks on the kingside with ...f5." } },
      { heading: "London System", board: { moves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "c5", "c3", "Nc6", "Nbd2", "Bd6", "Bg3", "O-O", "Bd3"], caption: "A solid system: bishop to f4 early, then the e3–c3 pawn triangle." } },
    ],
  },
  {
    slug: "tactics-motifs", title: "Tactics: Forks, Pins, Skewers & Discoveries", level: "Intermediate", module: "Tactics", minutes: 15,
    summary: "The core tactical patterns that win material.",
    sections: [
      { heading: "Fork", p: ["One piece attacks two (or more) targets at once. Knights are the classic forking piece."], board: { fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1", moves: ["Nc7+", "Kd7", "Nxa8"], caption: "Nc7+ forks king and rook; after the king moves, Nxa8 wins the rook." } },
      { heading: "Pin", p: ["A pinned piece cannot move without exposing a more valuable piece behind it. If that piece is the king, the pin is **absolute** and the pinned piece may not legally move."], board: { fen: "4k3/8/8/8/1b6/8/3N4/4K3 w - - 0 1", caption: "The bishop on b4 pins the d2-knight to the white king: the knight cannot move at all." } },
      { heading: "Skewer", p: ["The reverse of a pin: a valuable piece is attacked, and when it moves, the piece behind it is captured."], board: { fen: "7q/8/8/7k/8/1K6/8/R7 w - - 0 1", moves: ["Rh1+", "Kg6", "Rxh8"], caption: "Rh1+ skewers king and queen along the h-file." } },
      { heading: "Discovered attack & double check", p: ["Moving one piece unmasks an attack by another. When both pieces give check it is a **double check**, and the king must move — blocking or capturing cannot stop two checks."],
        board: { moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "Nc6", "Nxc6", "dxc6", "d3", "Bc5", "Bg5", "Nxe4", "Bxd8", "Bxf2+", "Ke2", "Bg4#"], caption: "Légal-style trap in the Petrov: Black lets the queen go and mates with the bishops and knight." } },
      { heading: "Practice", p: ["Recognising patterns comes from repetition. Solve real puzzles from the Lichess database filtered by theme in the Tactics Trainer."], links: [{ href: "/chess/puzzles", label: "Open the Tactics Trainer" }] },
    ],
  },
  {
    slug: "middlegame-plans", title: "Middlegame Plans & Pawn Structure", level: "Intermediate", module: "Middlegame", minutes: 15,
    summary: "How pawn structures tell you where to play.",
    videos: ["RUYbO35XVCE"],
    sections: [
      { heading: "Find a plan from the structure", list: [
        "**Open files** belong to rooks — double them and invade the 7th rank.",
        "**Outposts** are squares an enemy pawn can no longer attack; a knight there is often worth more than a rook.",
        "**Pawn breaks** (a pawn move that challenges the opponent's chain) are how you open lines where you are stronger.",
        "**Play where you have more space** — usually the side your pawn chain points toward.",
      ] },
      { heading: "Isolated queen's pawn (IQP)", p: ["An isolated d-pawn gives its owner active pieces and attacking chances, but it can become a weakness in the endgame. The side with the IQP usually attacks; the other side blockades on the square in front and trades pieces."],
        board: { moves: ["d4", "d5", "c4", "e6", "Nc3", "c5", "cxd5", "exd5", "Nf3", "Nc6", "g3", "Nf6", "Bg2", "Be7", "O-O", "O-O", "dxc5", "Bxc5"], caption: "Tarrasch Defence: Black accepts an isolated d5-pawn in return for free piece play. White will blockade d4 and pressure d5." } },
      { heading: "Pawn chains", p: ["Attack a pawn chain at its **base**. In the French Advance, White's chain points to the kingside while Black strikes the base with ...c5 and ...f6."],
        board: { moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6"], caption: "French Advance: Black pressures d4, the base of White's chain." } },
    ],
  },
  {
    slug: "advanced-strategy", title: "Advanced Strategy: Minority Attack & Bad Bishops", level: "Advanced", module: "Middlegame", minutes: 15,
    summary: "Long-term plans used by masters: creating weaknesses and improving the worst piece.",
    sections: [
      { heading: "The minority attack", p: ["In the Carlsbad structure (QGD Exchange), White advances the b-pawn (b4–b5) against Black's queenside majority to create a weak, backward c-pawn or an isolated d-pawn."],
        board: { moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "Be7", "e3", "c6", "Qc2", "Nbd7", "Bd3", "O-O", "Nge2", "Re8", "O-O", "Nf8", "Rab1", "a5", "a3", "Ng6", "b4", "axb4", "axb4"], caption: "QGD Exchange: after Rab1, a3 and b4, White prepares b5 to fix a weakness on c6." } },
      { heading: "Good and bad bishops", p: ["A bishop blocked by its own pawns on the same color is 'bad'. Improve it by trading it, rerouting it outside the pawn chain, or changing the pawn structure.", "**Prophylaxis** — asking 'what does my opponent want?' before every move — is the habit that separates strong players from tactical ones."] },
      { heading: "Analyse your own games", p: ["Load your games into the analysis board and let Stockfish show where the evaluation swung. Focus on the first big mistake, not every inaccuracy."], links: [{ href: "/chess/analysis", label: "Open the Analysis Board" }] },
    ],
  },
  {
    slug: "basic-checkmates", title: "Basic Checkmates: K+Q vs K and K+R vs K", level: "Beginner", module: "Endgames", minutes: 12,
    summary: "Mate the lone king — then prove it against Stockfish.",
    sections: [
      { heading: "Queen and king vs king", p: ["Use the queen to shrink the king's box (a knight's move away is a handy pattern), bring your king up, and deliver mate on the edge. **Watch out for stalemate** — always leave the enemy king a move until the final blow."],
        board: { fen: "8/8/8/4k3/8/8/8/4K2Q w - - 0 1", caption: "White wins in at most 10 moves with correct technique.", practice: { label: "Practice K+Q vs K vs Stockfish", level: 8 } } },
      { heading: "Rook and king vs king", p: ["The rook cuts the king off along a rank or file; your king takes the **opposition**, then a rook check pushes the defending king back one rank at a time until mate on the edge."],
        board: { fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1", caption: "K+R vs K is always a win (at most 16 moves).", practice: { label: "Practice K+R vs K vs Stockfish", level: 8 } } },
    ],
  },
  {
    slug: "king-and-pawn", title: "King & Pawn Endgames: Opposition and Key Squares", level: "Intermediate", module: "Endgames", minutes: 15,
    summary: "The foundation of every endgame: opposition, key squares and the rule of the square.",
    videos: ["mCsc24k-Q8M"],
    sections: [
      { heading: "The opposition", p: ["Kings stand in **opposition** when they face each other with one square between them. The side **not** to move 'has the opposition' and the other king must give way."],
        boards: [
          { fen: "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1", caption: "White to move: Black has the opposition and draws with correct play (Stockfish: 0.00)." },
          { fen: "8/8/4k3/8/4K3/4P3/8/8 b - - 0 1", caption: "Same position, Black to move: Black must give way, White's king reaches a key square and wins.", practice: { label: "Win this as White vs Stockfish", level: 8 } },
        ] },
      { heading: "Key squares", p: ["For a pawn not on the a- or h-file that has not crossed the middle of the board, the key squares are the three squares two ranks in front of it. If the attacking king reaches one, the pawn promotes no matter who is to move."],
        board: { fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", caption: "King on the 6th rank in front of its pawn: White wins whoever moves (Stockfish confirms)." } },
      { heading: "Rule of the square", p: ["Draw a square from the pawn to its promotion rank. If the defending king can step into that square, it catches the pawn; otherwise the pawn queens."] },
    ],
  },
  {
    slug: "rook-endgames", title: "Rook Endgames: Lucena and Philidor", level: "Advanced", module: "Endgames", minutes: 18,
    summary: "The two positions every serious player must know.",
    videos: ["YxoYYGHjveo", "yrdgbB_dhg0"],
    sections: [
      { heading: "Lucena position — winning", p: ["The attacking king sits on the queening square in front of its pawn on the 7th rank and the defending king is cut off. The winning method is **building a bridge**: bring the rook to the 4th rank so it can block the checks."],
        board: { fen: "4K3/4P1k1/8/8/8/8/3r4/5R2 w - - 0 1", moves: ["Rg1+", "Kh7", "Rg4", "Re2", "Kf7", "Rf2+", "Ke6", "Re2+", "Kf6", "Rf2+", "Ke5", "Re2+", "Re4"], caption: "1.Rg1+ Kh7 2.Rg4! — then the king walks out and the rook on the 4th rank shields it from checks (Stockfish: +6)." , practice: { label: "Convert the Lucena vs Stockfish", level: 8 } } },
      { heading: "Philidor position — drawing", p: ["The defender keeps the king on the queening square and the rook on its **third rank** (the 6th from White's side), stopping the enemy king from advancing. Once the pawn moves to the 6th, the rook drops to the first rank to check from behind."],
        board: { fen: "4k3/8/1r6/3KP3/8/8/8/7R b - - 0 1", caption: "Black to move holds the draw by keeping the rook on the 6th rank (Stockfish: 0.00).", practice: { label: "Try to break the Philidor as White", level: 8 } } },
    ],
  },
];
