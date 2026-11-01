package com.anzor.balans;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/** Explicit alarm receiver plus protected system restore broadcasts. No background service. */
public final class ReminderReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        boolean alarm = ReminderScheduler.ACTION_ALARM.equals(action);
        if (!alarm && !Intent.ACTION_BOOT_COMPLETED.equals(action) && !Intent.ACTION_TIME_CHANGED.equals(action)
                && !Intent.ACTION_TIMEZONE_CHANGED.equals(action) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) return;
        Context app = context.getApplicationContext();
        Intent copy = new Intent(intent);
        PendingResult result = goAsync();
        ReminderScheduler.IO.execute(() -> {
            try {
                ReminderScheduler scheduler = new ReminderScheduler(app);
                if (alarm) scheduler.deliver(copy);
                else scheduler.reschedule();
            } catch (Exception e) {
                // Never log reminder content, and never start a retry loop or background service.
                Log.w("BalansReminders","Reminder operation failed: " + e.getClass().getSimpleName());
            } finally { result.finish(); }
        });
    }
}
