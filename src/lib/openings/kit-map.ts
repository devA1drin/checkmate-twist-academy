/**
 * Maps a lichess-org/chess-openings name to the opening kit that teaches it.
 * Rules are checked in order, so the more specific names come first.
 */
const RULES: [RegExp, string][] = [
  [/^Italian Game: Two Knights Defense/, "two-knights"],
  [/^Italian Game: Evans Gambit/, "evans-gambit"],
  [/^Italian Game/, "italian"],
  [/^Ruy Lopez/, "ruy-lopez"],
  [/^Scotch Game/, "scotch"],
  [/^Vienna (Game|Gambit)/, "vienna"],
  [/^King's Gambit/, "kings-gambit"],
  [/^Four Knights Game/, "four-knights"],
  [/^Petrov's Defense/, "petrov"],
  [/^Philidor Defense/, "philidor"],
  [/^Sicilian Defense: (Dragon|Accelerated Dragon|Hyperaccelerated Dragon)/, "sicilian-dragon"],
  [/^Sicilian Defense: (Lasker-Pelikan|Sveshnikov)/, "sveshnikov"],
  [/^Sicilian Defense: Taimanov/, "taimanov"],
  [/^Sicilian Defense: Kan/, "kan"],
  [/^Sicilian Defense: Alapin/, "alapin"],
  [/^Sicilian Defense: Smith-Morra/, "smith-morra"],
  [/^Sicilian Defense: (Closed|Grand Prix)/, "closed-sicilian"],
  [/^Sicilian Defense/, "sicilian"],
  [/^French Defense/, "french"],
  [/^Caro-Kann Defense/, "caro-kann"],
  [/^Pirc Defense/, "pirc"],
  [/^Modern Defense/, "modern-defence"],
  [/^Alekhine Defense/, "alekhine"],
  [/^Scandinavian Defense/, "scandinavian"],
  [/^Queen's Gambit Accepted/, "qga"],
  [/^Semi-Slav Defense/, "semi-slav"],
  [/^Slav Defense/, "slav"],
  [/^(Queen's Gambit Declined|Queen's Gambit|Tarrasch Defense)\b/, "queens-gambit"],
  [/^Catalan Opening/, "catalan"],
  [/London System/, "london"],
  [/Colle System/, "colle"],
  [/^Trompowsky Attack/, "trompowsky"],
  [/^Rapport-Jobava System/, "jobava-london"],
  [/^King's Indian Defense/, "kings-indian"],
  [/^Nimzo-Indian Defense/, "nimzo-indian"],
  [/^Queen's Indian Defense/, "queens-indian"],
  [/^Bogo-Indian Defense/, "bogo-indian"],
  [/^(Neo-)?Grünfeld Defense/, "grunfeld"],
  [/^Benko Gambit/, "benko"],
  [/^Benoni Defense/, "benoni"],
  [/^Dutch Defense/, "dutch"],
  [/Budapest (Gambit|Defense)/, "budapest"],
  [/^English Opening/, "english"],
  [/^Réti Opening/, "reti"],
  [/^Bird Opening/, "bird"],
  [/^King's Indian Attack/, "kings-indian-attack"],
];

export function kitForOpening(name: string): string | null {
  for (const [re, slug] of RULES) if (re.test(name)) return slug;
  return null;
}
