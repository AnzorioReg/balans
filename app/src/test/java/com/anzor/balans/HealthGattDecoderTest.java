package com.anzor.balans;

import org.junit.Test;
import java.util.List;
import java.util.Map;
import static org.junit.Assert.*;

public class HealthGattDecoderTest {
    @SuppressWarnings("unchecked")
    private double value(Map<String,Object> result, int index) {
        return (double)((List<Map<String,Object>>)result.get("measurements")).get(index).get("value");
    }
    @Test public void ieee11073SpecialSignedAndExponent() {
        assertEquals(36.5, HealthGattDecoder.sfloat(0xf16d), .000001);
        assertEquals(-1, HealthGattDecoder.sfloat(0x0fff), .000001);
        assertEquals(-1.2, HealthGattDecoder.ieeeFloat(0xffffffF4L), .000001);
        assertEquals(36.5, HealthGattDecoder.ieeeFloat(0xff00016dL), .000001);
        for (int i=0x7fe;i<=0x802;i++) assertTrue(Double.isNaN(HealthGattDecoder.sfloat(i)));
        for (int i=0x7ffffe;i<=0x800002;i++) assertTrue(Double.isNaN(HealthGattDecoder.ieeeFloat(i)));
    }
    @Test public void heartRate8And16AndRr() {
        assertEquals(72, value(HealthGattDecoder.decode("2a37",new byte[]{0,72}),0),0);
        Map<String,Object> hr = HealthGattDecoder.decode("2a37",new byte[]{17,44,1,0,4});
        assertEquals(300,value(hr,0),0);
        assertEquals(1.0, ((List<?>)hr.get("rrIntervalsSeconds")).get(0));
    }
    @Test public void weightKilogramsAndPounds() {
        assertEquals(70, value(HealthGattDecoder.decode("2a9d",new byte[]{0,(byte)0xb0,0x36}),0),.0001);
        assertEquals(150, value(HealthGattDecoder.decode("2a9d",new byte[]{1,(byte)0x98,0x3a}),0),.0001);
    }
    @Test public void bloodPressureAndPulse() {
        Map<String,Object> bp = HealthGattDecoder.decode("2a35",new byte[]{4,120,0,80,0,93,0,65,0});
        assertEquals(120,value(bp,0),0);
        assertEquals(80,value(bp,1),0);
        assertEquals(65,value(bp,3),0);
    }
    @Test public void temperatureAndPulseOximeter() {
        assertEquals(36.5,value(HealthGattDecoder.decode("2a1c",new byte[]{0,0x6d,1,0,(byte)0xff}),0),.00001);
        Map<String,Object> ox=HealthGattDecoder.decode("2a5e",new byte[]{0,98,0,70,0});
        assertEquals(98,value(ox,0),0);
        assertEquals(70,value(ox,1),0);
    }
    @Test public void glucoseMolAndKgPerLiter() {
        byte[] mol={6,1,0,(byte)0xe8,7,1,2,3,4,5,55,(byte)0xc0,0x11};
        assertEquals(5.5,value(HealthGattDecoder.decode("2a18",mol),0),.00001);
        byte[] kg={2,1,0,(byte)0xe8,7,1,2,3,4,5,10,(byte)0xc0,0x11};
        assertEquals(100,value(HealthGattDecoder.decode("2a18",kg),0),.00001);
    }
    @Test public void unavailableValueNotEmitted() {
        Map<String,Object> ox=HealthGattDecoder.decode("2a5e",new byte[]{0,(byte)0xff,7,70,0});
        assertEquals(1,((List<?>)ox.get("measurements")).size());
        assertEquals(70,value(ox,0),0);
    }
    @Test(expected=IllegalArgumentException.class) public void truncatedRejected() {
        HealthGattDecoder.decode("2a35",new byte[]{0,120,0});
    }
    @Test(expected=IllegalArgumentException.class) public void oddRrRejected() {
        HealthGattDecoder.decode("2a37",new byte[]{16,70,1});
    }
    @Test public void standardUuidOnly() {
        assertTrue(HealthGattDecoder.supports("00002a37-0000-1000-8000-00805f9b34fb"));
        assertFalse(HealthGattDecoder.supports("00002a37-ffff-1000-8000-00805f9b34fb"));
    }
    @Test public void weightOptionalTimestampUserBmiAndHeight() {
        Map<String,Object> w = HealthGattDecoder.decode("2a9d",
                new byte[]{14,(byte)0xb0,0x36,(byte)0xe8,7,1,2,3,4,5,9,(byte)0xf0,0,(byte)0xd0,6});
        assertEquals(24,value(w,1),.00001);
        assertEquals(1.744,value(w,2),.00001);
        assertEquals(9,w.get("userId"));
        assertEquals("2024-01-02T03:04:05",w.get("deviceTimestamp"));
    }
    @Test public void pulseOxOptionalQualityFields() {
        Map<String,Object> ox=HealthGattDecoder.decode("2a5e",
                new byte[]{30,98,0,70,0,1,2,3,4,5,20,(byte)0xf0});
        assertEquals(513,ox.get("measurementStatus"));
        assertEquals(328707,ox.get("deviceSensorStatus"));
        assertEquals(2,value(ox,2),.00001);
        assertEquals(true,ox.get("deviceClockNotSet"));
    }
    @Test public void sensorContactAndEnergy() {
        Map<String,Object> hr=HealthGattDecoder.decode("2a37",new byte[]{14,70,12,0});
        assertEquals(true,hr.get("sensorContact"));
        assertEquals(12,value(hr,1),.00001);
    }
    @Test public void unavailableWeightIsNot65535() {
        assertEquals(true,HealthGattDecoder.decode("2a9d",new byte[]{0,-1,-1}).get("unavailableValues"));
    }
    @Test(expected=IllegalArgumentException.class) public void unknownUuidRejected() {
        HealthGattDecoder.decode("2a19",new byte[]{0});
    }
    @Test(expected=IllegalArgumentException.class) public void nullPacketRejected() {
        HealthGattDecoder.decode("2a37",null);
    }
}
