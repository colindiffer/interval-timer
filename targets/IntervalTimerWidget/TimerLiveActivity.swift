import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Attributes

public struct TimerActivityAttributes: ActivityAttributes {
    public let workoutName: String

    public struct ContentState: Codable & Hashable {
        var phaseName: String
        var phaseColorHex: String  // e.g. "#3B82F6"
        var endTime: Date          // absolute Date — system renders countdown automatically
        var phaseIndex: Int
        var totalPhases: Int
        var isPaused: Bool
        var pausedSecondsRemaining: Int  // used when isPaused == true
    }
}

// MARK: - Widget Bundle

@main
struct IntervalTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.2, *) {
            TimerLiveActivityWidget()
        }
    }
}

// MARK: - Live Activity Widget

@available(iOS 16.2, *)
struct TimerLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerActivityAttributes.self) { context in
            LockScreenView(context: context)
                .activityBackgroundTint(Color(UIColor.systemBackground))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color(hex: context.state.phaseColorHex))
                            .frame(width: 10, height: 10)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(context.attributes.workoutName)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                            Text(context.state.phaseName)
                                .font(.headline)
                                .foregroundColor(Color(hex: context.state.phaseColorHex))
                        }
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        if context.state.isPaused {
                            Text(formatSeconds(context.state.pausedSecondsRemaining))
                                .font(.system(.title, design: .monospaced, weight: .bold))
                        } else {
                            Text(timerInterval: Date.now...context.state.endTime, countsDown: true)
                                .font(.system(.title, design: .monospaced, weight: .bold))
                                .multilineTextAlignment(.trailing)
                        }
                        Text("\(context.state.phaseIndex + 1)/\(context.state.totalPhases)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    PhaseProgressBar(
                        phaseIndex: context.state.phaseIndex,
                        totalPhases: context.state.totalPhases,
                        color: Color(hex: context.state.phaseColorHex)
                    )
                    .padding(.horizontal, 12)
                    .padding(.bottom, 4)
                }
            } compactLeading: {
                Circle()
                    .fill(Color(hex: context.state.phaseColorHex))
                    .frame(width: 8, height: 8)
                    .padding(.leading, 2)
            } compactTrailing: {
                if context.state.isPaused {
                    Text(formatSeconds(context.state.pausedSecondsRemaining))
                        .font(.system(.caption, design: .monospaced, weight: .semibold))
                        .frame(minWidth: 36)
                } else {
                    Text(timerInterval: Date.now...context.state.endTime, countsDown: true)
                        .font(.system(.caption, design: .monospaced, weight: .semibold))
                        .frame(minWidth: 36)
                }
            } minimal: {
                Circle()
                    .fill(Color(hex: context.state.phaseColorHex))
                    .frame(width: 8, height: 8)
            }
        }
    }
}

// MARK: - Lock Screen View

@available(iOS 16.2, *)
struct LockScreenView: View {
    let context: ActivityViewContext<TimerActivityAttributes>

    var body: some View {
        HStack(spacing: 14) {
            Circle()
                .fill(Color(hex: context.state.phaseColorHex))
                .frame(width: 12, height: 12)

            VStack(alignment: .leading, spacing: 2) {
                Text(context.attributes.workoutName)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                Text(context.state.phaseName)
                    .font(.headline)
                    .foregroundColor(Color(hex: context.state.phaseColorHex))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                if context.state.isPaused {
                    Text(formatSeconds(context.state.pausedSecondsRemaining))
                        .font(.system(.title2, design: .monospaced, weight: .bold))
                } else {
                    Text(timerInterval: Date.now...context.state.endTime, countsDown: true)
                        .font(.system(.title2, design: .monospaced, weight: .bold))
                        .multilineTextAlignment(.trailing)
                }
                Text("\(context.state.phaseIndex + 1)/\(context.state.totalPhases)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
    }
}

// MARK: - Progress Bar

@available(iOS 16.2, *)
struct PhaseProgressBar: View {
    let phaseIndex: Int
    let totalPhases: Int
    let color: Color

    var progress: CGFloat {
        guard totalPhases > 0 else { return 0 }
        return CGFloat(phaseIndex + 1) / CGFloat(totalPhases)
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.gray.opacity(0.25))
                Capsule()
                    .fill(color)
                    .frame(width: geo.size.width * progress)
            }
        }
        .frame(height: 4)
    }
}

// MARK: - Helpers

private func formatSeconds(_ seconds: Int) -> String {
    let s = max(0, seconds)
    let m = s / 60
    let rem = s % 60
    return String(format: "%d:%02d", m, rem)
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6: (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default: (r, g, b) = (0x3B, 0x82, 0xF6)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: 1)
    }
}
