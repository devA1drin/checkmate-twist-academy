import type { Lesson } from "./lesson-types";

/**
 * Cube curriculum. Every algorithm shown here is parsed and checked against the cube model by
 * `npm run verify:content` (e.g. last-layer algorithms must preserve the first two layers).
 */
export const CUBE_LESSONS: Lesson[] = [
  {
    slug: "notation", title: "Cube Notation", level: "Beginner", module: "Foundations", minutes: 8,
    summary: "Read any algorithm: face turns, primes, doubles, slices, wide moves and rotations.",
    sections: [
      { heading: "Face turns", p: ["Each letter names a face: **U**p, **D**own, **R**ight, **L**eft, **F**ront, **B**ack. A letter alone means a 90° **clockwise** turn as if you were looking straight at that face.", "A prime (**R'**) means counter-clockwise, and a **2** (R2) means a half turn (180°)."] },
      { heading: "Slices, wide moves and rotations", list: [
        "**M** – middle slice between L and R, turns like L. **E** – between U and D, turns like D. **S** – between F and B, turns like F.",
        "**Wide moves** (r, u, f… or Rw, Uw, Fw…) turn the face together with the adjacent middle slice.",
        "**x, y, z** rotate the whole cube like R, U and F respectively.",
      ] },
      { heading: "Try it", p: ["Open the simulator and press keys on your keyboard: R turns the right face, Shift+R turns it counter-clockwise."], algs: [{ alg: "R U R' U'", label: "The 'sexy move' — the most common trigger in cubing. Six repetitions return the cube to solved." }], links: [{ href: "/cube/simulator", label: "Open the 3D simulator" }] },
    ],
  },
  {
    slug: "beginner-method", title: "Beginner Method (Layer by Layer)", level: "Beginner", module: "Beginner Method", minutes: 25,
    summary: "Solve the cube for the first time with seven steps and a handful of short algorithms.",
    videos: ["7Ron6MN45LY"],
    sections: [
      { heading: "Step 1 – White cross", p: ["Hold white on top. Bring each white edge next to the white center so its side color also matches the side center. This step is intuitive — no algorithm needed."] },
      { heading: "Step 2 – White corners", p: ["Find a white corner in the bottom layer, place it below its target spot (front-right), then repeat the trigger below until it is solved with white on top. Repeat for all four corners."], algs: [{ alg: "R U R' U'", label: "With white on top and the corner in the bottom layer directly below its slot (front-right), repeat until the corner is solved — at most 5 repetitions." }] },
      { heading: "Step 3 – Middle-layer edges", p: ["Turn the cube over so white is on the bottom. Find a top-layer edge without yellow, match its front color to a center, then insert it to the right or to the left."],
        algs: [{ alg: "U R U' R' U' F' U F", label: "Insert the edge to the right." }, { alg: "U' L' U L U F U' F'", label: "Insert the edge to the left." }] },
      { heading: "Step 4 – Yellow cross", p: ["With yellow on top you will see a dot, an L-shape, or a line. Hold an L at the back-left or a line horizontally and apply the algorithm; repeat until you have a cross."], algs: [{ alg: "F R U R' U' F'", label: "Dot → L → line → cross." }] },
      { heading: "Step 5 – Yellow edges", p: ["Turn U until two edges match their centers. Hold the two matched edges at the back and on the right and apply the algorithm. If the matched edges are opposite each other, apply it once from any side and look again."], algs: [{ alg: "R U R' U R U2 R' U", label: "Sune + U: swaps the front and left edges; back and right edges stay solved (corners are fixed in steps 6–7)." }] },
      { heading: "Step 6 – Position the yellow corners", p: ["Find a corner already in its correct location (colors match, possibly twisted), hold it at front-right, and cycle the other three."], algs: [{ alg: "U R U' L' U R' U' L", label: "Cycles three corners, keeps the front-right one." }] },
      { heading: "Step 7 – Orient the yellow corners", p: ["Hold the cube with an unsolved corner at front-right. Repeat R' D' R D until that corner shows yellow on top, then turn **only U** to bring the next unsolved corner to front-right. The lower layers look scrambled mid-way — they fix themselves at the end."], algs: [{ alg: "R' D' R D", label: "Repeat 2 or 4 times per corner." }] },
    ],
  },
  {
    slug: "cfop-overview", title: "CFOP Overview", level: "Intermediate", module: "CFOP", minutes: 8,
    summary: "Cross, F2L, OLL, PLL — the method used by most world-class speedcubers.",
    sections: [
      { heading: "The four steps", ordered: [
        "**Cross** – solve four bottom edges (usually white) in at most 8 moves, planned during inspection.",
        "**F2L** (First Two Layers) – pair each bottom corner with its middle edge and insert the pair: four pairs.",
        "**OLL** (Orient Last Layer) – make the top face one color: 57 cases (or 2-look: 10 algorithms).",
        "**PLL** (Permute Last Layer) – move the top pieces into place: 21 cases (or 2-look: 6 algorithms).",
      ], p: ["A typical learning path: beginner method → intuitive F2L → 2-look OLL/PLL → full PLL → full OLL."] },
      { heading: "Explore the cases", links: [{ href: "/cube/algorithms", label: "Open the algorithm library (57 OLL + 21 PLL)" }, { href: "/cube/timer", label: "Track progress with the timer" }] },
    ],
  },
  {
    slug: "cross", title: "CFOP Step 1: The Cross", level: "Intermediate", module: "CFOP", minutes: 10,
    summary: "Plan the whole cross in 15 seconds of inspection and solve it on the bottom.",
    sections: [
      { heading: "Solve it on the bottom", p: ["Beginners solve the cross on top; speedcubers solve it on the **bottom** so they can look straight into F2L without a cube rotation. Any cross can be solved in **8 moves or fewer**; most take 5–7."] },
      { heading: "Plan in inspection", list: [
        "Locate all four white edges and decide which to solve first.",
        "Solve edges **relative to each other**; the whole cross can be aligned with one D-layer turn at the end.",
        "Avoid moves that break edges you already placed — use D-layer turns to move them out of the way.",
        "Practice: plan the full cross during inspection, then execute it blindfolded in your head.",
      ] },
    ],
  },
  {
    slug: "f2l", title: "CFOP Step 2: F2L", level: "Intermediate", module: "CFOP", minutes: 18,
    summary: "Pair corners with edges and insert them — intuitively first, algorithms later.",
    videos: ["Ar_Zit1VLG0", "3B_oB2YrLvk"],
    sections: [
      { heading: "The idea", p: ["Each F2L 'slot' is a white corner plus its matching middle-layer edge. Pair them in the top layer, then insert the pair with a short trigger. Doing this intuitively saves ~20 moves over the beginner method."] },
      { heading: "Basic inserts", algs: [{ alg: "U R U' R'", label: "Pair formed in the U layer; insert to the right.", diagram: "F2L" }, { alg: "R U R'", label: "Pair directly above the slot.", diagram: "F2L" }, { alg: "F' U' F", label: "Pair facing front.", diagram: "F2L" }] },
      { heading: "Common cases", algs: [{ alg: "U' R U R' U2 R U' R'", label: "Corner and edge separated in U.", diagram: "F2L" }, { alg: "R U' R' U R U' R'", label: "Edge solved in slot, corner on top.", diagram: "F2L" }], links: [{ href: "/cube/algorithms", label: "More F2L cases in the library" }] },
      { heading: "Getting faster", list: ["Avoid cube rotations — use the back slots with R/L moves.", "Look ahead: while inserting a pair, track where the next pair is.", "Solve slowly with zero pauses before trying to turn fast."] },
    ],
  },
  {
    slug: "oll", title: "CFOP Step 3: OLL (2-look and full)", level: "Intermediate", module: "CFOP", minutes: 15,
    summary: "Orient the last layer: start with 2-look OLL, then learn the 57 cases.",
    videos: ["6PSBaxlBqRg"],
    sections: [
      { heading: "2-look OLL — edges first", p: ["First make a yellow cross (3 algorithms), then orient the corners (7 OCLL algorithms)."],
        algs: [{ alg: "F R U R' U' F'", label: "Line → cross (hold the line horizontally).", diagram: "OLL" }, { alg: "f R U R' U' f'", label: "L-shape → cross (hold the L at back-left).", diagram: "OLL" }, { alg: "F R U R' U' F' f R U R' U' f'", label: "Dot → cross.", diagram: "OLL" }] },
      { heading: "2-look OLL — corners (OCLL)", algs: [
        { alg: "R U R' U R U2 R'", label: "Sune (OLL 27)", diagram: "OLL" }, { alg: "R U2 R' U' R U' R'", label: "Antisune (OLL 26)", diagram: "OLL" },
        { alg: "R U2 R' U' R U R' U' R U' R'", label: "H (OLL 21)", diagram: "OLL" }, { alg: "R U2 R2 U' R2 U' R2 U2 R", label: "Pi (OLL 22)", diagram: "OLL" },
        { alg: "R2 D' R U2 R' D R U2 R", label: "Headlights (OLL 23)", diagram: "OLL" }, { alg: "r U R' U' r' F R F'", label: "Chameleon (OLL 24)", diagram: "OLL" },
        { alg: "F' r U R' U' r' F R", label: "Bowtie (OLL 25)", diagram: "OLL" },
      ], links: [{ href: "/cube/algorithms", label: "All 57 OLL cases" }] },
    ],
  },
  {
    slug: "pll", title: "CFOP Step 4: PLL (2-look and full)", level: "Intermediate", module: "CFOP", minutes: 15,
    summary: "Permute the last layer: 6 algorithms for 2-look, 21 for full PLL.",
    videos: ["f_Yor-ydZjs"],
    sections: [
      { heading: "2-look PLL — corners", p: ["Look for 'headlights' (two matching corner stickers on one side). If you find them, put them at the back and do a T-perm-style swap (or an A-perm); if there are none, use the diagonal swap (Y-perm)."],
        algs: [{ alg: "R U R' U' R' F R2 U' R' U' R U R' F'", label: "T perm — adjacent corner swap (+ edges)", diagram: "PLL" }, { alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", label: "Y perm — diagonal corner swap", diagram: "PLL" }] },
      { heading: "2-look PLL — edges", algs: [
        { alg: "R U' R U R U R U' R' U' R2", label: "Ua perm", diagram: "PLL" }, { alg: "R2 U R U R' U' R' U' R' U R'", label: "Ub perm", diagram: "PLL" },
        { alg: "M2 U M2 U2 M2 U M2", label: "H perm", diagram: "PLL" }, { alg: "M' U M2 U M2 U M' U2 M2", label: "Z perm", diagram: "PLL" },
      ], links: [{ href: "/cube/algorithms", label: "All 21 PLL cases" }] },
    ],
  },
  {
    slug: "roux", title: "The Roux Method", level: "Advanced", module: "Alternative Methods", minutes: 14,
    summary: "Block-building with heavy M-slice use — very efficient (~45 moves).",
    videos: ["ilkF7cxQV2o"],
    sections: [
      { heading: "Steps", ordered: [
        "**First block** – a 1×2×3 block on the left (intuitive).",
        "**Second block** – a matching 1×2×3 block on the right, built with R, r, U and M moves.",
        "**CMLL** – solve the four top corners without caring about the M slice (42 algorithms; beginners can use 2-look with OLL/PLL corner algs).",
        "**LSE** (Last Six Edges) – orient edges, solve UL/UR, then finish the M slice.",
      ] },
      { heading: "Why Roux?", p: ["Roux averages roughly 45 moves (CFOP ~55–60), needs few algorithms, and leaves the last step to fast M-slice turning. The trade-off is that block-building takes more planning and lookahead."], algs: [{ alg: "M' U M'", label: "Typical LSE edge-orientation sequence." }] },
    ],
  },
  {
    slug: "zz", title: "The ZZ Method", level: "Advanced", module: "Alternative Methods", minutes: 12,
    summary: "Orient all edges first, then solve F2L using only R, U and L turns.",
    videos: ["Q9f-uHyHeQs"],
    sections: [
      { heading: "Steps", ordered: [
        "**EOLine** (or EOCross) – orient all 12 edges and place the DF and DB edges.",
        "**F2L** – build both sides with only **R, U, L** moves (no F/B needed, no rotations).",
        "**Last layer** – edges are already oriented, so OLL is one of the 7 OCLL cases + PLL, or COLL + EPLL, or ZBLL for 1-look last layer.",
      ] },
      { heading: "Edge orientation", p: ["An edge is 'good' if it can be solved using only R, L, U and D turns. F or B quarter turns flip the four edges of that face — that is how bad edges are fixed during EOLine."], algs: [{ alg: "F R U R' U' F'", label: "Shows how F/F' turns change edge orientation." }] },
    ],
  },
  {
    slug: "petrus", title: "The Petrus Method", level: "Advanced", module: "Alternative Methods", minutes: 10,
    summary: "Lars Petrus's block-building method — great for learning intuitive solving.",
    sections: [
      { heading: "Steps", ordered: [
        "Build a **2×2×2** block.",
        "Expand it to a **2×2×3** block.",
        "**Orient the remaining edges** (fix 'bad' edges).",
        "**Finish the first two layers** using only R and U turns.",
        "**Last layer** – e.g. OCLL + PLL, COLL + EPLL, or ZBLL.",
      ], p: ["Petrus was designed for efficiency (about 45–50 moves with good block-building) and heavily influenced later methods such as ZZ."] },
    ],
  },
  {
    slug: "other-puzzles", title: "Other Puzzles: 2×2, Pyraminx, Skewb, 4×4, Megaminx", level: "Beginner", module: "Other Puzzles", minutes: 12,
    summary: "How your 3×3 skills carry over to other WCA puzzles.",
    videos: ["GANnG5a19kg", "sCJcd6FKWAc"],
    sections: [
      { heading: "2×2", p: ["A 2×2 is a 3×3 without edges and centers. Beginners solve one layer with R U R' U', then use corner algorithms from the 3×3 last layer. Speed methods: **Ortega** (face, OLL, PBL), **CLL** and **EG**."], algs: [{ alg: "R U R' U R U2 R'", label: "Sune also orients 2×2 last-layer corners." }] },
      { heading: "Pyraminx", p: ["Turn the four tips first (trivial), then solve the three centers around one tip, then a 'V' of edges and the last edges — usually under 15 moves. Advanced methods include L4E and top-first."] },
      { heading: "Skewb", p: ["The Skewb turns around its corners. Common methods solve the first layer and then the remaining centers and corners; good solutions are often under 12 moves."] },
      { heading: "4×4 and bigger", p: ["**Reduction:** solve the centers, pair the edges, then solve like a 3×3. Even-layered cubes can show **parity** cases (a single flipped edge or two swapped edges) that need special algorithms."] },
      { heading: "Megaminx", p: ["A 12-sided puzzle solved like a big layer-by-layer 3×3: a star, then F2L-like pairs face by face, ending with a last layer (2-look OLL/PLL)."] },
    ],
  },
];
