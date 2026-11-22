import * as Notifications from 'expo-notifications'

// A finished Bot has to reach the phone even when the app is not on screen.
// These are local notifications: no APNs certificate, no developer account.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

let asked = false

export async function askNotifications(): Promise<void> {
  if (asked) return
  asked = true
  try {
    const status = await Notifications.getPermissionsAsync()
    if (status.status !== 'granted') await Notifications.requestPermissionsAsync()
  } catch {
    // Denied or unavailable: the in-app banners and the Dynamic Island still work.
  }
}

export async function notifyDone(botName: string, title: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: `${botName} · 工作完成`, body: title.slice(0, 180) },
      trigger: null,
    })
  } catch {
    // Nothing to do here: the chat itself still shows the result.
  }
}
