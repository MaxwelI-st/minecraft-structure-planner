/**
 * scaffold.js — Survival Scaffolding Optimisation Engine
 *
 * Simulates Minecraft's scaffolding physics to generate the minimum set of
 * scaffold blocks needed to place every target block in Survival mode.
 *
 * Physics constants (02_TECHNICAL_REFERENCE §5-1):
 *   - Player reach: 4.5 blocks (Euclidean sphere from eye position at feet.y + 1.62)
 *   - Scaffolding horizontal stability: max 6 blocks from a supporting pillar
 *     (the 7th block falls, ignoring gravity)
 *
 * Algorithm (from 03_TODO §3-A):
 *   1. computeStandingPositions(targetBlocks) → Map<BlockCoord, Set<StandingCoord>>
 *   2. greedy coverage: iterate Y-descending, find standing positions covering
 *      the most uncovered blocks per pillar
 *   3. generatePillar(groundY, standingY, x, z) → scaffold Set
 *   4. branchHorizontal(pillar, Set, ≤6 blocks) → extend coverage
 *   5. deadZoneDetection: any target not covered → insert new pillar
 *   6. output: Set<Coord3D> + ordered build sequence
 *
 * Safe for Web Worker — zero DOM dependencies.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Player reach in blocks (Euclidean distance from eye to block centre). */
const PLAYER_REACH = 4.5;

/** Player eye height above feet position. */
const EYE_HEIGHT = 1.62;

/** Scaffolding: maximum horizontal distance from a supporting pillar before collapse. */
const MAX_SCAFFOLD_HORIZONTAL = 6;

/** Cardinal horizontal directions for scaffold branch extension. */
const CARDINAL = [[1,0],[0,1],[-1,0],[0,-1]];

// ─────────────────────────────────────────────────────────────────────────────
// Coord helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Encode a 3D integer coordinate to a string key for use in Sets/Maps. */
const key3 = (x, y, z) => `${x},${y},${z}`;

/** Decode a string key back to [x, y, z]. */
const decode3 = k => k.split(',').map(Number);

/** Euclidean distance squared between two 3D points. */
const dist2 = (ax, ay, az, bx, by, bz) =>
  (ax-bx)**2 + (ay-by)**2 + (az-bz)**2;

// ─────────────────────────────────────────────────────────────────────────────
// computeStandingPositions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For each target block, compute all valid standing positions from which
 * the player can interact with (place/break) that block.
 *
 * A standing position (sx, sy, sz) is valid for target block (bx, by, bz) when:
 *   dist(blockCentre, eyePosition) ≤ PLAYER_REACH
 * where:
 *   blockCentre  = (bx + 0.5, by + 0.5, bz + 0.5)
 *   eyePosition  = (sx + 0.5, sy + EYE_HEIGHT, sz + 0.5)
 *
 * Search radius: ceil(PLAYER_REACH) blocks in all directions.
 * Only horizontal plane positions are tested (standing on solid ground level).
 *
 * @param {Array<[number,number,number]>} targetBlocks - Array of [x, y, z]
 * @param {number} groundY - The Y level of the ground / scaffold base
 * @returns {Map<string, Set<string>>} blockKey → Set of standingCoord keys
 */
