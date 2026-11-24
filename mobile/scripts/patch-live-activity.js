// Patches expo-live-activity's Dynamic Island layout so the compact pill always
// shows a state icon: a progress glyph while the task runs, a check mark when it
// finishes. Upstream renders an empty pill unless an image or a countdown timer
// is supplied, which is why the island looked black.
const fs = require('node:fs')
const path = require('node:path')

const file = path.join(__dirname, '..', 'node_modules', 'expo-live-activity', 'ios-files', 'LiveActivityWidget.swift')
const MARK = 'DSBOT_STATE_ICON'

// The module is optional: builds that dropped expo-live-activity simply skip the patch.
if (!fs.existsSync(file)) {
  console.log('live-activity module not installed, skip widget patch')
  process.exit(0)
}

let source = fs.readFileSync(file, 'utf8')
if (source.includes(MARK)) {
  console.log('live-activity widget already patched')
  process.exit(0)
}

const head = '      } compactLeading: {'
const tail = '  @ViewBuilder\n  private func compactTimer('
const start = source.indexOf(head)
const end = source.indexOf(tail)
if (start === -1 || end === -1) throw new Error('live-activity layout anchors not found')

const replacement = `      } compactLeading: {
        // ${MARK}
        stateIcon(progress: context.state.progress, tint: context.attributes.progressViewTint)
          .applyWidgetURL(from: context.attributes.deepLinkUrl)
      } compactTrailing: {
        Text(context.state.title)
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(.white)
          .lineLimit(1)
          .frame(maxWidth: 90)
          .applyWidgetURL(from: context.attributes.deepLinkUrl)
      } minimal: {
        stateIcon(progress: context.state.progress, tint: context.attributes.progressViewTint)
          .applyWidgetURL(from: context.attributes.deepLinkUrl)
      }
    }
  }

  @ViewBuilder
  private func stateIcon(progress: Double?, tint: String?) -> some View {
    if let progress, progress >= 1 {
      Image(systemName: "checkmark.circle.fill")
        .font(.system(size: 18, weight: .bold))
        .foregroundStyle(Color(hex: "#22C55E"))
    } else {
      Image(systemName: "arrow.triangle.2.circlepath")
        .font(.system(size: 17, weight: .semibold))
        .foregroundStyle(tint.map { Color(hex: $0) } ?? Color(hex: "#22D3EE"))
    }
  }

${tail}`

source = source.slice(0, start) + replacement + source.slice(end + tail.length)
fs.writeFileSync(file, source)
console.log('live-activity widget patched')
