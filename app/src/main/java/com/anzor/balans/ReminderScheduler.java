package com.anzor.balans;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** App-context-only operations; all callers use IO to serialize edits and receiver delivery. */
final class ReminderScheduler {
    static final String ACTION_ALARM = "com.anzor.balans.REMINDER_ALARM";
    static final String CHANNEL = "balans_health_reminders";
    static final ExecutorService IO = Executors.newSingleThreadExecutor();
    private static final String PREFS = "balans_native_reminders";
    private static final String ENTRIES = "entries";
    private final Context context;
    private final SharedPreferences prefs;

    static final class Result {
        final String message;
        final boolean enabled;
        final int scheduled;
        Result(String message, boolean enabled, int scheduled) {
            this.message = message; this.enabled = enabled; this.scheduled = scheduled;
        }
    }

    private static final class Entry {
        long id;
        String text;
        int hour, minute;
        int[] days;
        boolean on;
        JSONObject json;
    }

    ReminderScheduler(Context context) {
        this.context = context.getApplicationContext();
        prefs = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static long integer(Object object, long min, long max, String field) {
        if (!(object instanceof Number)) throw new IllegalArgumentException("Некорректное поле " + field);
        double number = ((Number)object).doubleValue();
        long value = ((Number)object).longValue();
        if (Double.isNaN(number) || Double.isInfinite(number) || number != value || value < min || value > max)
            throw new IllegalArgumentException("Некорректное поле " + field);
        return value;
    }

    private static List<Entry> parse(String json) throws JSONException {
        if (json == null || json.length() > 128000) throw new IllegalArgumentException("Слишком большой список напоминаний.");
        JSONArray array = new JSONArray(json);
        if (array.length() > 100) throw new IllegalArgumentException("Можно сохранить не более 100 напоминаний.");
        List<Entry> entries = new ArrayList<>();
        Set<Long> ids = new HashSet<>();
        for (int i=0; i<array.length(); i++) {
            JSONObject item = array.getJSONObject(i);
            Entry e = new Entry();
            e.id = integer(item.get("id"), 1, 9007199254740991L, "id");
            if (!ids.add(e.id)) throw new IllegalArgumentException("Повторяющийся id напоминания.");
            if (!(item.get("t") instanceof String) || !(item.get("tm") instanceof String)
                    || !(item.get("on") instanceof Boolean))
                throw new IllegalArgumentException("Некорректные поля напоминания.");
            e.text = item.getString("t").trim();
            if (e.text.isEmpty() || e.text.length() > 160 || e.text.matches("(?s).*\\p{Cntrl}.*"))
                throw new IllegalArgumentException("Текст напоминания: от 1 до 160 символов, без управляющих знаков.");
            String time = item.getString("tm");
            if (!time.matches("(?:[01][0-9]|2[0-3]):[0-5][0-9]"))
                throw new IllegalArgumentException("Время должно быть в формате ЧЧ:ММ.");
            e.hour = Integer.parseInt(time.substring(0,2));
            e.minute = Integer.parseInt(time.substring(3,5));
            e.on = item.getBoolean("on");
            JSONArray days = item.getJSONArray("days");
            if (days.length() > 7 || (e.on && days.length() == 0))
                throw new IllegalArgumentException("Выберите дни недели для включённого напоминания.");
            e.days = new int[days.length()];
            Set<Integer> uniqueDays = new HashSet<>();
            for (int j=0; j<days.length(); j++) {
                int day = (int)integer(days.get(j), 0, 6, "days");
                if (!uniqueDays.add(day)) throw new IllegalArgumentException("Дни недели не должны повторяться.");
                e.days[j] = day;
            }
            e.json = new JSONObject().put("id",e.id).put("t",e.text).put("tm",time)
                    .put("on",e.on).put("days",new JSONArray(e.days));
            entries.add(e);
        }
        return entries;
    }

    private List<Entry> saved() throws JSONException {
        return parse(prefs.getString(ENTRIES,"[]"));
    }

    Result sync(String json, boolean hideText) throws JSONException {
        List<Entry> next = parse(json); // Entire payload must validate before touching active alarms.
        List<Entry> previous = saved();
        JSONArray normalized = new JSONArray();
        for (Entry entry : next) normalized.put(entry.json);
        long revision = prefs.getLong("revision",0) + 1;
        if (!prefs.edit().putString(ENTRIES,normalized.toString()).putBoolean("hideText",hideText)
                .putLong("revision",revision).commit())
            throw new IllegalStateException("Не удалось сохранить напоминания на устройстве.");
        for (Entry e : previous) {
            cancel(e.id);
            cancelNotification(e.id); // Removed/edited text and privacy changes must not leave old previews.
        }
        for (Entry e : next) cancel(e.id);
        return schedule(next, revision);
    }

    Result reschedule() throws JSONException {
        List<Entry> entries = saved();
        for (Entry e : entries) cancel(e.id);
        return schedule(entries,prefs.getLong("revision",0));
    }

    private Result schedule(List<Entry> entries, long revision) {
        channel();
        boolean allowed = allowed();
        if (!allowed) return new Result("Напоминания сохранены, но уведомления запрещены в настройках Android.",false,0);
        int scheduled = 0;
        for (Entry entry : entries) if (entry.on) {
            scheduleOne(entry,revision);
            scheduled++;
        }
        return new Result(scheduled == 0 ? "Все напоминания выключены."
                : "Напоминания запланированы: " + scheduled + ". Android может задерживать доставку.",true,scheduled);
    }

    private void scheduleOne(Entry entry, long revision) {
        AlarmManager manager = context.getSystemService(AlarmManager.class);
        if (manager == null) throw new IllegalStateException("Планировщик Android недоступен.");
        long trigger = ReminderSchedule.nextOccurrence(System.currentTimeMillis(), ZoneId.systemDefault(),
                entry.hour,entry.minute,entry.days);
        Intent intent = alarmIntent(entry.id).putExtra("id",entry.id).putExtra("revision",revision)
                .putExtra("scheduledFor",trigger);
        PendingIntent pending = PendingIntent.getBroadcast(context,Long.hashCode(entry.id),intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,trigger,pending);
    }

    private Intent alarmIntent(long id) {
        // URI participates in PendingIntent identity, preventing hash collisions between long ids.
        return new Intent(context,ReminderReceiver.class).setAction(ACTION_ALARM)
                .setData(Uri.parse("balans://native-reminder/" + id));
    }

    private void cancel(long id) {
        PendingIntent pending = PendingIntent.getBroadcast(context,Long.hashCode(id),alarmIntent(id),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        if (pending != null) {
            AlarmManager manager = context.getSystemService(AlarmManager.class);
            if (manager != null) manager.cancel(pending);
            pending.cancel();
        }
    }

    private void cancelNotification(long id) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) manager.cancel("balans.reminder." + id,Long.hashCode(id));
    }

