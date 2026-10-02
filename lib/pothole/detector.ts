import type { PotholeAnalysis, PotholeDetection, Severity } from "@/lib/types"

/**
 * On-device pothole detector (classical computer vision, no network).
 *
 * Real potholes aren't always darker than the road: they're often filled with gravel, muddy water
 * or loose soil. So instead of looking for "dark", we model what *this* road looks like and flag
 * regions that differ from it:
 *   1. Split the lower part of the frame into small blocks; measure brightness, colour and texture per block.
 *   2. Build a robust road model (median / MAD over all blocks): most of the frame is normal road.
 *   3. Flag blocks that are anomalous in brightness, colour or texture. Skip lane paint and vegetation.
 *   4. Group flagged blocks, fill enclosed holes (a dark rim around a lighter centre is a classic pothole),
 *      and score each group on anomaly strength, rim sharpness and compactness.
 *      Thin groups are reported as cracks; groups touching the frame edges are penalised (vignetting, kerbs).
 *
 * It is a fast, private first pass and can be fooled by shadows, stains and patches, so the UI labels
 * its output as an estimate and prefers the AI analysis when it is available.
 */

export interface RGBAImage {
  width: number
  height: number
  data: Uint8ClampedArray | Uint8Array
}

export interface DetectorOptions {
  /** Fraction of the image height, from the top, to ignore (sky, horizon, vehicles). */
  ignoreTop?: number
  /** Minimum confidence for a region to be reported. */
  minConfidence?: number
  /** Anomaly z-score above which a block counts as "not normal road". */
  threshold?: number
  /** Called for every candidate region with the reason it was kept or dropped (for tuning). */
  debug?: (region: { x: number; y: number; w: number; h: number; filled: number; fill: number; verdict: string; anomaly?: number; rim?: number; confidence?: number }) => void
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"]

interface Block {
  gray: number
  c1: number // red-green opponent channel
  c2: number // yellow-blue opponent channel
  texture: number // gray standard deviation inside the block
  sat: number
}

export function detectPotholes(img: RGBAImage, options: DetectorOptions = {}): PotholeAnalysis {
  const { width: w, height: h, data } = img
  const ignoreTop = options.ignoreTop ?? 0.2
  const minConfidence = options.minConfidence ?? 0.5

  // Block size scales with the image so behaviour is similar at any resolution (4 px at 320 px wide).
  const size = Math.max(2, Math.round(Math.max(w, h) / 80))
  const bw = Math.floor(w / size)
  const top = Math.floor((h * ignoreTop) / size)
  const bh = Math.floor(h / size)
  const rows = bh - top
  if (bw < 4 || rows < 4) return notRoad()

  // 1. Per-block features.
  const blocks: Block[] = new Array(bw * rows)
  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let r = 0, g = 0, b = 0, sum = 0, sumSq = 0, sat = 0
      for (let y = (by + top) * size; y < (by + top + 1) * size; y++) {
        for (let x = bx * size; x < (bx + 1) * size; x++) {
          const i = (y * w + x) * 4
          const R = data[i], G = data[i + 1], B = data[i + 2]
          const v = 0.299 * R + 0.587 * G + 0.114 * B
          r += R; g += G; b += B; sum += v; sumSq += v * v
          const max = Math.max(R, G, B)
          sat += max === 0 ? 0 : (max - Math.min(R, G, B)) / max
        }
      }
      const n = size * size
      const mean = sum / n
      blocks[by * bw + bx] = {
        gray: mean,
        c1: (r - g) / n,
        c2: ((r + g) / 2 - b) / n,
        texture: Math.sqrt(Math.max(0, sumSq / n - mean * mean)),
        sat: sat / n,
      }
    }
  }

  // Road surfaces are mostly unsaturated. Allow tinted asphalt and some leaves/soil in frame.
  const greyish = blocks.filter((k) => k.sat < 0.35).length / blocks.length
  if (greyish < 0.3) return notRoad()

  // 2. Robust road model.
  const model = {
    gray: robust(blocks.map((k) => k.gray), 6),
    c1: robust(blocks.map((k) => k.c1), 3),
    c2: robust(blocks.map((k) => k.c2), 3),
    texture: robust(blocks.map((k) => k.texture), 2.5),
  }

  // 3. Anomaly score per block.
  const score = new Float32Array(blocks.length)
  for (let i = 0; i < blocks.length; i++) {
    const k = blocks[i]
    const zGray = (k.gray - model.gray.median) / model.gray.sigma
    const isPaint = k.gray > model.gray.median + 40 && k.sat < 0.2 && k.gray > 170
    const isVegetation = k.sat > 0.3 && k.c1 < -8 && k.c2 > 0
    if (isPaint || isVegetation) continue
    score[i] = Math.max(
      zGray < 0 ? -zGray : 0.7 * zGray,
      Math.abs(k.c1 - model.c1.median) / model.c1.sigma,
      Math.abs(k.c2 - model.c2.median) / model.c2.sigma,
      0.8 * Math.abs(k.texture - model.texture.median) / model.texture.sigma,
    )
  }

  const threshold = options.threshold ?? 2.5
  const raw = new Uint8Array(blocks.length)
  for (let i = 0; i < blocks.length; i++) if (score[i] > threshold) raw[i] = 1

  // Majority filter: keep a block if most of its 3x3 neighbourhood is anomalous.
  const mask = new Uint8Array(blocks.length)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < bw; x++) {
      let on = 0, total = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= bw || ny >= rows) continue
          total++
          on += raw[ny * bw + nx]
        }
      }
      if (raw[y * bw + x] ? on * 2 > total : on * 3 > total * 2) mask[y * bw + x] = 1
    }
  }

  // Walls, kerbs and tree lines run across almost the whole frame at the top of the road area.
  // Peel off such rows (from the top only) so they don't merge with a pothole below them.
  for (let y = 0; y < rows; y++) {
    let on = 0
    for (let x = 0; x < bw; x++) on += mask[y * bw + x]
    if (on < bw * 0.8) break
    mask.fill(0, y * bw, (y + 1) * bw)
    raw.fill(0, y * bw, (y + 1) * bw)
  }

  // 4a. Cracks: long, thin anomalous lines. Checked on the unfiltered mask because the
  //     majority filter (rightly) erases one-block-wide lines.
  const crackLike = findRegions(raw, bw, rows).regions.filter((r) => {
    const boxW = r.maxX - r.minX + 1
    const boxH = r.maxY - r.minY + 1
    return Math.max(boxW, boxH) > bw * 0.15 && r.members.length < 0.5 * Math.max(boxW, boxH) * 3
  }).length

  // 4b. Potholes: compact regions in the filtered mask.
  const { labels, regions } = findRegions(mask, bw, rows)
  const potholes: PotholeDetection[] = []
  const totalBlocks = blocks.length

  for (const { label, members, minX, minY, maxX, maxY } of regions) {
    const boxW = maxX - minX + 1
    const boxH = maxY - minY + 1
    const filled = members.length + countHoles(labels, label, bw, minX, minY, maxX, maxY)
    const fill = filled / (boxW * boxH)
    const aspect = boxW / boxH
    const region = { x: minX, y: minY, w: boxW, h: boxH, filled, fill }

    if (aspect > 6 || aspect < 1 / 6 || fill < 0.3) {
      options.debug?.({ ...region, verdict: "thin" })
      continue
    }
    if (filled < Math.max(4, totalBlocks * 0.003) || filled > totalBlocks * 0.45) {
      options.debug?.({ ...region, verdict: "size" })
      continue
    }

    // Regions cut by the ignore line are usually background (horizon, vehicles, walls).
    const edgesTouched = Number(minY === 0) + Number(minX === 0) + Number(maxX === bw - 1) + Number(maxY === rows - 1)
    if (edgesTouched >= 2) {
      options.debug?.({ ...region, verdict: "edge" })
      continue
    }

    let anomaly = 0
    for (const i of members) anomaly += score[i]
    anomaly /= members.length
    const rim = rimContrast(blocks, labels, label, bw, rows, members)

    const anomalyScore = Math.min(1, (anomaly - threshold) / 6)
    const rimScore = Math.min(1, rim / (3 * model.gray.sigma))
    const shapeScore = Math.min(1, fill / 0.65)
    const confidence = 0.25 + 0.3 * anomalyScore + 0.25 * rimScore + 0.2 * shapeScore - 0.1 * edgesTouched
    options.debug?.({ ...region, verdict: confidence < minConfidence ? "low-confidence" : "pothole", anomaly, rim, confidence })
    if (confidence < minConfidence) continue

    potholes.push({
      box: { x: (minX * size) / w, y: ((minY + top) * size) / h, width: (boxW * size) / w, height: (boxH * size) / h },
      confidence: Math.round(Math.min(0.95, confidence) * 100) / 100,
      severity: severityFor(filled / totalBlocks, anomaly),
    })
  }

  potholes.sort((a, b) => b.confidence - a.confidence)
  const found = potholes.slice(0, 10)
  const overallSeverity = found.reduce<Severity | "none">(
    (worst, p) => (worst === "none" || SEVERITY_ORDER.indexOf(p.severity) > SEVERITY_ORDER.indexOf(worst) ? p.severity : worst),
    "none",
  )

  return {
    method: "on-device",
    isRoad: true,
    potholes: found,
    overallSeverity,
    summary:
      found.length === 0
        ? "No pothole-like regions found."
        : `Found ${found.length} pothole-like region${found.length > 1 ? "s" : ""}.`,
    otherIssues: crackLike > 0 ? ["Possible surface cracks"] : [],
  }
}

