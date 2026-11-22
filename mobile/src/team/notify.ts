// Notifications are disabled until the native module versions are proven on the
// device. These are no-ops so the rest of the app keeps compiling and running.
export async function askNotifications(): Promise<void> {}

export async function notifyDone(_botName: string, _title: string): Promise<void> {}
