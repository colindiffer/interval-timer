package com.differapps.intervaltimer

import android.content.Context
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

private const val PREFS_NAME = "background_timer_actions"
private const val COMMAND_KEY = "command"

class BackgroundTimerActionsModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "BackgroundTimerActions"

  @ReactMethod
  fun readAndClearCommand(promise: Promise) {
    try {
      val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val command = prefs.getString(COMMAND_KEY, null)
      prefs.edit().remove(COMMAND_KEY).apply()
      promise.resolve(command)
    } catch (error: Exception) {
      promise.reject("BG_TIMER_COMMAND_READ_FAILED", error)
    }
  }
}
