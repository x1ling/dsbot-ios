// Live Activity (Dynamic Island + Lock Screen) for the iOS lab build.
// Kept behind try/catch: a device without Live Activities must still run the app.
import { Platform } from 'react-native'
import * as LiveActivity from 'expo-live-activity'

let current: string | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

const config = {
  backgroundColor: '#0D141C',
  titleColor: '#FFFFFF',
  subtitleColor: '#9FB3C8',
  progressViewTint: '#22D3EE',
  progressViewLabelColor: '#22D3EE',
  timerType: 'digital' as const,
  padding: 12,
}

// The widget reads `progress`: anything below 1 shows the running icon, 1 shows
// the check mark. Keeping it in the existing field avoids touching the native
// attribute schema.
export async function showRunningActivity(botName: string, title: string): Promise<void> {
  if (Platform.OS !== 'ios') return
  const state = {
    title: `${botName} · 正在处理`,
    subtitle: String(title ?? '').slice(0, 120),
    progress: 0.4,
  }
  try {
    if (current === null) {
      const id = LiveActivity.startActivity(state, config)
      if (typeof id === 'string') current = id
    } else {
      LiveActivity.updateActivity(current, state)
    }
    if (closeTimer !== null) { clearTimeout(closeTimer); closeTimer = null }
  } catch {}
}

export async function showDoneActivity(botName: string, title: string, failed = false): Promise<void> {
  if (Platform.OS !== 'ios') return
  const state = {
    title: `${botName} · ${failed ? '任务失败' : '任务完成'}`,
    subtitle: String(title ?? '').slice(0, 120),
    progress: 1,
  }
  try {
    if (current === null) {
      const id = LiveActivity.startActivity(state, config)
      if (typeof id === 'string') current = id
    } else {
      LiveActivity.updateActivity(current, state)
    }
    if (closeTimer !== null) clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      try {
        if (current !== null) LiveActivity.stopActivity(current, { ...state, subtitle: '已结束' })
      } catch {}
      current = null
      closeTimer = null
    }, 30_000)
  } catch {}
}

export async function endAllActivities(): Promise<void> {
  try {
    if (current !== null) LiveActivity.stopActivity(current, { title: 'DS Bot', subtitle: '已结束' })
  } catch {}
  current = null
}
