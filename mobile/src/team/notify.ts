import { Platform } from 'react-native'
import { loadDraft, saveDraft, clearDraft } from './draft'

// Local notifications are wired through expo-notifications only when the native
// module is present in the build. The app must keep running on builds without it.
type NotificationsModule = {
  setNotificationHandler: (h: unknown) => void
  getPermissionsAsync: () => Promise<{ status: string }>
  requestPermissionsAsync: () => Promise<{ status: string }>
  scheduleNotificationAsync: (r: unknown) => Promise<string>
}

let mod: NotificationsModule | null | undefined

async function load(): Promise<NotificationsModule | undefined> {
  if (Platform.OS === 'web') return undefined
  if (mod === undefined) {
    try {
      mod = (await import('expo-notifications')) as unknown as NotificationsModule
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      })
    } catch {
      mod = null
    }
  }
  return mod ?? undefined
}

let asked = false

export async function askNotifications(): Promise<void> {
  if (asked) return
  asked = true
  try {
    const n = await load()
    if (n === undefined) return
    const status = await n.getPermissionsAsync()
    if (status.status !== 'granted') await n.requestPermissionsAsync()
  } catch {
    // Denied or unavailable: the in-app banners still work.
  }
}

export async function notifyDone(botName: string, title: string): Promise<void> {
  try {
    const n = await load()
    if (n === undefined) return
    await n.scheduleNotificationAsync({
      content: { title: `${botName} · 工作完成`, body: title.slice(0, 180) },
      trigger: null,
    })
  } catch {
    // Nothing to do here: the chat itself still shows the result.
  }
}

export { loadDraft, saveDraft, clearDraft }
