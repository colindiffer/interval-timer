package com.differapps.intervaltimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

private const val PREFS_NAME = "background_timer_actions"
private const val COMMAND_KEY = "command"

class BackgroundTimerActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val command = when (intent?.action) {
      "com.differapps.intervaltimer.BACKGROUND_TIMER_PAUSE" -> "pause"
      "com.differapps.intervaltimer.BACKGROUND_TIMER_RESUME" -> "resume"
      "com.differapps.intervaltimer.BACKGROUND_TIMER_SKIP" -> "skip"
      else -> null
    } ?: return

    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(COMMAND_KEY, command)
      .apply()
  }
}
