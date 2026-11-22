// Live Activity placeholder for the shipping build: the native module only ships in
// the Lab build, so every call here is a quiet no-op.
export async function showRunningActivity(_botName: string, _step: string): Promise<void> {}
export async function showDoneActivity(_botName: string, _title: string, _failed = false): Promise<void> {}
export async function endAllActivities(): Promise<void> {}
