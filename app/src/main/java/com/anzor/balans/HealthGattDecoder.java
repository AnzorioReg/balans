package com.anzor.balans;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Pure Java Bluetooth SIG health measurement decoder. No Android or JSON dependency. */
public final class HealthGattDecoder {
    private HealthGattDecoder() {}

    public static boolean supports(String uuid) {
        String id = shortId(uuid);
        return id.equals("2a37") || id.equals("2a9d") || id.equals("2a35")
                || id.equals("2a1c") || id.equals("2a5e") || id.equals("2a18");
    }

    private static String shortId(String uuid) {
        String id = uuid.toLowerCase(Locale.ROOT);
        return id.length() == 36 && id.startsWith("0000")
                && id.endsWith("-0000-1000-8000-00805f9b34fb") ? id.substring(4, 8) : id;
    }

    /** Special IEEE-11073 values are NaN, never a plausible clinical number. */
    public static double sfloat(int raw) {
        int m = raw & 0xfff;
        if (m >= 0x7fe && m <= 0x802) return Double.NaN;
        if ((m & 0x800) != 0) m -= 0x1000;
        int e = (raw >>> 12) & 15;
        if (e >= 8) e -= 16;
        return m * Math.pow(10, e);
    }

    public static double ieeeFloat(long raw) {
        int m = (int) (raw & 0xffffff);
        if (m >= 0x7ffffe && m <= 0x800002) return Double.NaN;
        if ((m & 0x800000) != 0) m -= 0x1000000;
        int e = (int) ((raw >>> 24) & 255);
        if (e >= 128) e -= 256;
        return m * Math.pow(10, e);
    }

    private static final class Cursor {
        final byte[] bytes;
        int p;
        Cursor(byte[] bytes) {
            if (bytes == null) throw new IllegalArgumentException("Empty measurement");
            this.bytes = bytes;
        }
        int u8() {
            if (p >= bytes.length) throw new IllegalArgumentException("Truncated measurement");
            return bytes[p++] & 255;
        }
        int u16() { return u8() | u8() << 8; }
        int i16() { return (short) u16(); }
        long u32() { return (long) u16() | (long) u16() << 16; }
        double sf() { return sfloat(u16()); }
        String date() {
            int y = u16(), m = u8(), d = u8(), h = u8(), min = u8(), s = u8();
            // Bluetooth Date Time may contain unknown (zero) year/month/day.
            return String.format(Locale.ROOT, "%04d-%02d-%02dT%02d:%02d:%02d", y,m,d,h,min,s);
        }
    }

    private static void add(List<Map<String,Object>> list, String metric, double value, String unit) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return;
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("metric", metric);
        m.put("value", value);
        m.put("unit", unit);
        list.add(m);
    }

    public static Map<String,Object> decode(String uuid, byte[] bytes) {
        Cursor c = new Cursor(bytes);
        Map<String,Object> out = new LinkedHashMap<>();
        List<Map<String,Object>> values = new ArrayList<>();
        out.put("measurements", values);
        String id = shortId(uuid);
        int f = c.u8();
        out.put("flags", f);
        switch (id) {
            case "2a37":
                out.put("profile", "heart_rate");
                add(values, "heartRate", (f & 1) != 0 ? c.u16() : c.u8(), "bpm");
                if ((f & 4) != 0) out.put("sensorContact", (f & 2) != 0);
                if ((f & 8) != 0) add(values, "energyExpended", c.u16(), "kJ");
                if ((f & 16) != 0) {
                    List<Double> rr = new ArrayList<>();
                    while (c.p < bytes.length) rr.add(c.u16() / 1024.0);
                    out.put("rrIntervalsSeconds", rr);
                }
                break;
            case "2a9d":
                out.put("profile", "weight");
                boolean imperial = (f & 1) != 0;
                int weight = c.u16();
                if (weight != 0xffff) add(values, "weight", weight * (imperial ? .01 : .005), imperial ? "lb" : "kg");
                if ((f & 2) != 0) out.put("deviceTimestamp", c.date());
                if ((f & 4) != 0) out.put("userId", c.u8());
                if ((f & 8) != 0) {
                    int bmi = c.u16(), height = c.u16();
                    if (bmi != 0xffff) add(values, "bmi", bmi * .1, "kg/m2");
                    if (height != 0xffff) add(values, "height", height * (imperial ? .1 : .001), imperial ? "in" : "m");
                }
                break;
            case "2a35":
                out.put("profile", "blood_pressure");
                String unit = (f & 1) != 0 ? "kPa" : "mmHg";
                add(values, "systolic", c.sf(), unit);
                add(values, "diastolic", c.sf(), unit);
                add(values, "meanArterialPressure", c.sf(), unit);
                if ((f & 2) != 0) out.put("deviceTimestamp", c.date());
                if ((f & 4) != 0) add(values, "heartRate", c.sf(), "bpm");
                if ((f & 8) != 0) out.put("userId", c.u8());
                if ((f & 16) != 0) out.put("measurementStatus", c.u16());
                break;
            case "2a1c":
                out.put("profile", "temperature");
                add(values, "temperature", ieeeFloat(c.u32()), (f & 1) != 0 ? "degF" : "degC");
                if ((f & 2) != 0) out.put("deviceTimestamp", c.date());
                if ((f & 4) != 0) out.put("temperatureType", c.u8());
                break;
            case "2a5e":
                out.put("profile", "pulse_oximeter");
                add(values, "spo2", c.sf(), "%");
                add(values, "heartRate", c.sf(), "bpm");
                if ((f & 1) != 0) out.put("deviceTimestamp", c.date());
                if ((f & 2) != 0) out.put("measurementStatus", c.u16());
                if ((f & 4) != 0) out.put("deviceSensorStatus", c.u16() | c.u8() << 16);
                if ((f & 8) != 0) add(values, "pulseAmplitudeIndex", c.sf(), "%");
                out.put("deviceClockNotSet", (f & 16) != 0);
                break;
            case "2a18":
                out.put("profile", "glucose");
                out.put("sequenceNumber", c.u16());
                out.put("deviceTimestamp", c.date());
                if ((f & 1) != 0) out.put("timeOffsetMinutes", c.i16());
                if ((f & 2) != 0) {
                    double concentration = c.sf();
                    boolean mol = (f & 4) != 0;
                    add(values, "glucose", concentration * (mol ? 1000 : 100000), mol ? "mmol/L" : "mg/dL");
                    int type = c.u8();
                    out.put("sampleType", type & 15);
                    out.put("sampleLocation", type >>> 4);
                }
                if ((f & 8) != 0) out.put("sensorStatus", c.u16());
                out.put("contextFollows", (f & 16) != 0);
                break;
            default: throw new IllegalArgumentException("Unsupported health characteristic");
        }
        if (c.p != bytes.length) throw new IllegalArgumentException("Unexpected trailing measurement bytes");
        out.put("unavailableValues", values.isEmpty());
        return out;
    }
}
