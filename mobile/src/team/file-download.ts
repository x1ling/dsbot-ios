import { Directory, File, FileMode, Paths } from 'expo-file-system'

// Files travel in fixed pieces over the encrypted link. One piece at a time was
// the old way and a 10 MB file meant twenty round trips; now several pieces are
// asked for at once and written in order, so the link's latency stops ruling the
// speed. The server's piece size is whatever the first answer carries.
const IN_FLIGHT = 6

type Chunk = { bytes: Uint8Array; nextOffset?: number; size?: number; version?: string; name?: string; mime?: string; done?: boolean }

function decode(part: { bytes: string }): Uint8Array {
  const raw = atob(part.bytes)
  const out = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) out[index] = raw.charCodeAt(index)
  return out
}

export async function downloadFile(
  call: (endpoint: string, payload: object) => Promise<unknown>,
  target: object,
  onProgress?: (loaded: number, total: number) => void,
) {
  const dir = new Directory(Paths.cache, 'downloads', `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  dir.create({ intermediates: true })
  let file: File | undefined
  let handle: ReturnType<File['open']> | undefined
  let saved: { uri: string; name: string; mime: string } | undefined
  try {
    const first = (await call('file-download', { ...target, offset: 0 })) as Chunk
    const firstBytes = decode(first as unknown as { bytes: string })
    const name = String(first.name || 'file').replace(/[\\/\u0000-\u001f]/g, '_')
    file = new File(dir, name === '.' || name === '..' ? 'file' : name)
    file.create()
    handle = file.open(FileMode.Truncate)
    saved = { uri: file.uri, name: file.name, mime: first.mime || 'application/octet-stream' }
    await handle.writeBytes(firstBytes)
    const total = Number(first.size ?? firstBytes.length)
    let written = firstBytes.length
    onProgress?.(written, total)
    // Older hosts hand the whole file over in one answer.
    if (first.nextOffset === undefined || first.done === true) return saved!
    const step = firstBytes.length
    const version = first.version
    if (step <= 0) throw new Error('This file is no longer available')

    const pending = new Map<number, Uint8Array>()
    let requested = written
    let failed: unknown
    let active = IN_FLIGHT
    let wake: (() => void) | null = null
    const signal = () => { const resume = wake; wake = null; resume?.() }
    const pull = async () => {
      try {
        while (failed === undefined) {
          const offset = requested
          if (offset >= total) return
          requested = offset + step
          try {
            const part = (await call('file-download', { ...target, offset, ...(version === undefined ? {} : { version }) })) as Chunk
            const bytes = decode(part as unknown as { bytes: string })
            if (part.nextOffset !== undefined && part.nextOffset !== offset + bytes.length) throw new Error('This file is no longer available')
            if (version !== undefined && part.version !== undefined && part.version !== version) throw new Error('This file is no longer available')
            pending.set(offset, bytes)
          } catch (error) {
            failed = error
            return
          } finally {
            signal()
          }
        }
      } finally {
        active -= 1
        signal()
      }
    }
    const workers = Array.from({ length: IN_FLIGHT }, () => pull())
    while (written < total) {
      const bytes = pending.get(written)
      if (bytes === undefined) {
        if (failed !== undefined) throw failed
        if (active === 0) throw new Error('This file is no longer available')
        await new Promise<void>(resolve => { wake = resolve })
        continue
      }
      pending.delete(written)
      await handle.writeBytes(bytes)
      written += bytes.length
      onProgress?.(written, total)
    }
    await Promise.all(workers)
    if (failed !== undefined) throw failed
    return saved!
  } catch (error) {
    handle?.close()
    handle = undefined
    dir.delete()
    throw error
  } finally { handle?.close() }
}