function notRoad(): PotholeAnalysis {
  return {
    method: "on-device",
    isRoad: false,
    potholes: [],
    overallSeverity: "none",
    summary: "This doesn't look like a road surface. Take a photo pointing down at the road.",
    otherIssues: [],
  }
}

function severityFor(areaFraction: number, anomaly: number): Severity {
  let level = areaFraction < 0.01 ? 0 : areaFraction < 0.04 ? 1 : areaFraction < 0.12 ? 2 : 3
  if (anomaly > 12 && level < 3) level++
  return SEVERITY_ORDER[level]
}

/** Median and MAD-based sigma, with a floor so near-uniform surfaces don't produce huge z-scores. */
function robust(values: number[], floor: number) {
  const sorted = [...values].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const deviations = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b)
  return { median, sigma: Math.max(floor, 1.4826 * deviations[Math.floor(deviations.length / 2)]) }
}

interface Region {
  label: number
  members: number[]
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 4-connected components of a binary grid. */
function findRegions(mask: Uint8Array, bw: number, rows: number) {
  const labels = new Int32Array(mask.length)
  const regions: Region[] = []
  const stack: number[] = []
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue
    const region: Region = { label: regions.length + 1, members: [], minX: bw, minY: rows, maxX: 0, maxY: 0 }
    labels[start] = region.label
    stack.push(start)
    while (stack.length) {
      const i = stack.pop()!
      region.members.push(i)
      const x = i % bw, y = (i - x) / bw
      region.minX = Math.min(region.minX, x)
      region.maxX = Math.max(region.maxX, x)
      region.minY = Math.min(region.minY, y)
      region.maxY = Math.max(region.maxY, y)
      for (const j of [x > 0 ? i - 1 : -1, x < bw - 1 ? i + 1 : -1, y > 0 ? i - bw : -1, y < rows - 1 ? i + bw : -1]) {
        if (j >= 0 && mask[j] && !labels[j]) {
          labels[j] = region.label
          stack.push(j)
        }
      }
    }
    regions.push(region)
  }
  return { labels, regions }
}

