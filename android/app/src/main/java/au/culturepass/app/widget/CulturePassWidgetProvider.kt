package au.culturepass.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import au.culturepass.app.MainActivity
import au.culturepass.app.R
import org.json.JSONObject

class CulturePassWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray
  ) {
    val prefs = context.getSharedPreferences(CulturePassWidgetModule.PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(CulturePassWidgetModule.KEY_JSON, null)
    var primary = "CulturePass"
    var secondary = "Open app"
    var deeplink = "culturepass://"

    if (raw != null) {
      try {
        val o = JSONObject(raw)
        primary = o.optString("primaryLine", primary)
        secondary = o.optString("secondaryLine", secondary)
        deeplink = o.optString("deeplink", deeplink)
      } catch (_: Exception) {
        // keep defaults
      }
    }

    val views = RemoteViews(context.packageName, R.layout.culturepass_appwidget)
    views.setTextViewText(R.id.widget_primary, primary)
    views.setTextViewText(R.id.widget_secondary, secondary)

    val intent = Intent(context, MainActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      data = Uri.parse(deeplink)
      action = Intent.ACTION_VIEW
    }
    val pending = PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    views.setOnClickPendingIntent(R.id.widget_root, pending)

    for (id in appWidgetIds) {
      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val cn = ComponentName(context, CulturePassWidgetProvider::class.java)
      val ids = mgr.getAppWidgetIds(cn)
      if (ids.isEmpty()) return
      CulturePassWidgetProvider().onUpdate(context, mgr, ids)
    }
  }
}
