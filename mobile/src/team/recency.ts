// Which Bot or group last said anything, as the phone saw it. The host sends a
// notice for every finished or started turn, so the drawer can float that row to
// the top even when the team projection it was built from is older.
const times = new Map<string, number>()
const listeners = new Set<() => void>()
let version = 0

export function bumpRecency(id: unknown, at = Date.now()) {
  if (typeof id !== 'string' || id === '') return
  if ((times.get(id) ?? 0) >= at) return
  times.set(id, at)
  version += 1
  for (const listener of listeners) listener()
}

export function recencyOf(id: string): number {
  return times.get(id) ?? 0
}

export function subscribeRecency(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function recencyVersion() {
  return version
}
