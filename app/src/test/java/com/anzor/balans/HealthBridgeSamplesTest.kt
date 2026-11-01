package com.anzor.balans

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HealthBridgeSamplesTest {
    @Test fun emptyBucketAcceptsSample() {
        assertTrue(shouldReplaceHourlySample(null,100L))
    }
    @Test fun newerSampleReplacesOlderSample() {
        assertTrue(shouldReplaceHourlySample(100L,200L))
    }
    @Test fun olderSampleCannotOverwriteNewerSample() {
        assertFalse(shouldReplaceHourlySample(200L,100L))
    }
    @Test fun equalTimestampDoesNotReplaceExistingPoint() {
        assertFalse(shouldReplaceHourlySample(200L,200L))
    }
    @Test fun overlappingRecordOrderStillRetainsLatest() {
        var retained: Long? = null
        for (timestamp in listOf(250L,100L,200L,300L,50L,300L))
            if (shouldReplaceHourlySample(retained,timestamp)) retained = timestamp
        org.junit.Assert.assertEquals(300L,retained)
    }
}
