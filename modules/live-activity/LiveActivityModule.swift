import ExpoModulesCore
import ActivityKit
import UIKit

// MARK: - Attributes (must be identical to the widget extension)

@available(iOS 16.2, *)
struct TimerActivityAttributes: ActivityAttributes {
    public let workoutName: String

    public struct ContentState: Codable & Hashable {
        var phaseName: String
        var phaseColorHex: String
        var endTime: Date
        var phaseIndex: Int
        var totalPhases: Int
        var isPaused: Bool
        var pausedSecondsRemaining: Int
    }
}

// MARK: - Module

public class LiveActivityModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LiveActivity")

        // Returns the activity id string, or nil on iOS < 16.2 or if activities are disabled.
        AsyncFunction("startActivity") { (options: [String: Any], promise: Promise) in
            guard #available(iOS 16.2, *) else {
                promise.resolve(nil as String?)
                return
            }
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                promise.resolve(nil as String?)
                return
            }
            do {
                let attrs = try Self.buildAttributes(from: options)
                let stateDict = options["initialState"] as? [String: Any]
                let state = try Self.buildState(from: stateDict)
                let activity = try Activity<TimerActivityAttributes>.request(
                    attributes: attrs,
                    content: ActivityContent(state: state, staleDate: nil),
                    pushType: nil
                )
                promise.resolve(activity.id)
            } catch {
                promise.reject("START_FAILED", error.localizedDescription)
            }
        }

        AsyncFunction("updateActivity") { (activityId: String, stateDict: [String: Any], promise: Promise) in
            guard #available(iOS 16.2, *) else {
                promise.resolve(nil)
                return
            }
            guard let activity = Activity<TimerActivityAttributes>.activities.first(where: { $0.id == activityId }) else {
                // Activity may have been dismissed — not an error.
                promise.resolve(nil)
                return
            }
            do {
                let newState = try Self.buildState(from: stateDict)
                await activity.update(ActivityContent(state: newState, staleDate: nil))
                promise.resolve(nil)
            } catch {
                promise.reject("UPDATE_FAILED", error.localizedDescription)
            }
        }

        AsyncFunction("endActivity") { (activityId: String, promise: Promise) in
            guard #available(iOS 16.2, *) else {
                promise.resolve(nil)
                return
            }
            guard let activity = Activity<TimerActivityAttributes>.activities.first(where: { $0.id == activityId }) else {
                promise.resolve(nil)
                return
            }
            await activity.end(nil, dismissalPolicy: .immediate)
            promise.resolve(nil)
        }

        Function("isSupported") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        Function("getSupportStatus") { () -> [String: Any] in
            if #available(iOS 16.2, *) {
                let enabled = ActivityAuthorizationInfo().areActivitiesEnabled
                return [
                    "isAvailable": enabled,
                    "reason": enabled ? "available" : "activities_disabled",
                    "osVersion": UIDevice.current.systemVersion
                ]
            }

            return [
                "isAvailable": false,
                "reason": "ios_version_too_old",
                "osVersion": UIDevice.current.systemVersion
            ]
        }
    }

    // MARK: - Helpers

    @available(iOS 16.2, *)
    private static func buildAttributes(from dict: [String: Any]) throws -> TimerActivityAttributes {
        guard let name = dict["workoutName"] as? String else {
            throw NSError(domain: "LiveActivity", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Missing workoutName"])
        }
        return TimerActivityAttributes(workoutName: name)
    }

    @available(iOS 16.2, *)
    private static func buildState(from dict: [String: Any]?) throws -> TimerActivityAttributes.ContentState {
        guard
            let d = dict,
            let phaseName = d["phaseName"] as? String,
            let hex = d["phaseColorHex"] as? String,
            let endTimeDouble = d["endTime"] as? Double,
            let phaseIndex = d["phaseIndex"] as? Int,
            let totalPhases = d["totalPhases"] as? Int
        else {
            throw NSError(domain: "LiveActivity", code: 2,
                          userInfo: [NSLocalizedDescriptionKey: "Invalid state dict"])
        }
        let isPaused = d["isPaused"] as? Bool ?? false
        let pausedSeconds = d["pausedSecondsRemaining"] as? Int ?? 0

        // endTime must be in the future — clamp to at least 1 second ahead
        let endDate = max(Date(timeIntervalSince1970: endTimeDouble), Date().addingTimeInterval(1))

        return TimerActivityAttributes.ContentState(
            phaseName: phaseName,
            phaseColorHex: hex,
            endTime: endDate,
            phaseIndex: phaseIndex,
            totalPhases: totalPhases,
            isPaused: isPaused,
            pausedSecondsRemaining: pausedSeconds
        )
    }
}
