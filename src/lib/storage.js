import { STORAGE_BUCKET, SUPABASE_KEY, SUPABASE_URL, supabase } from './supabase'

const SKIP_COMPRESSION = ['image/gif', 'image/svg+xml']

/** Project screenshots are sized for a 16:9 frame. */
export const SCREENSHOT_SIZE = { maxWidth: 1600, maxHeight: 900 }

/**
 * Shrink an image to fit inside maxWidth x maxHeight (never cropped, never enlarged) and
 * re-encode as WebP (JPEG fallback). Returns the original file for GIF/SVG or on error.
 */
export async function compressImage(
  file,
  { maxWidth = 2000, maxHeight = Infinity, quality = 0.85 } = {},
) {
  if (!file.type.startsWith('image/') || SKIP_COMPRESSION.includes(file.type)) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const toBlob = (type) => new Promise((res) => canvas.toBlob(res, type, quality))
    let blob = await toBlob('image/webp')
    if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg')
    if (!blob) return file
    // Keep the original if re-encoding made it bigger and no resize was needed.
    if (scale === 1 && blob.size >= file.size) return file
    return blob
  } catch {
    return file
  }
}

const EXT = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

/** Build a unique storage path like "projects/<id>/<uuid>.webp". */
export function makePath(folder, blob) {
  const ext = EXT[blob.type] || 'bin'
  return `${folder}/${crypto.randomUUID()}.${ext}`
}

/**
 * Upload with progress. supabase-js has no progress callback, so this talks to the
 * Storage REST endpoint directly with the signed-in user's token.
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadFile(blob, path, onProgress) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('You’re signed out. Sign in again and retry.')

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', SUPABASE_KEY)
    xhr.setRequestHeader('Content-Type', blob.type || 'application/octet-stream')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status < 300) return resolve()
      let message = `Upload failed (${xhr.status})`
      try {
        message = JSON.parse(xhr.responseText).message || message
      } catch {
        /* not JSON */
      }
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection.'))
    xhr.send(blob)
  })

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, url: pub.publicUrl }
}

/** Compress (if an image) then upload into `folder`. */
export async function uploadToFolder(file, folder, { maxWidth, maxHeight, onProgress } = {}) {
  const blob =
    file.type === 'application/pdf' ? file : await compressImage(file, { maxWidth, maxHeight })
  return uploadFile(blob, makePath(folder, blob), onProgress)
}

/** Remove files from Storage. Ignores empty paths; never throws (a leftover file is harmless). */
export async function removeFiles(paths) {
  const list = paths.filter(Boolean)
  if (!list.length) return
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(list)
  if (error) console.warn('Could not remove files from storage', error)
}
