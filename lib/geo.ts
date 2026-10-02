/** Tiny equirectangular projection + smoothing helpers for schematic maps (no map library needed). */

export type LngLat = [number, number]

export interface Projection {
  project: (p: LngLat) => [number, number]
  width: number
  height: number
}

/**
 * Fit points into a box, correcting longitude for latitude so shapes aren't stretched.
 * With `maxHeight`, tall shapes are scaled down to fit and the returned width shrinks to match.
 */
export function fitProjection(points: LngLat[], width: number, padding = 24, maxHeight = Infinity): Projection {
  const lngs = points.map((p) => p[0])
  const lats = points.map((p) => p[1])
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)]
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)]
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  const spanX = Math.max((maxLng - minLng) * k, 1e-6)
  const spanY = Math.max(maxLat - minLat, 1e-6)
  const scale = Math.min((width - padding * 2) / spanX, (maxHeight - padding * 2) / spanY)
  return {
    width: spanX * scale + padding * 2,
    height: spanY * scale + padding * 2,
    project: ([lng, lat]) => [padding + (lng - minLng) * k * scale, padding + (maxLat - lat) * scale],
  }
}

/** Catmull-Rom spline through points, emitted as cubic Bézier segments. */
export function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return ""
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/** Great-circle distance in metres. */
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.latitude - a.latitude) * rad
  const dLng = (b.longitude - a.longitude) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Lat/lng box that contains every point within `radius` metres; a cheap pre-filter before exact distances. */
export function boundingBox(center: { latitude: number; longitude: number }, radius: number) {
  const dLat = radius / 111320
  const dLng = radius / (111320 * Math.cos((center.latitude * Math.PI) / 180))
  return { minLat: center.latitude - dLat, maxLat: center.latitude + dLat, minLng: center.longitude - dLng, maxLng: center.longitude + dLng }
}

/** Items within `radius` metres of `center`, nearest first, each with its distance. */
export function nearby<T extends { latitude?: number; longitude?: number }>(
  items: T[],
  center: { latitude: number; longitude: number },
  radius: number,
): (T & { distance: number })[] {
  return items
    .filter((i): i is T & { latitude: number; longitude: number } => i.latitude !== undefined && i.longitude !== undefined)
    .map((i) => ({ ...i, distance: distanceMeters(center, i) }))
    .filter((i) => i.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
}
