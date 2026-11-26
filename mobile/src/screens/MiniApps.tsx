import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTeam } from '../team/context.tsx'
import { t } from '../ui/i18n.ts'
import { radius, type as typeScale, useTheme } from '../ui/tokens.ts'

type MiniApp = { slug: string; name: string; icon?: string; color?: string; desc?: string; entry?: string }

const BASE = 'https://1xfrakazo.duckdns.org:5173/miniapps/'

export function MiniApps({ navigation }: { navigation: { goBack: () => void } }) {
  const { p } = useTheme()
  const { call } = useTeam()
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<MiniApp[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setBusy(true)
    void call('miniapps')
      .then(v => {
        const value = v as { items?: MiniApp[] }
        setItems(Array.isArray(value?.items) ? value.items : [])
        setError(null)
      })
      .catch((f: { message?: string }) => setError(f?.message ?? String(f)))
      .finally(() => setBusy(false))
  }, [call])

  useEffect(() => { load() }, [load])

  const open = (app: MiniApp) => {
    void WebBrowser.openBrowserAsync(`${BASE}${app.slug}/${app.entry ?? 'index.html'}`, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: p.card,
      controlsColor: p.accent,
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: p.main }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: insets.top + 8, paddingBottom: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Back')} onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
          <Text style={{ color: p.accent, fontSize: 26, lineHeight: 30 }}>‹</Text>
        </Pressable>
        <Text style={{ color: p.ink, flex: 1, fontSize: 20, fontWeight: '600' }}>{t('Mini Apps')}</Text>
        {busy ? <ActivityIndicator size="small" color={p.ink3} /> : null}
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor={p.ink3} />}>
        {error !== null ? <Text style={[typeScale.small, { color: p.danger, marginBottom: 12 }]}>{error}</Text> : null}
        {items !== null && items.length === 0 ? (
          <Text style={[typeScale.small, { color: p.ink3, textAlign: 'center', marginTop: 60 }]}>
            {t('No Mini Apps yet. Ask any Bot to build one.')}
          </Text>
        ) : null}
        <View style={styles.grid}>
          {items?.map(app => (
            <Pressable key={app.slug} accessibilityRole="button" accessibilityLabel={app.name} onPress={() => open(app)}
              style={({ pressed }) => [styles.card, { backgroundColor: p.card, borderColor: p.line }, pressed && { opacity: 0.7 }]}>
              <View style={[styles.icon, { backgroundColor: (app.color ?? '#4F6BFF') + '22' }]}>
                <Text style={{ fontSize: 26 }}>{app.icon ?? '📦'}</Text>
              </View>
              <Text style={[typeScale.settingsRow, { color: p.ink, marginTop: 10 }]} numberOfLines={1}>{app.name}</Text>
              {app.desc ? <Text style={[typeScale.small, { color: p.ink3, marginTop: 2 }]} numberOfLines={2}>{app.desc}</Text> : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
})