export function computeStandingPositions(targetBlocks, groundY = 0) {
  /** @type {Map<string, Set<string>>} */
  const standingMap = new Map();
  const R = Math.ceil(PLAYER_REACH);
  const REACH_SQ = PLAYER_REACH * PLAYER_REACH;

  // Build a Set of target block positions so we can exclude them from candidate
  // standing positions: a player can't stand inside a solid block (e.g. a wall
  // of the structure being built). Also exclude positions where the player's
  // head/body would intersect a target block (sy+1, sy+2).
  const targetSet = new Set(targetBlocks.map(([x, y, z]) => key3(x, y, z)));

  for (const [bx, by, bz] of targetBlocks) {
    const bKey = key3(bx, by, bz);
    const validStanding = new Set();

    // Block centre
    const bcx = bx + 0.5, bcy = by + 0.5, bcz = bz + 0.5;

    // Test all positions within a bounding cube of radius R
    for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++)
    for (let dz = -R; dz <= R; dz++) {
      const sx = bx + dx, sy = by + dy, sz = bz + dz;
      if (sy < groundY) continue; // can't stand underground

      // The standing position itself must not be a target block (you stand
      // on top of (sx,sy,sz), so it acts as the floor — but if it's already
      // a wall of the structure, you can't replace it with scaffolding).
      // Player body occupies (sx, sy+1, sz) and (sx, sy+2, sz) — these must
      // be free of target blocks too.
      if (targetSet.has(key3(sx,     sy,     sz))) continue;
      if (targetSet.has(key3(sx, sy + 1, sz))) continue;
      if (targetSet.has(key3(sx, sy + 2, sz))) continue;

      // Eye position (centre of standing block + eye height)
      const ex = sx + 0.5, ey = sy + EYE_HEIGHT, ez = sz + 0.5;

      if (dist2(bcx, bcy, bcz, ex, ey, ez) <= REACH_SQ) {
        validStanding.add(key3(sx, sy, sz));
      }
    }

    standingMap.set(bKey, validStanding);
  }

  return standingMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateScaffold
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate the minimum scaffold block set to cover all target blocks.
 *
 * @param {Map<string, Set<string>>} standingMap - From computeStandingPositions()
 * @param {number}                   groundY     - Y level of the solid ground
 * @param {object}                   [opts]
 * @param {boolean} [opts.verbose=false] - Include per-pillar debug info in result
 * @returns {{
 *   scaffoldBlocks: Set<string>,       - Coord keys of all scaffold placements
 *   buildSequence:  Array<string>,     - Ordered list: pillar-first, then branches
 *   pillars:        Array<{x,z,topY}>, - Pillar locations for UI overlay
 *   uncoveredCount: number,            - Blocks that could not be reached (error case)
 *   stats: { pillarCount, branchCount, totalBlocks }
 * }}
 */
