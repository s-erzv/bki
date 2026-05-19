/**
 * Client-side image resize/compress for uploads.
 *
 * Use cases:
 *  - Profile photos: cap at 512×512, JPEG q=0.85
 *  - Session docs: cap at 1600px longest edge, JPEG q=0.82
 *
 * Avoids shipping 5MB phone photos to storage. Output is always JPEG so we
 * shrink even already-compressed PNG/HEIC inputs.
 */

export interface ResizeOptions {
  maxDim: number       // longest edge in pixels
  quality?: number     // 0..1, default 0.85
  mimeType?: string    // default 'image/jpeg'
}

/**
 * Returns a new File (JPEG) resized to fit within maxDim, preserving aspect ratio.
 * If the source is already smaller, it's still re-encoded (so HEIC etc. become JPEG).
 */
export async function resizeImage(file: File, opts: ResizeOptions): Promise<File> {
  const { maxDim, quality = 0.85, mimeType = 'image/jpeg' } = opts

  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung browser ini')
  // White background — JPEG doesn't support transparency.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encode gagal'))),
      mimeType,
      quality,
    )
  })

  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1] ?? 'bin'
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Baca file gagal'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Load gambar gagal'))
    img.src = src
  })
}
