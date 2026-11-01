package com.anzor.balans;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/** Pure JVM helper. UI weekdays are Monday=0 ... Sunday=6; schedules use local wall time. */
public final class ReminderSchedule {
    private ReminderSchedule() {}

    public static long nextOccurrence(long nowMillis, ZoneId zone, int hour, int minute, int[] days) {
        if (zone == null || days == null || days.length == 0)
            throw new IllegalArgumentException("Choose at least one weekday");
        LocalTime time = LocalTime.of(hour, minute);
        boolean[] selected = new boolean[7];
        for (int day : days) {
            if (day < 0 || day > 6) throw new IllegalArgumentException("Weekday outside 0..6");
            selected[day] = true;
        }
        Instant now = Instant.ofEpochMilli(nowMillis);
        LocalDate today = now.atZone(zone).toLocalDate();
        for (int offset=0; offset<=7; offset++) {
            LocalDate date = today.plusDays(offset);
            int day = date.getDayOfWeek().getValue() - DayOfWeek.MONDAY.getValue();
            if (!selected[day]) continue;
            // java.time shifts nonexistent spring times forward and chooses the earlier
            // occurrence during fall overlap. There is only one reminder per selected day.
            ZonedDateTime candidate = date.atTime(time).atZone(zone);
            if (candidate.toInstant().isAfter(now)) return candidate.toInstant().toEpochMilli();
        }
        throw new IllegalArgumentException("Cannot find next weekday");
    }
}
