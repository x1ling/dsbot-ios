// Notifications are delivered by the VPS through Bark, so the app itself does not
// schedule local notifications. These helpers stay as quiet no-ops for callers.

export async function askNotifications(): Promise<void> {}

export async function notifyDone(_botName: string, _title: string): Promise<void> {}