export function generateScaffold(standingMap, groundY = 0, opts = {}) {
  const scaffoldBlocks = new Set();
  const buildSequence  = [];
  const pillars        = [];

  /** Remaining uncovered target blocks (as coord key strings). */
  const uncovered = new Set(standingMap.keys());

  // ── Step 1: Build "standingCoord → Set<blockKey>" reverse index ───────────
  // Allows us to find, for any standing position, how many target blocks it covers.
  const standingToBlocks = new Map();
  for (const [bKey, standingSet] of standingMap) {
    for (const sKey of standingSet) {
      if (!standingToBlocks.has(sKey)) standingToBlocks.set(sKey, new Set());
      standingToBlocks.get(sKey).add(bKey);
    }
  }

  // ── Step 2: Iterate until all target blocks are covered ───────────────────
  let iterations = 0;
  const MAX_ITER = standingMap.size * 4 + 100; // safety limit

  while (uncovered.size > 0 && iterations++ < MAX_ITER) {

    // ── 2a: Find the best standing position (greedy: covers most uncovered) ─
    let bestStandingKey = null;
    let bestCoverCount  = 0;

    for (const [sKey, coveredBlocks] of standingToBlocks) {
      let count = 0;
      for (const bKey of coveredBlocks) {
        if (uncovered.has(bKey)) count++;
      }
      if (count > bestCoverCount) {
        bestCoverCount  = count;
        bestStandingKey = sKey;
      }
    }

    if (!bestStandingKey || bestCoverCount === 0) break; // no progress — dead zone

    const [sx, sy, sz] = decode3(bestStandingKey);

    // ── 2b: Build a vertical pillar from groundY to sy ────────────────────
    const pillarBlocks = _buildPillar(sx, sy, sz, groundY);
    const pillarSeq    = [];

    for (const pKey of pillarBlocks) {
      if (!scaffoldBlocks.has(pKey)) {
        scaffoldBlocks.add(pKey);
        pillarSeq.push(pKey);
      }
    }

    buildSequence.push(...pillarSeq);
    pillars.push({ x: sx, z: sz, topY: sy });

    // Mark blocks covered by this standing position as done
    const coveredByThis = standingToBlocks.get(bestStandingKey) ?? new Set();
    for (const bKey of coveredByThis) {
      uncovered.delete(bKey);
    }

    // ── 2c: Extend horizontal branches to cover adjacent uncovered blocks ──
    const branchBlocks = _extendBranches(sx, sy, sz, uncovered, standingMap, scaffoldBlocks);
    for (const bk of branchBlocks) {
      buildSequence.push(bk);
    }

    // Remove blocks covered by branch standing positions
    for (const bk of branchBlocks) {
      const [bsx, bsy, bsz] = decode3(bk);
      // The standing position for a branch-accessible block is the block itself
      // (player stands on the scaffold and reaches down/sideways)
      const branchStandKey = key3(bsx, bsy, bsz);
      const branchCovers   = standingToBlocks.get(branchStandKey);
      if (branchCovers) {
        for (const bKey of branchCovers) uncovered.delete(bKey);
      }
    }
  }

  // ── Step 3: Dead zone detection — remaining uncovered blocks ─────────────
  let deadZoneAttempts = 0;
  while (uncovered.size > 0 && deadZoneAttempts++ < uncovered.size + 10) {
    // Pick any remaining uncovered block and force a new pillar nearest to it
    const bKey          = uncovered.values().next().value;
    const [bx, by, bz]  = decode3(bKey);
    const standingSet   = standingMap.get(bKey);

    if (!standingSet || standingSet.size === 0) {
      uncovered.delete(bKey); // unreachable by design — skip
      continue;
    }

    // Find the standing position closest to an existing pillar (or the block itself)
    let closestStanding = null;
    let closestDist     = Infinity;

    for (const sKey of standingSet) {
      const [sx, , sz] = decode3(sKey);
      let minPillarDist = Infinity;
      for (const p of pillars) {
        const d = (sx - p.x) ** 2 + (sz - p.z) ** 2;
        if (d < minPillarDist) minPillarDist = d;
      }
      if (minPillarDist < closestDist) {
        closestDist     = minPillarDist;
        closestStanding = sKey;
      }
    }

    if (!closestStanding) { uncovered.delete(bKey); continue; }

    const [sx, sy, sz] = decode3(closestStanding);
    const newPillar    = _buildPillar(sx, sy, sz, groundY);
    for (const pk of newPillar) {
      if (!scaffoldBlocks.has(pk)) {
        scaffoldBlocks.add(pk);
        buildSequence.push(pk);
      }
    }
    pillars.push({ x: sx, z: sz, topY: sy });

    const coveredByNew = standingToBlocks.get(closestStanding) ?? new Set();
    for (const bKey2 of coveredByNew) uncovered.delete(bKey2);
  }

  const pillarCount  = pillars.length;
  const branchCount  = scaffoldBlocks.size - pillarCount * 1; // approximation
  const totalBlocks  = scaffoldBlocks.size;

  return {
    scaffoldBlocks,
    buildSequence,
    pillars,
    uncoveredCount: uncovered.size,
    stats: { pillarCount, branchCount, totalBlocks },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a vertical scaffold pillar from groundY up to standingY at (sx, sz).
 * Returns an ordered Set of coord keys (bottom to top — must be placed in this order).
 *
 * @param {number} sx
 * @param {number} sy - Top of pillar (standing Y)
 * @param {number} sz
 * @param {number} groundY
 * @returns {Array<string>} Ordered bottom-to-top coord keys
 */
function _buildPillar(sx, sy, sz, groundY) {
  const blocks = [];
  for (let y = groundY; y <= sy; y++) {
    blocks.push(key3(sx, y, sz));
  }
  return blocks;
}

/**
 * Extend horizontal branches from a pillar top position to cover nearby
 * uncovered target blocks, respecting the 6-block horizontal stability limit.
 *
 * Returns the array of branch scaffold coord keys added (in placement order).
 *
 * @param {number}           px         - Pillar top X
 * @param {number}           py         - Pillar top Y (branch Y level)
 * @param {number}           pz         - Pillar top Z
 * @param {Set<string>}      uncovered  - Still-uncovered target block keys
 * @param {Map}              standingMap
 * @param {Set<string>}      existing   - Already-placed scaffold keys (mutated)
 * @returns {Array<string>}
 */
function _extendBranches(px, py, pz, uncovered, standingMap, existing) {
  const added = [];

  // BFS outward from pillar top, up to MAX_SCAFFOLD_HORIZONTAL steps
  const queue = [{ x: px, y: py, z: pz, dist: 0 }];
  const visited = new Set([key3(px, py, pz)]);

  while (queue.length > 0) {
    const { x, y, z, dist } = queue.shift();
    if (dist >= MAX_SCAFFOLD_HORIZONTAL) continue;

    for (const [dx, dz] of CARDINAL) {
      const nx = x + dx, nz = z + dz;
      const nKey = key3(nx, y, nz);

      if (visited.has(nKey)) continue;
      visited.add(nKey);

      // Does placing scaffold here cover any uncovered target block?
      const standingKey = key3(nx, y, nz);
      const covers = standingMap
        ? [...(standingMap.get(standingKey) ?? [])]
            .filter(bk => uncovered.has(bk))
        : [];

      // Only place scaffold when it actually covers an uncovered target.
      // BFS continues regardless so we can reach further targets via empty air.
      if (covers.length > 0 && !existing.has(nKey)) {
        existing.add(nKey);
        added.push(nKey);
      }

      queue.push({ x: nx, y, z: nz, dist: dist + 1 });
    }
  }

  return added;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full pipeline entry point (used by process.worker.js SCAFFOLD_GEN handler)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * High-level API: given a list of target block coordinates and the ground Y,
 * return the complete scaffold placement data.
 *
 * @param {Array<[number,number,number]>} targetBlocks
 * @param {number} groundY
 * @returns {{
 *   scaffoldBlocks: Array<[number,number,number]>,
 *   buildSequence:  Array<[number,number,number]>,
 *   pillars:        Array<{x,z,topY}>,
 *   uncoveredCount: number,
 *   stats: object
 * }}
 */
export function planScaffolding(targetBlocks, groundY = 0) {
  if (!targetBlocks || targetBlocks.length === 0) {
    return {
      scaffoldBlocks: [],
      buildSequence:  [],
      pillars:        [],
      uncoveredCount: 0,
      stats: { pillarCount: 0, branchCount: 0, totalBlocks: 0 },
    };
  }

  const standingMap = computeStandingPositions(targetBlocks, groundY);
  const result      = generateScaffold(standingMap, groundY);

  // Scaffold positions that overlap with the structure itself are physically
  // impossible (the player can't place scaffolding into a wall). The structure
  // wall already acts as scaffolding in those slots, so we just drop them.
  const targetSet = new Set(targetBlocks.map(([x, y, z]) => key3(x, y, z)));
  const isTarget  = (k) => targetSet.has(k);

  // Convert Set<string> to Array<[x,y,z]> for serialisation, filtering out
  // any scaffold positions that overlap with the original target structure.
  const toCoordArray = (set) =>
    [...set]
      .filter(k => !isTarget(k))
      .map(k => /** @type {[number,number,number]} */ (decode3(k)));

  const filteredBlocks   = toCoordArray(result.scaffoldBlocks);
  const filteredSequence = result.buildSequence
    .filter(k => !isTarget(k))
    .map(k => decode3(k));

  return {
    scaffoldBlocks: filteredBlocks,
    buildSequence:  filteredSequence,
    pillars:        result.pillars,
    uncoveredCount: result.uncoveredCount,
    stats: {
      ...result.stats,
      totalBlocks: filteredBlocks.length,
    },
  };
}
