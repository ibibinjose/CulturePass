package au.culturepass.app.widget

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CulturePassWidgetModule(private val ctx: ReactApplicationContext) :
  ReactContextBaseJavaModule(ctx) {

  override fun getName(): String = "CulturePassWidgetModule"

  @ReactMethod
  fun updateSnapshot(json: String) {
    val prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit().putString(KEY_JSON, json).apply()
    CulturePassWidgetProvider.refreshAll(ctx)
  }

  companion object {
    const val PREFS_NAME = "culturepass_widget_prefs"
    const val KEY_JSON = "snapshot_json"
  }
}
