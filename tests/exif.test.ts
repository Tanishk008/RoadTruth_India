import { describe, expect, it } from "vitest"
import { readJpegGps } from "@/lib/exif"

type Dms = [number, number, number]

/** Minimal JPEG with an EXIF APP1 segment holding only GPS tags. */
function jpegWithGps(lat: Dms, latRef: string, lng: Dms, lngRef: string, little = false): ArrayBuffer {
  const tiff = new DataView(new ArrayBuffer(128))
  const w16 = (o: number, v: number) => tiff.setUint16(o, v, little)
  const w32 = (o: number, v: number) => tiff.setUint32(o, v, little)
  w16(0, little ? 0x4949 : 0x4d4d)
  w16(2, 42)
  w32(4, 8)
  // IFD0: one entry pointing at the GPS IFD.
  w16(8, 1)
  w16(10, 0x8825)
  w16(12, 4)
  w32(14, 1)
  w32(18, 26)
  w32(22, 0)
  // GPS IFD at 26 with four entries; rationals stored at 80 and 104.
  w16(26, 4)
  const entry = (i: number, tag: number, type: number, count: number) => {
    const o = 28 + i * 12
    w16(o, tag)
    w16(o + 2, type)
    w32(o + 4, count)
    return o + 8
  }
  tiff.setUint8(entry(0, 1, 2, 2), latRef.charCodeAt(0))
  w32(entry(1, 2, 5, 3), 80)
  tiff.setUint8(entry(2, 3, 2, 2), lngRef.charCodeAt(0))
  w32(entry(3, 4, 5, 3), 104)
  w32(76, 0)
  const rationals = (at: number, [d, m, s]: Dms) => {
    ;[d, 1, m, 1, Math.round(s * 100), 100].forEach((v, i) => w32(at + i * 4, v))
  }
  rationals(80, lat)
  rationals(104, lng)

  const header = [0xff, 0xd8, 0xff, 0xe1, 0, 0, 0x45, 0x78, 0x69, 0x66, 0, 0]
  const size = 2 + 6 + tiff.byteLength
  header[4] = size >> 8
  header[5] = size & 0xff
  const out = new Uint8Array(header.length + tiff.byteLength + 2)
  out.set(header)
  out.set(new Uint8Array(tiff.buffer), header.length)
  out.set([0xff, 0xd9], header.length + tiff.byteLength)
  return out.buffer
}

describe("readJpegGps", () => {
  it.each([false, true])("reads degrees/minutes/seconds (little-endian: %s)", (little) => {
    // Dausa, Rajasthan: 26°53'36.5"N 76°20'15.25"E
    const gps = readJpegGps(jpegWithGps([26, 53, 36.5], "N", [76, 20, 15.25], "E", little))
    expect(gps).toEqual({ latitude: 26.893472, longitude: 76.337569 })
  })

  it("applies S and W hemispheres", () => {
    expect(readJpegGps(jpegWithGps([10, 0, 0], "S", [20, 30, 0], "W"))).toEqual({ latitude: -10, longitude: -20.5 })
  })

  it("returns null for 0,0 (cameras write it when there's no fix)", () => {
    expect(readJpegGps(jpegWithGps([0, 0, 0], "N", [0, 0, 0], "E"))).toBeNull()
  })

  it("returns null for non-JPEGs, JPEGs without EXIF, and truncated files", () => {
    expect(readJpegGps(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull()
    expect(readJpegGps(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]).buffer)).toBeNull()
    expect(readJpegGps(jpegWithGps([26, 0, 0], "N", [76, 0, 0], "E").slice(0, 60))).toBeNull()
  })
})