/** Unlabelled cells inside the bounding box that can't reach the box edge are holes enclosed by the region. */
function countHoles(labels: Int32Array, label: number, bw: number, minX: number, minY: number, maxX: number, maxY: number) {
  const boxW = maxX - minX + 1
  const boxH = maxY - minY + 1
  const outside = new Uint8Array(boxW * boxH)
  const queue: number[] = []
  const isFree = (x: number, y: number) => labels[(y + minY) * bw + x + minX] !== label
  for (let x = 0; x < boxW; x++) for (const y of [0, boxH - 1]) if (isFree(x, y) && !outside[y * boxW + x]) { outside[y * boxW + x] = 1; queue.push(y * boxW + x) }
  for (let y = 0; y < boxH; y++) for (const x of [0, boxW - 1]) if (isFree(x, y) && !outside[y * boxW + x]) { outside[y * boxW + x] = 1; queue.push(y * boxW + x) }
  while (queue.length) {
    const c = queue.pop()!
    const x = c % boxW, y = (c - x) / boxW
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= boxW || ny >= boxH) continue
      const j = ny * boxW + nx
      if (!outside[j] && isFree(nx, ny)) {
        outside[j] = 1
        queue.push(j)
      }
    }
  }
  let holes = 0
  for (let y = 0; y < boxH; y++) for (let x = 0; x < boxW; x++) if (isFree(x, y) && !outside[y * boxW + x]) holes++
  return holes
}

/** Mean absolute brightness step across the region boundary: potholes have a sharp edge. */
function rimContrast(blocks: Block[], labels: Int32Array, label: number, bw: number, rows: number, members: number[]) {
  let total = 0
  let count = 0
  for (const i of members) {
    const x = i % bw, y = (i - x) / bw
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= bw || ny >= rows) continue
      const j = ny * bw + nx
      if (labels[j] !== label) {
        total += Math.abs(blocks[i].gray - blocks[j].gray)
        count++
      }
    }
  }
  return count ? total / count : 0
}
