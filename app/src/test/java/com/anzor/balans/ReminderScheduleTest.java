package com.anzor.balans;

import org.junit.Test;
import java.time.Instant;
import java.time.ZoneId;
import static org.junit.Assert.assertEquals;

public class ReminderScheduleTest {
    private long at(String instant) { return Instant.parse(instant).toEpochMilli(); }
    private long next(String now, String zone, int hour, int minute, int... days) {
        return ReminderSchedule.nextOccurrence(at(now),ZoneId.of(zone),hour,minute,days);
    }
    @Test public void mondayIndexZeroTodayBeforeTime() {
        assertEquals(at("2026-11-02T08:30:00Z"),next("2026-11-02T08:00:00Z","UTC",8,30,0));
    }
    @Test public void exactTimeMovesToNextSelectedDay() {
        assertEquals(at("2026-11-09T08:30:00Z"),next("2026-11-02T08:30:00Z","UTC",8,30,0));
    }
    @Test public void sundayIndexSix() {
        assertEquals(at("2026-11-08T08:30:00Z"),next("2026-11-02T08:00:00Z","UTC",8,30,6));
    }
    @Test public void choosesEarliestSelectedWeekday() {
        assertEquals(at("2026-11-03T08:30:00Z"),next("2026-11-02T09:00:00Z","UTC",8,30,4,1,0));
    }
    @Test public void respectsLocalTimezone() {
        assertEquals(at("2026-11-02T05:30:00Z"),next("2026-11-02T05:00:00Z","Europe/Moscow",8,30,0));
    }
    @Test public void dstGapShiftsForward() {
        assertEquals(at("2026-03-29T01:30:00Z"),next("2026-03-28T23:00:00Z","Europe/Berlin",2,30,6));
    }
    @Test public void dstOverlapOnlyOneOccurrencePerDay() {
        assertEquals(at("2026-11-01T01:30:00Z"),next("2026-10-25T00:40:00Z","Europe/Berlin",2,30,6));
    }
    @Test(expected=IllegalArgumentException.class) public void noSelectedDaysRejected() {
        next("2026-11-02T08:00:00Z","UTC",8,30);
    }
    @Test(expected=IllegalArgumentException.class) public void invalidDayRejected() {
        next("2026-11-02T08:00:00Z","UTC",8,30,7);
    }
}
