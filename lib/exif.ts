/**
 * Reads the GPS position embedded in a JPEG's EXIF block. No dependencies.
 * Returns null when there's no EXIF, no GPS, or the file isn't a JPEG (HEIC, PNG, screenshots).
 * Note: many apps remove location when sharing (WhatsApp, some Android pickers), so this is best-effort.
 */
export interface PhotoGps {
  latitude: number
  longitude: number
}

const GPS_IFD_POINTER = 0x8825
const TAG = { latRef: 1, lat: 2, lngRef: 3, lng: 4 } as const

export function readJpegGps(buffer: ArrayBuffer): PhotoGps | null {
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null

  // Walk JPEG segments to APP1 "Exif\0\0".
  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset)
    const size = view.getUint16(offset + 2)
    if (marker === 0xffe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) {
      return readTiffGps(view, offset + 10)
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null // start of scan: no more metadata
    offset += 2 + size
  }
  return null
}

function readTiffGps(view: DataView, tiff: number): PhotoGps | null {
  try {
    const little = view.getUint16(tiff) === 0x4949
    const u16 = (o: number) => view.getUint16(o, little)
    const u32 = (o: number) => view.getUint32(o, little)

    const entries = (ifd: number) => {
      const count = u16(ifd)
      return Array.from({ length: count }, (_, i) => {
        const e = ifd + 2 + i * 12
        return { tag: u16(e), type: u16(e + 2), count: u32(e + 4), valueOffset: e + 8 }
      })
    }

    const ifd0 = tiff + u32(tiff + 4)
    const pointer = entries(ifd0).find((e) => e.tag === GPS_IFD_POINTER)
    if (!pointer) return null
    const gps = entries(tiff + u32(pointer.valueOffset))
    const get = (tag: number) => gps.find((e) => e.tag === tag)

    const ref = (tag: number) => {
      const e = get(tag)
      return e ? String.fromCharCode(view.getUint8(e.valueOffset)) : null
    }
    // Three RATIONALs (degrees, minutes, seconds), stored at an offset from the TIFF header.
    const dms = (tag: number) => {
      const e = get(tag)
      if (!e || e.type !== 5 || e.count !== 3) return null
      const at = tiff + u32(e.valueOffset)
      const [d, m, s] = [0, 1, 2].map((i) => {
        const den = u32(at + i * 8 + 4)
        return den ? u32(at + i * 8) / den : 0
      })
      return d + m / 60 + s / 3600
    }

    const lat = dms(TAG.lat)
    const lng = dms(TAG.lng)
    if (lat === null || lng === null || (lat === 0 && lng === 0)) return null
    const latitude = ref(TAG.latRef) === "S" ? -lat : lat
    const longitude = ref(TAG.lngRef) === "W" ? -lng : lng
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
    return { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) }
  } catch {
    return null // truncated or malformed EXIF
  }
}

export async function readPhotoGps(file: Blob): Promise<PhotoGps | null> {
  // GPS lives in the first segment; 128 KB is plenty and avoids reading 10 MB photos.
  return readJpegGps(await file.slice(0, 128 * 1024).arrayBuffer())
}
