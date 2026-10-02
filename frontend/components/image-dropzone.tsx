"use client"

import { useRef, useState } from "react"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/frontend/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_UPLOAD_BYTES } from "@/lib/image"

interface ImageDropzoneProps {
  onFiles: (files: File[]) => void
  multiple?: boolean
  disabled?: boolean
  hint?: string
}

export function ImageDropzone({ onFiles, multiple = false, disabled = false, hint }: ImageDropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function accept(list: FileList | null) {
    const files = Array.from(list ?? [])
    // Some phones (HEIC, certain Android galleries) report an empty MIME type; let decoding decide for those.
    const images = files.filter((f) => f.type === "" || f.type.startsWith("image/"))
    const tooBig = images.filter((f) => f.size > MAX_UPLOAD_BYTES)
    const ok = images.filter((f) => f.size <= MAX_UPLOAD_BYTES)
    setError(
      images.length < files.length
        ? "Only image files can be uploaded."
        : tooBig.length
          ? `${tooBig.length} photo(s) are larger than 10 MB and were skipped.`
          : null,
    )
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1))
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && fileRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            fileRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) accept(e.dataTransfer.files)
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-primary/5" : "border-primary/40 hover:bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="font-semibold mb-1">Click to upload or drag and drop</p>
        <p className="text-sm text-muted-foreground">{hint ?? "JPG, PNG or WebP, up to 10 MB"}</p>
      </div>
      <div className="mt-3 flex justify-center sm:hidden">
        <Button type="button" variant="outline" disabled={disabled} onClick={() => cameraRef.current?.click()}>
          <Camera className="w-4 h-4" /> Take a photo
        </Button>
      </div>
      {error && <p className="text-sm text-destructive mt-2" role="alert">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          accept(e.target.files)
          e.target.value = ""
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
