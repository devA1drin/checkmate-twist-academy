/**
 * Algorithm library. Algorithms are the commonly published speedcubing main-line algorithms
 * (standard OLL/PLL numbering & names as used across the speedcubing community, e.g. the
 * SpeedSolving wiki and J Perm's sheets). Every algorithm is machine-verified by
 * `npm run verify:algs` (scripts/verify-algs.ts): F2L preserved, correct step solved,
 * and the 57 OLL / 21 PLL cases are pairwise distinct.
 */
export type AlgSet = "OLL" | "PLL" | "F2L";
export interface AlgCase {
  id: string;
  set: AlgSet;
  name: string;
  group: string;
  alg: string;
  alts?: string[];
  probability?: string;
  notes?: string;
}

const oll = (n: number, group: string, alg: string, name?: string, alts?: string[]): AlgCase => ({
  id: `oll-${n}`, set: "OLL", name: name ? `OLL ${n} – ${name}` : `OLL ${n}`, group, alg, alts,
});

export const OLL: AlgCase[] = [
  oll(1, "Dot", "R U2 R2 F R F' U2 R' F R F'"),
  oll(2, "Dot", "F R U R' U' F' f R U R' U' f'"),
  oll(3, "Dot", "f R U R' U' f' U' F R U R' U' F'"),
  oll(4, "Dot", "f R U R' U' f' U F R U R' U' F'"),
  oll(5, "Square", "r' U2 R U R' U r"),
  oll(6, "Square", "r U2 R' U' R U' r'"),
  oll(7, "Small Lightning", "r U R' U R U2 r'"),
  oll(8, "Small Lightning", "l' U' L U' L' U2 l"),
  oll(9, "Fish", "R U R' U' R' F R2 U R' U' F'"),
  oll(10, "Fish", "R U R' U R' F R F' R U2 R'"),
  oll(11, "Small Lightning", "r U R' U R' F R F' R U2 r'"),
  oll(12, "Small Lightning", "M' R' U' R U' R' U2 R U' M"),
  oll(13, "Knight Move", "F U R U' R2 F' R U R U' R'"),
  oll(14, "Knight Move", "R' F R U R' F' R F U' F'"),
  oll(15, "Knight Move", "r' U' r R' U' R U r' U r"),
  oll(16, "Knight Move", "r U r' R U R' U' r U' r'"),
  oll(17, "Dot", "R U R' U R' F R F' U2 R' F R F'"),
  oll(18, "Dot", "r U R' U R U2 r2 U' R U' R' U2 r"),
  oll(19, "Dot", "M U R U R' U' M' R' F R F'"),
  oll(20, "Dot", "r U R' U' M2 U R U' R' U' M'"),
  oll(21, "OCLL (Cross)", "R U2 R' U' R U R' U' R U' R'", "H"),
  oll(22, "OCLL (Cross)", "R U2 R2 U' R2 U' R2 U2 R", "Pi"),
  oll(23, "OCLL (Cross)", "R2 D' R U2 R' D R U2 R", "Headlights"),
  oll(24, "OCLL (Cross)", "r U R' U' r' F R F'", "Chameleon"),
  oll(25, "OCLL (Cross)", "F' r U R' U' r' F R", "Bowtie"),
  oll(26, "OCLL (Cross)", "R U2 R' U' R U' R'", "Antisune"),
  oll(27, "OCLL (Cross)", "R U R' U R U2 R'", "Sune"),
  oll(28, "Corners Oriented", "r U R' U' r' R U R U' R'"),
  oll(29, "Awkward", "R U R' U' R U' R' F' U' F R U R'"),
  oll(30, "Awkward", "F R' F R2 U' R' U' R U R' F2"),
  oll(31, "P Shape", "R' U' F U R U' R' F' R"),
  oll(32, "P Shape", "L U F' U' L' U L F L'"),
  oll(33, "T Shape", "R U R' U' R' F R F'"),
  oll(34, "C Shape", "R U R2 U' R' F R U R U' F'"),
  oll(35, "Fish", "R U2 R2 F R F' R U2 R'"),
  oll(36, "W Shape", "L' U' L U' L' U L U L F' L' F"),
  oll(37, "Fish", "F R' F' R U R U' R'"),
  oll(38, "W Shape", "R U R' U R U' R' U' R' F R F'"),
  oll(39, "Big Lightning", "L F' L' U' L U F U' L'"),
  oll(40, "Big Lightning", "R' F R U R' U' F' U R"),
  oll(41, "Awkward", "R U R' U R U2 R' F R U R' U' F'"),
  oll(42, "Awkward", "R' U' R U' R' U2 R F R U R' U' F'"),
  oll(43, "P Shape", "R' U' F' U F R"),
  oll(44, "P Shape", "F U R U' R' F'"),
  oll(45, "T Shape", "F R U R' U' F'"),
  oll(46, "C Shape", "R' U' R' F R F' U R"),
  oll(47, "Small L", "R' U' R' F R F' R' F R F' U R"),
  oll(48, "Small L", "F R U R' U' R U R' U' F'"),
  oll(49, "Small L", "r U' r2 U r2 U r2 U' r"),
  oll(50, "Small L", "r' U r2 U' r2 U' r2 U r'"),
  oll(51, "Line", "F U R U' R' U R U' R' F'"),
  oll(52, "Line", "R U R' U R U' B U' B' R'"),
  oll(53, "Small L", "r' U' R U' R' U R U' R' U2 r"),
  oll(54, "Small L", "r U R' U R U' R' U R U2 r'"),
  oll(55, "Line", "R' F R U R U' R2 F' R2 U' R' U R U R'"),
  oll(56, "Line", "r' U' r U' R' U R U' R' U R r' U r"),
  oll(57, "Corners Oriented", "R U R' U' M' U R U' r'"),
];

