package com.lifeos.planner

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences

/**
 * Android Home Screen Widget for the MERN Life OS Planner.
 * Hooks into Capacitor's shared SharedPreferences storage and paints Today's Top Task and No-Reels Streak.
 */
class AppWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Run update sequence across all placed instances of this widget
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val SHARED_PREFS_NAME = "CapacitorStorage"
        private const val STREAK_KEY = "noReelsStreak"
        private const val TASK_KEY = "todayTopTask"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Retrieve Capacitor's local SharedPreferences
            val prefs: SharedPreferences = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
            
            // SharedPreferences written by Capacitor use simple key strings
            val streak = prefs.getString(STREAK_KEY, "0") ?: "0"
            val topTask = prefs.getString(TASK_KEY, "Create today's plan") ?: "Create today's plan"

            // Construct our RemoteViews layout (Referencing widget_layout.xml)
            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            
            // Set text elements inside views dynamically
            views.setTextViewText(R.id.widget_streak_count, streak)
            views.setTextViewText(R.id.widget_task_text, topTask)
            
            // Visual indicator for flame status
            val intStreak = streak.toIntOrNull() ?: 0
            if (intStreak > 0) {
                views.setTextViewText(R.id.widget_status_text, "🔥 FLAME ACTIVE")
            } else {
                views.setTextViewText(R.id.widget_status_text, "🌱 MISSION UNLOCKED")
            }

            // Request the AppWidgetManager to commit layouts
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
