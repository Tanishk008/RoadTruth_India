import { describe, expect, it } from "vitest"
import { detectPotholes, type RGBAImage } from "@/lib/pothole/detector"

/** Deterministic PRNG so tests are stable. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

function road(width = 240, height = 180, seed = 1): RGBAImage {
  const rand = rng(seed)
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const v = 120 + (rand() - 0.5) * 20
    data.set([v, v + 2, v + 4, 255], i * 4)
  }
  return { width, height, data }
}

function paint(img: RGBAImage, inside: (x: number, y: number) => boolean, value: number) {
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (inside(x, y)) img.data.set([value, value, value + 2, 255], (y * img.width + x) * 4)
}

const ellipse = (cx: number, cy: number, rx: number, ry: number) => (x: number, y: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1

describe("detectPotholes", () => {
  it("finds nothing on clean road", () => {
    const result = detectPotholes(road())
    expect(result.isRoad).toBe(true)
    expect(result.potholes).toHaveLength(0)
    expect(result.overallSeverity).toBe("none")
  })

  it("detects a dark pothole and boxes it in the right place", () => {
    const img = road()
    paint(img, ellipse(120, 120, 22, 12), 45)
    const result = detectPotholes(img)
    expect(result.potholes).toHaveLength(1)
    const { box, confidence } = result.potholes[0]
    expect(confidence).toBeGreaterThanOrEqual(0.5)
    // Box should cover x 98-142 / 240 and y 108-132 / 180, within a few pixels.
    expect(box.x).toBeCloseTo(98 / 240, 1)
    expect(box.y).toBeCloseTo(108 / 180, 1)
    expect(box.width).toBeCloseTo(45 / 240, 1)
    expect(box.height).toBeCloseTo(25 / 180, 1)
  })

  it("detects multiple potholes and grades a large one as more severe", () => {
    const img = road()
    paint(img, ellipse(60, 100, 8, 5), 50)
    paint(img, ellipse(170, 140, 40, 22), 40)
    const result = detectPotholes(img)
    expect(result.potholes).toHaveLength(2)
    const [big, small] = [...result.potholes].sort((a, b) => b.box.width - a.box.width)
    const order = ["low", "medium", "high", "critical"]
    expect(order.indexOf(big.severity)).toBeGreaterThan(order.indexOf(small.severity))
  })

  it("treats a thin dark line as a crack, not a pothole", () => {
    const img = road()
    paint(img, (x, y) => y >= 120 && y <= 121 && x > 20 && x < 220, 40)
    const result = detectPotholes(img)
    expect(result.potholes).toHaveLength(0)
    expect(result.otherIssues).toContain("Possible surface cracks")
  })

  it("ignores dark objects in the top part of the frame (sky / vehicles)", () => {
    const img = road()
    paint(img, ellipse(120, 16, 25, 12), 40)
    expect(detectPotholes(img).potholes).toHaveLength(0)
  })

  it("separates a pothole from a full-width wall or kerb band above it", () => {
    const img = road()
    paint(img, (_, y) => y >= 36 && y < 60, 45) // wall across the whole frame at the top of the road area
    paint(img, ellipse(120, 75, 22, 14), 45) // pothole touching the wall
    const result = detectPotholes(img)
    expect(result.potholes).toHaveLength(1)
    expect(result.potholes[0].box.y).toBeGreaterThan(55 / 180)
  })

  it("is not fooled by a white lane marking", () => {
    const img = road()
    paint(img, (x, y) => x >= 100 && x < 140 && y >= 90 && y < 150, 235)
    expect(detectPotholes(img).potholes).toHaveLength(0)
  })

  it("rejects images that are not road surfaces", () => {
    const rand = rng(7)
    const width = 120
    const height = 90
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) data.set([30 + rand() * 40, 140 + rand() * 80, 40 + rand() * 30, 255], i * 4)
    const result = detectPotholes({ width, height, data })
    expect(result.isRoad).toBe(false)
    expect(result.potholes).toHaveLength(0)
  })
})
