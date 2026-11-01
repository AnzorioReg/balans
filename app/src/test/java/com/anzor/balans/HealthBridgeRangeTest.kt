package com.anzor.balans

import java.time.Instant
import java.time.ZoneId
import java.time.Duration
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class HealthBridgeRangeTest {
    @Test fun rangeOneDayStartsAtLocalMidnight() {
        val end = Instant.parse("2026-10-31T12:00:00Z").toEpochMilli()
        assertEquals(Instant.parse("2026-10-30T21:00:00Z").toEpochMilli(),
            historyRangeStart(end,1,ZoneId.of("Europe/Moscow")))
    }
    @Test fun calendarRangeRespectsDstDayLength() {
        val end = Instant.parse("2026-03-29T20:00:00Z").toEpochMilli()
        assertEquals(Instant.parse("2026-03-28T23:00:00Z").toEpochMilli(),
            historyRangeStart(end,1,ZoneId.of("Europe/Berlin")))
    }
    @Test fun requestedWeekContainsSevenCalendarDates() {
        val end = Instant.parse("2026-10-31T12:00:00Z").toEpochMilli()
        assertEquals(Instant.parse("2026-10-25T00:00:00Z").toEpochMilli(),
            historyRangeStart(end,7,ZoneId.of("UTC")))
    }
    @Test(expected=IllegalArgumentException::class) fun invalidZeroRejected() { checkedHistoryDays(0) }
    @Test(expected=IllegalArgumentException::class) fun unboundedHistoryRejected() { checkedHistoryDays(367) }
    @Test fun acceptsFullYear() { assertEquals(366,checkedHistoryDays(366)) }
    @Test fun recentSamplesStayHourly() {
        val end = Instant.parse("2026-10-31T12:00:00Z").toEpochMilli()
        assertEquals(1,denseHistoryBucketHours(end-Duration.ofDays(30).toMillis(),end))
        assertEquals(6,denseHistoryBucketHours(end-Duration.ofDays(30).toMillis()-1,end))
    }
    @Test fun fullPermissionDoesNotClampHistory() = runBlocking {
        var probes = 0
        assertEquals(366,resolveReadableHistoryDays(366) { probes++; true })
        assertEquals(1,probes)
    }
    @Test fun deniedHistoryFindsAllowedSuffixWithoutGuessingGrantDate() = runBlocking {
        var probes = 0
        assertEquals(77,resolveReadableHistoryDays(366) { days -> probes++; days <= 77 })
        assertTrue(probes <= 11)
    }
    @Test fun oneAllowedDayIsRetained() = runBlocking {
        assertEquals(1,resolveReadableHistoryDays(366) { days -> days == 1 })
    }
    @Test(expected=SecurityException::class) fun revokedRecentAccessAborts() = runBlocking {
        resolveReadableHistoryDays(366) { false }
        Unit
    }
    @Test fun ordinarySleepSessionKeepsEveryStage() {
        assertArrayEquals(IntArray(120) { it },retainedSleepStageIndices(120))
    }
    @Test fun pathologicalSleepSessionIsBoundedButKeepsEndpoints() {
        val selected = retainedSleepStageIndices(10000)
        assertEquals(200,selected.size)
        assertEquals(0,selected.first())
        assertEquals(9999,selected.last())
        assertTrue(selected.toList().zipWithNext().all { (first,second) -> first < second })
    }
    @Test fun emptySleepStagesStayEmpty() {
        assertEquals(0,retainedSleepStageIndices(0).size)
    }
}