const pll = (id: string, name: string, group: string, alg: string, alts?: string[], probability?: string): AlgCase => ({
  id: `pll-${id.toLowerCase()}`, set: "PLL", name: `${id} Perm${name ? " – " + name : ""}`, group, alg, alts, probability,
});

export const PLL: AlgCase[] = [
  pll("Ua", "", "Edges only", "R U' R U R U R U' R' U' R2", ["M2 U M U2 M' U M2"], "1/18"),
  pll("Ub", "", "Edges only", "R2 U R U R' U' R' U' R' U R'", ["M2 U' M U2 M' U' M2"], "1/18"),
  pll("H", "", "Edges only", "M2 U M2 U2 M2 U M2", [], "1/72"),
  pll("Z", "", "Edges only", "M' U M2 U M2 U M' U2 M2", [], "1/36"),
  pll("Aa", "", "Corners only", "x R' U R' D2 R U' R' D2 R2 x'", [], "1/18"),
  pll("Ab", "", "Corners only", "x R2 D2 R U R' D2 R U' R x'", [], "1/18"),
  pll("E", "", "Corners only", "x' R U' R' D R U R' D' R U R' D R U' R' D' x", [], "1/36"),
  pll("T", "", "Adjacent corner swap", "R U R' U' R' F R2 U' R' U' R U R' F'", [], "1/18"),
  pll("F", "", "Adjacent corner swap", "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", [], "1/18"),
  pll("Ja", "", "Adjacent corner swap", "x R2 F R F' R U2 r' U r U2 x'", ["L' U' L F L' U' L U L F' L2 U L"], "1/18"),
  pll("Jb", "", "Adjacent corner swap", "R U R' F' R U R' U' R' F R2 U' R'", [], "1/18"),
  pll("Ra", "", "Adjacent corner swap", "R U' R' U' R U R D R' U' R D' R' U2 R'", [], "1/18"),
  pll("Rb", "", "Adjacent corner swap", "R2 F R U R U' R' F' R U2 R' U2 R", [], "1/18"),
  pll("Ga", "", "G perms", "R2 U R' U R' U' R U' R2 U' D R' U R D'", [], "1/18"),
  pll("Gb", "", "G perms", "R' U' R U D' R2 U R' U R U' R U' R2 D", [], "1/18"),
  pll("Gc", "", "G perms", "R2 U' R U' R U R' U R2 U D' R U' R' D", [], "1/18"),
  pll("Gd", "", "G perms", "R U R' U' D R2 U' R U' R' U R' U R2 D'", [], "1/18"),
  pll("V", "", "Diagonal corner swap", "R' U R' U' y R' F' R2 U' R' U R' F R F", [], "1/18"),
  pll("Y", "", "Diagonal corner swap", "F R U' R' U' R U R' F' R U R' U' R' F R F'", [], "1/18"),
  pll("Na", "", "Diagonal corner swap", "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'", [], "1/72"),
  pll("Nb", "", "Diagonal corner swap", "R' U R U' R' F' U' F R U R' F R' F' R U' R", [], "1/72"),
];

const f2l = (n: number, name: string, group: string, alg: string, notes?: string): AlgCase => ({
  id: `f2l-${n}`, set: "F2L", name: `F2L ${n} – ${name}`, group, alg, notes,
});

/** Basic F2L cases for the front-right slot (pair formed / easy inserts). */
export const F2L: AlgCase[] = [
  f2l(1, "Basic insert (right)", "Basic inserts", "U R U' R'", "Corner and edge are separated in the top layer; one trigger pairs and inserts them."),
  f2l(2, "Basic insert (left)", "Basic inserts", "y' U' L' U L", "Mirror of the basic insert, done in the back-left after a y' rotation."),
  f2l(3, "Basic insert (front)", "Basic inserts", "F' U' F", "Corner and edge form a pair facing front."),
  f2l(4, "Basic insert (right, 3 move)", "Basic inserts", "R U R'", "Paired corner+edge above the slot."),
  f2l(5, "Split pair: R U' R'", "Separated pieces", "U' R U R' U2 R U' R'"),
  f2l(6, "Split pair (mirror)", "Separated pieces", "U R U' R' U' F' U F"),
  f2l(7, "Corner up, edge in U", "Separated pieces", "U' R U2 R' U2 R U' R'"),
  f2l(8, "Corner up, edge in U (mirror)", "Separated pieces", "R U' R' U2 F' U' F"),
  f2l(9, "Pair connected wrongly", "Connected pieces", "R U2 R' U' R U R'"),
  f2l(10, "Corner in slot, edge in U", "Pieces in slot", "U R U' R' U' F' U F"),
  f2l(11, "Edge in slot, corner in U", "Pieces in slot", "R U' R' U R U' R'"),
  f2l(12, "Edge flipped in slot", "Pieces in slot", "R U' R' U F' U2 F U2 F' U F"),
];

export const ALL_ALGS: AlgCase[] = [...OLL, ...PLL, ...F2L];
