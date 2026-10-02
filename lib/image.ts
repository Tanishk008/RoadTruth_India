/** Browser-only image helpers. */

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read this image."))
    }
    img.src = url
  })
}

function drawScaled(img: HTMLImageElement, maxDim: number) {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) throw new Error("Canvas is not supported in this browser.")
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return { canvas, ctx }
}

/** Resize and re-encode as JPEG. Strips EXIF metadata (including GPS) as a side effect. */
export async function compressImage(file: Blob, maxDim = 1280, quality = 0.8): Promise<string> {
  const { canvas } = drawScaled(await loadImage(file), maxDim)
  return canvas.toDataURL("image/jpeg", quality)
}

/** Small RGBA buffer for the on-device detector. */
export async function imageDataFor(file: Blob, maxDim = 320): Promise<ImageData> {
  const { canvas, ctx } = drawScaled(await loadImage(file), maxDim)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
