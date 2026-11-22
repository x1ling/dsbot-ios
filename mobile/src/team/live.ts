import { Platform } from 'react-native'

// A Live Activity puts the Bot's finish on the Dynamic Island and the lock
// screen. The module only exists in the iOS build; everywhere else this is a
// no-op, and a build without the widget extension must never crash the app.
type LiveModule = {
  startActivity: (props: Record<string, unknown>, options?: Record<string, unknown>) => string
  updateActivity: (id: string, props: Record<string, unknown>, options?: Record<string, unknown>) => void
  endActivity: (id: string, props?: Record<string, unknown>, options?: Record<string, unknown>) => void
}

let loaded: LiveModule | null | undefined
let currentId: string | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

async function load(): Promise<LiveModule | undefined> {
  if (Platform.OS !== 'ios') return undefined
  if (loaded === undefined) {
    try {
      loaded = (await import('expo-live-activity')) as unknown as LiveModule
    } catch {
      loaded = null
    }
  }
  return loaded ?? undefined
}

/** Shows "工作完成" in the Dynamic Island for a Bot that just finished. */
export async function showDoneActivity(botName: string, title: string, failed = false): Promise<void> {
  const live = await load()
  if (live === undefined) return
  try {
    if (currentId !== undefined) live.endActivity(currentId)
    currentId = live.startActivity(
      {
        title: failed ? `${botName} · 任务失败` : `${botName} · 工作完成`,
        subtitle: title.slice(0, 120),
        progressBar: { progress: 1 },
      },
      { timerType: 'countdown', timerStart: Date.now() },
    )
    if (hideTimer !== undefined) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      if (currentId !== undefined) {
        try { live.endActivity(currentId) } catch { /* already gone */ }
        currentId = undefined
      }
    }, 30_000)
  } catch { /* Live Activities unavailable: the chat still shows the result */ }
}
