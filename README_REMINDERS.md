# Native reminders integration

The native reminder bridge saves local schedules and installs one future inexact alarm per enabled reminder. It does not require a background service, internet access, or the exact-alarm permission.

## MainActivity

Construct `new ReminderBridge(this, webView)` in `onCreate` before the activity reaches STARTED, alongside the other bridges. Expose it with `webView.addJavascriptInterface(reminderBridge, "BalansReminders")`, then call `reminderBridge.close()` before destroying the WebView and remove the JavaScript interface.

Do not close or clear reminders in `onStop`. Saved alarms must remain active when the activity closes.

## Manifest

Add these declarations, without requesting exact-alarm access:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

Register this receiver inside the application:

```xml
<receiver android:name=".ReminderReceiver" android:enabled="true" android:exported="false">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.TIME_SET" />
        <action android:name="android.intent.action.TIMEZONE_CHANGED" />
        <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
    </intent-filter>
</receiver>
```

## JavaScript contract

Call `BalansReminders.sync(JSON.stringify(reminders), hideText)` after saving or changing reminders or notification-privacy settings. The input is an array of `{id,t,tm,days,on}`, with a positive safe-integer id, text of 1–160 characters, 24-hour `HH:mm` time, unique weekdays from Monday=0 to Sunday=6, and a boolean enabled flag. At most 100 entries are accepted; enabled reminders require at least one weekday.

Sync never opens a permission popup. Explicitly call `BalansReminders.requestPermission()` when the user enables native notifications; on Android 13 and later, this requests notification permission. `BalansReminders.test()` is an explicit user action that requests permission if needed and then sends a real test notification, while `BalansReminders.clear()` deletes native schedules and their notifications.

Listen to `window.onReminderEvent(event)`. Each event contains `message` and `enabled`, where enabled means Android currently permits notification delivery, not that any reminder is switched on. Successful scheduling reports `scheduled`; errors may report `error`, and test delivery does not modify the schedule count.

## Delivery and privacy limitations

Android may delay or batch `setAndAllowWhileIdle` alarms, including during battery-saving or idle modes. Several reminders close together can be delayed, and exact delivery times are not promised ([Android AlarmManager reference](https://developer.android.com/reference/android/app/AlarmManager#setAndAllowWhileIdle(int,long,android.app.PendingIntent))).

The receiver schedules the next selected weekday after each delivery and restores future alarms after reboot, app update, or clock/timezone changes. A missed reminder is not replayed on reboot; force-stopping the app or restrictive manufacturer battery settings can prevent delivery until the app is reopened. Re-sync on startup and after a permissions/settings change so that saved reminders are reinstalled when notifications become available.

The notification channel uses `IMPORTANCE_DEFAULT`, not high importance. Android and the user's channel settings ultimately control sound, visibility, and alert behavior; the app does not intentionally request a heads-up alert.

Notification lock-screen content uses a generic public version and PRIVATE visibility. With `hideText=true`, the full notification also uses generic text rather than the saved reminder text; native schedules remain in the app's private preferences.

Schedules use the current local timezone. During a daylight-saving gap, Java time shifts the local occurrence forward; during an overlap, only the earlier occurrence is selected, with no second notification that day.

These are general-purpose wellness reminders, not guaranteed medical alarms. Do not rely on them for time-critical medication or emergency alerts.
