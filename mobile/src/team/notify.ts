// Local notifications for the iOS lab build: a banner + sound when a Bot finishes.
// Everything is guarded so a device that refuses permission never breaks the app.
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

let handlerInstalled = false

function installHandler(): void {
  if (handlerInstalled) return
  handlerInstalled = true
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })
  } catch {}
}

export async function askNotifications(): Promise<void> {
  if (Platform.OS !== 'ios') return
  installHandler()
  try {
    const settings = await Notifications.getPermissionsAsync()
    if (settings.granted !== true) {
      await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } })
    }
  } catch {}
}

export async function notifyDone(botName: string, title: string): Promise<void> {
  if (Platform.OS !== 'ios') return
  installHandler()
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: `${botName} · 任务完成`, body: String(title).slice(0, 160), sound: true },
      trigger: null,
    })
  } catch {}
}
