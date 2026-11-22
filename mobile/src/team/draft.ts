import * as FileSystem from 'expo-file-system/legacy'

// An unsent message survives closing the app: the draft is written beside the
// app's documents, one small file per chat, and read back when that chat opens.
const DIR = `${FileSystem.documentDirectory ?? ''}drafts/`

function fileOf(key: string): string {
  return `${DIR}${key.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`
}

export async function loadDraft(key: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(fileOf(key))
    if (!info.exists) return ''
    const raw = await FileSystem.readAsStringAsync(fileOf(key))
    const parsed = JSON.parse(raw) as { text?: unknown }
    return typeof parsed.text === 'string' ? parsed.text : ''
  } catch {
    return ''
  }
}

export async function saveDraft(key: string, text: string): Promise<void> {
  try {
    if (text === '') {
      await FileSystem.deleteAsync(fileOf(key), { idempotent: true })
      return
    }
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
    await FileSystem.writeAsStringAsync(fileOf(key), JSON.stringify({ text, at: Date.now() }))
  } catch {
    // A draft that cannot be stored still sends; nothing here should block typing.
  }
}