    Result clear() throws JSONException {
        for (Entry e : saved()) {
            cancel(e.id);
            cancelNotification(e.id);
        }
        if (!prefs.edit().putString(ENTRIES,"[]").putLong("revision",prefs.getLong("revision",0)+1).commit())
            throw new IllegalStateException("Не удалось очистить напоминания.");
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) manager.cancel("balans.reminder.test",0);
        return new Result("Напоминания отключены и удалены из планировщика.",allowed(),0);
    }

    void deliver(Intent intent) throws JSONException {
        long id = intent.getLongExtra("id",-1);
        long revision = prefs.getLong("revision",0);
        if (intent.getLongExtra("revision",-1) != revision) return; // Ignore a removed/edited stale alarm.
        for (Entry entry : saved()) if (entry.id == id && entry.on) {
            if (allowed()) {
                show("balans.reminder." + id,Long.hashCode(id),entry.text,prefs.getBoolean("hideText",false));
                scheduleOne(entry,revision);
            }
            return;
        }
    }

    Result test() {
        channel();
        if (!allowed()) return new Result("Android запрещает уведомления. Разрешите их в настройках приложения.",false,0);
        show("balans.reminder.test",0,"Это проверка напоминаний.",prefs.getBoolean("hideText",false));
        return new Result("Тестовое уведомление отправлено в панель уведомлений.",true,-1);
    }

    private void channel() {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL,"Напоминания о здоровье",NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Локальные напоминания приложения Баланс.");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        manager.createNotificationChannel(channel); // Existing user channel preferences remain authoritative.
    }

    boolean allowed() {
        if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || !manager.areNotificationsEnabled()) return false;
        NotificationChannel channel = manager.getNotificationChannel(CHANNEL);
        return channel == null || channel.getImportance() != NotificationManager.IMPORTANCE_NONE;
    }

    @SuppressLint("MissingPermission")
    private void show(String tag, int id, String text, boolean hideText) {
        channel();
        if (!allowed()) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        Intent open = new Intent(context,MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent content = PendingIntent.getActivity(context,0,open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification publicVersion = new Notification.Builder(context,CHANNEL)
                .setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("Баланс")
                .setContentText("Откройте приложение, чтобы посмотреть напоминание.").build();
        Notification notification = new Notification.Builder(context,CHANNEL)
                .setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("Баланс · напоминание")
                .setContentText(hideText ? "Откройте приложение, чтобы посмотреть напоминание." : text)
                .setCategory(Notification.CATEGORY_REMINDER).setVisibility(Notification.VISIBILITY_PRIVATE)
                .setPublicVersion(publicVersion).setContentIntent(content).setAutoCancel(true).build();
        manager.notify(tag,id,notification);
    }
}
