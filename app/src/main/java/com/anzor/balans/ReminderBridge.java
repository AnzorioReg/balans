package com.anzor.balans;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import org.json.JSONException;
import org.json.JSONObject;

/** Trusted bundled JS only. Construct before Activity STARTED and close before WebView.destroy. */
public final class ReminderBridge implements AutoCloseable {
    private final MainActivity activity;
    private final WebView web;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ReminderScheduler scheduler;
    private final ActivityResultLauncher<String> permission;
    private volatile boolean closed;
    private boolean requesting, pendingTest;

    public ReminderBridge(MainActivity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        scheduler = new ReminderScheduler(activity);
        permission = activity.registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
            requesting = false;
            if (closed) return;
            boolean testAfterGrant = pendingTest;
            pendingTest = false;
            if (!granted) {
                emit("Уведомления не разрешены. Напоминания сохранены; разрешение можно изменить в настройках Android.",false,0,"permission_denied");
                return;
            }
            work(() -> {
                ReminderScheduler.Result result = scheduler.reschedule();
                if (testAfterGrant) result = scheduler.test();
                return result;
            });
        });
    }

    /** Saves/schedules but NEVER opens the permission dialog. Call requestPermission explicitly. */
    @JavascriptInterface public void sync(String json, boolean hideText) {
        work(() -> scheduler.sync(json,hideText));
    }
    @JavascriptInterface public void requestPermission() {
        main.post(() -> request(false));
    }
    /** Explicit user action: asks for permission if needed, then posts a real notification. */
    @JavascriptInterface public void test() {
        main.post(() -> request(true));
    }
    @JavascriptInterface public void clear() { work(scheduler::clear); }

    private void request(boolean test) {
        if (closed) return;
        if (Build.VERSION.SDK_INT >= 33 && activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            pendingTest |= test;
            if (!requesting) {
                requesting = true;
                try { permission.launch(Manifest.permission.POST_NOTIFICATIONS); }
                catch (RuntimeException e) {
                    requesting = pendingTest = false;
                    emit("Не удалось открыть запрос разрешения. Проверьте настройки уведомлений Android.",false,0,"permission_request_failed");
                }
            }
        } else work(test ? scheduler::test : scheduler::reschedule);
    }

    private interface Task { ReminderScheduler.Result run() throws Exception; }
    private void work(Task task) {
        if (closed) return;
        ReminderScheduler.IO.execute(() -> {
            // A user-requested save must finish even if the Activity closes meanwhile.
            // Only UI event delivery is suppressed after close().
            try {
                ReminderScheduler.Result result = task.run();
                emit(result.message,result.enabled,result.scheduled,null);
            } catch (Exception e) {
                String message = e instanceof IllegalArgumentException ? e.getMessage()
                        : e instanceof JSONException ? "Проверьте формат времени, дней и текста напоминаний."
                        : "Не удалось обновить напоминания в Android. Проверьте настройки приложения.";
                emit(message,scheduler.allowed(),-1,"reminder_error");
            }
        });
    }

    private void emit(String message, boolean enabled, int scheduled, String error) {
        main.post(() -> {
            if (closed) return;
            JSONObject data = new JSONObject();
            try {
                data.put("message",message).put("enabled",enabled);
                if (scheduled >= 0) data.put("scheduled",scheduled);
                if (error != null) data.put("error",error);
            } catch (JSONException ignored) { return; }
            web.evaluateJavascript("if(typeof window.onReminderEvent==='function'){window.onReminderEvent(JSON.parse("
                    + JSONObject.quote(data.toString()) + "));}",null);
        });
    }

    /** Does NOT cancel saved alarms. Their receiver owns delivery after the activity closes. */
    @Override public void close() {
        if (Looper.myLooper() != Looper.getMainLooper()) { main.post(this::close); return; }
        if (closed) return;
        closed = true;
        pendingTest = false;
        permission.unregister();
        main.removeCallbacksAndMessages(null);
    }
}
