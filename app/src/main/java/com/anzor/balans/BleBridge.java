package com.anzor.balans;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.BluetoothStatusCodes;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Foreground-only standard GATT client. Construct during MainActivity.onCreate before STARTED.
 * Expose only to trusted bundled content, as "BalansBle". All state lives on main thread.
 */
@SuppressLint("MissingPermission")
public final class BleBridge implements AutoCloseable {
    private static final UUID CCC = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    // AOSP gatt_api.h: GATT_CONN_TERMINATE_PEER_USER = HCI_ERR_PEER_USER = 0x13.
    // This describes who ended the link, not the device's proprietary reason or capabilities.
    private static final int GATT_CONNECTION_TERMINATED_BY_PEER = 0x13;
    private static final String[] HEALTH_SERVICES = {"180d","181d","1810","1809","1822","1808"};
    private final MainActivity activity;
    private final WebView web;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ActivityResultLauncher<String[]> permissions;
    private final ActivityResultLauncher<Intent> enable;
    private BluetoothAdapter adapter;
    private BluetoothLeScanner scanner;
    private BluetoothGatt gatt;
    private ScanCallback activeScan;
    private boolean scanning, closed, askingPermission, askingEnable, expandedScan;
    private Runnable pending;
    private final ArrayDeque<Operation> queue = new ArrayDeque<>();
    private final Map<String,String> advertisedFingerprints = new HashMap<>();
    private final Map<String,String> knownNames = new HashMap<>();
    private final Set<String> supportedProfiles = new LinkedHashSet<>();
    private String connectionAddress, connectionName, connectionPhase = "disconnected";
    private Operation active;
    private final Runnable scanTimeout = () -> stopScan(true);
    private final Runnable connectTimeout = () -> {
        error("connection_timeout", "Не удалось подготовить подключение за 20 секунд.");
        releaseGatt();
    };
    private final Runnable operationTimeout = () -> {
        error("gatt_timeout", "Устройство не ответило на GATT-запрос. Подключите его повторно.");
        releaseGatt(); // Late callbacks cannot accidentally complete the next operation.
    };

    public BleBridge(MainActivity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        permissions = activity.registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
            askingPermission = false;
            if (closed || pending == null) return;
            if (hasPermissions()) resumePending();
            else {
                pending = null;
                error("permission_denied", "Разрешите доступ к Bluetooth / устройствам поблизости в настройках приложения.");
            }
        });
        enable = activity.registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
            askingEnable = false;
            if (closed || pending == null) return;
            boolean enabled = false;
            try {
                enabled = result.getResultCode() == Activity.RESULT_OK && hasPermissions()
                        && adapter != null && adapter.isEnabled();
            } catch (SecurityException ignored) {}
            if (enabled) resumePending();
            else {
                pending = null;
                error("bluetooth_disabled", "Bluetooth не включён.");
            }
        });
        BluetoothManager manager = activity.getSystemService(BluetoothManager.class);
        adapter = manager == null ? null : manager.getAdapter();
    }

    /** Default: connectable advertisements containing a supported standard health service. */
    @JavascriptInterface public void scan() { requestScan(false); }
    /** Explicit wider discovery: named or supported, connectable BLE advertisements only. */
    @JavascriptInterface public void scanAll() { requestScan(true); }
    private void requestScan(boolean all) {
        handler.post(() -> {
            if (closed) return;
            if (gatt != null) {
                error("connection_busy", "Сначала отключите текущий датчик, чтобы начать новый поиск.");
                return;
            }
            if (scanning && expandedScan == all) return; // Do not restart or extend an active scan.
            prepare(() -> startScan(all));
        });
    }
    @JavascriptInterface public void connect(String address) {
        handler.post(() -> {
            if (closed) return;
            String normalized = address == null ? "" : address.trim().toUpperCase(Locale.ROOT);
            if (!BluetoothAdapter.checkBluetoothAddress(normalized)) {
                error("invalid_address", "Некорректный адрес Bluetooth.");
                return;
            }
            if (gatt != null) {
                if (normalized.equals(connectionAddress))
                    status(connectionPhase, "Это устройство уже подключается или подключено.");
                else error("connection_busy", "Сначала отключите текущий датчик.");
                return;
            }
            prepare(() -> connectNow(normalized));
        });
    }
    @JavascriptInterface public void disconnect() {
        handler.post(() -> {
            pending = null;
            releaseGatt();
            status("disconnected", "Устройство отключено.");
        });
    }
    /** User cancellation. No background collection or auto-reconnect. */
    @JavascriptInterface public void stop() {
        handler.post(() -> {
            pending = null;
            stopScan(false);
            releaseGatt();
            status("stopped", "Поиск и подключение остановлены.");
        });
    }
    /** Call from Activity.onStop; retain only a pending system permission/enable result. */
    public void onHostStop() {
        handler.post(() -> {
            boolean waitingForSystem = askingPermission || askingEnable;
            if (!waitingForSystem) pending = null;
            stopScan(false);
            releaseGatt();
            if (!waitingForSystem) status("stopped", "Поиск и подключение остановлены в фоне.");
        });
    }
    /** Call before WebView.destroy in onDestroy. Idempotent and cancels all resources. */
    @Override public void close() {
        if (Looper.myLooper() != Looper.getMainLooper()) { handler.post(this::close); return; }
        if (closed) return;
        closed = true;
        pending = null;
        stopScan(false);
        releaseGatt();
        permissions.unregister();
        enable.unregister();
        handler.removeCallbacksAndMessages(null);
    }

    private String[] requiredPermissions() {
        return Build.VERSION.SDK_INT >= 31
                ? new String[]{Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT}
                : new String[]{Manifest.permission.ACCESS_FINE_LOCATION};
    }
    private boolean hasPermissions() {
        for (String p : requiredPermissions())
            if (ContextCompat.checkSelfPermission(activity, p) != PackageManager.PERMISSION_GRANTED) return false;
        return true;
    }
    private void prepare(Runnable action) {
        if (closed) return;
        pending = action; // Latest user intent wins, never launch overlapping dialogs.
        if (adapter == null || !activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) {
            pending = null;
            error("unavailable", "Bluetooth LE недоступен на этом устройстве.");
            return;
        }
        try {
            if (!hasPermissions()) {
                if (!askingPermission) {
                    askingPermission = true;
                    permissions.launch(requiredPermissions());
                }
                return;
            }
            if (!adapter.isEnabled()) {
                if (!askingEnable) {
                    askingEnable = true;
                    enable.launch(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE));
                }
                return;
            }
            Runnable run = pending;
            pending = null;
            run.run();
        } catch (RuntimeException e) {
            pending = null;
            askingPermission = askingEnable = false;
            error("bluetooth_error", "Bluetooth: " + e.getClass().getSimpleName());
        }
    }
    private void resumePending() {
        Runnable run = pending;
        pending = null;
        if (run != null) prepare(run);
    }
    private void startScan(boolean all) {
        if (gatt != null) { error("connection_busy", "Сначала отключите текущий датчик."); return; }
        if (scanning && expandedScan == all) return;
        stopScan(false);
        expandedScan = all;
        advertisedFingerprints.clear();
        if (Build.VERSION.SDK_INT <= 30) {
            LocationManager lm = activity.getSystemService(LocationManager.class);
            boolean enabled = lm != null && (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)
                    || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER));
            if (!enabled) {
                error("location_disabled", "Для поиска BLE на Android 8–11 включите геолокацию в настройках телефона.");
                return;
            }
        }
        scanner = adapter.getBluetoothLeScanner();
        if (scanner == null) { error("scanner_unavailable", "Сканер Bluetooth недоступен."); return; }
        ScanCallback callback = new ScanCallback() {
            @Override public void onScanResult(int type, ScanResult result) {
                handler.post(() -> {
                    if (activeScan == this && scanning && !closed) device(result);
                });
            }
            @Override public void onBatchScanResults(List<ScanResult> results) {
                for (ScanResult r : results) onScanResult(0, r);
            }
            @Override public void onScanFailed(int code) {
                handler.post(() -> {
                    if (activeScan != this) return;
                    stopScan(false);
                    error("scan_failed", "Ошибка поиска Bluetooth: " + code);
                });
            }
        };
        activeScan = callback;
        scanning = true;
        try {
            List<ScanFilter> filters = null;
            if (!all) {
                filters = new ArrayList<>();
                for (String service : HEALTH_SERVICES)
                    filters.add(new ScanFilter.Builder().setServiceUuid(new ParcelUuid(
                            UUID.fromString("0000" + service + "-0000-1000-8000-00805f9b34fb"))).build());
            }
            scanner.startScan(filters, new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(), callback);
        } catch (RuntimeException e) {
            stopScan(false);
            error("scan_failed", "Не удалось запустить поиск Bluetooth: " + e.getClass().getSimpleName());
            return;
        }
        status("scanning", all
                ? "Расширенный поиск подключаемых BLE-устройств, до 15 секунд. Совместимость не гарантируется."
                : "Поиск подключаемых датчиков со стандартными медицинскими сервисами, до 15 секунд.");
        handler.postDelayed(scanTimeout, 15000);
    }
    private void stopScan(boolean completed) {
        handler.removeCallbacks(scanTimeout);
        if (scanner != null && activeScan != null) {
            try { scanner.stopScan(activeScan); } catch (RuntimeException ignored) {}
        }
        scanner = null;
        activeScan = null;
        boolean wasScanning = scanning;
        scanning = false;
        if (completed && wasScanning) status("scan_complete", "Поиск завершён. Поддержка датчика проверяется после подключения.");
    }
    private void device(ScanResult result) {
        try {
            if (!result.isConnectable()) return; // minSdk26: no connection can be attempted.
            String address = result.getDevice().getAddress();
            ScanRecord record = result.getScanRecord();
            String name = record == null ? null : record.getDeviceName();
            if (name == null) name = result.getDevice().getName();
            if (name != null) name = name.trim();
            JSONArray services = new JSONArray();
            boolean supported = false;
            if (record != null && record.getServiceUuids() != null)
                for (ParcelUuid uuid : record.getServiceUuids()) {
                    String service = uuid.toString();
                    services.put(service);
                    supported |= service.matches("000018(0d|1d|10|09|22|08)-0000-1000-8000-00805f9b34fb");
                }
            boolean named = name != null && !name.isEmpty();
            if (!supported && (!expandedScan || !named)) return;
            // RSSI alone does not produce another event or trigger repeated frontend renders.
            String fingerprint = (named ? name : "") + "|" + services;
            if (fingerprint.equals(advertisedFingerprints.get(address))) return;
            advertisedFingerprints.put(address, fingerprint);
            if (named) knownNames.put(address, name);
            emit(object("type","device","address",address,
                    "name",named ? name : "Медицинский BLE-датчик","rssi",result.getRssi(),
                    "services",services,"supportedAdvertised",supported,"connectable",true,
                    "scanMode",expandedScan ? "expanded" : "compatible",
                    "compatibility",supported ? "advertised_standard_health" : "unverified"));
        } catch (SecurityException e) { error("permission_revoked", "Доступ к Bluetooth отозван."); }
    }
    private void connectNow(String address) {
        if (gatt != null) {
            if (address.equals(connectionAddress)) status(connectionPhase, "Это устройство уже подключается или подключено.");
            else error("connection_busy", "Сначала отключите текущий датчик.");
            return;
        }
        stopScan(false);
        supportedProfiles.clear();
        connectionAddress = address;
        BluetoothDevice device = adapter.getRemoteDevice(address);
        connectionName = knownNames.get(address);
        if (connectionName == null) connectionName = device.getName();
        if (connectionName == null || connectionName.trim().isEmpty()) connectionName = "BLE-датчик";
        status("connecting", "Подключение к " + address);
        gatt = device.connectGatt(activity, false, callback, BluetoothDevice.TRANSPORT_LE);
        if (gatt == null) { error("connect_failed", "Не удалось создать GATT-подключение."); return; }
        handler.postDelayed(connectTimeout, 20000);
    }
    private final BluetoothGattCallback callback = new BluetoothGattCallback() {
        @Override public void onConnectionStateChange(BluetoothGatt g, int code, int state) {
            handler.post(() -> {
                if (g != gatt || closed) return;
                if (code != BluetoothGatt.GATT_SUCCESS) {
                    connectionError(code);
                    releaseGatt();
                } else if (state == BluetoothProfile.STATE_CONNECTED) {
                    status("discovering", "Подключено. Проверка стандартных медицинских сервисов.");
                    try {
                        if (!g.discoverServices()) { error("discovery_failed", "Не удалось запросить сервисы."); releaseGatt(); }
                    } catch (RuntimeException e) { error("discovery_failed", "Доступ к сервисам недоступен."); releaseGatt(); }
                } else if (state == BluetoothProfile.STATE_DISCONNECTED) {
                    releaseGatt();
                    status("disconnected", "Устройство отключилось.");
                }
            });
        }
        @Override public void onServicesDiscovered(BluetoothGatt g, int code) {
            handler.post(() -> {
                if (g != gatt || closed) return;
                handler.removeCallbacks(connectTimeout);
                if (code != BluetoothGatt.GATT_SUCCESS) {
                    error("discovery_failed", "Ошибка поиска сервисов: " + code);
                    releaseGatt();
                    return;
                }
                int count = 0;
                for (BluetoothGattService service : g.getServices())
                    for (BluetoothGattCharacteristic characteristic : service.getCharacteristics())
                        if (HealthGattDecoder.supports(characteristic.getUuid().toString())) {
                            int props = characteristic.getProperties();
                            if ((props & (BluetoothGattCharacteristic.PROPERTY_NOTIFY | BluetoothGattCharacteristic.PROPERTY_INDICATE)) != 0) {
                                count++;
                                queue.add(new Operation(characteristic, true));
                            }
                            if ((props & BluetoothGattCharacteristic.PROPERTY_READ) != 0) {
                                count++;
                                queue.add(new Operation(characteristic, false));
                            }
                        }
                if (count == 0) {
                    error("unsupported", "Стандартные измерения не найдены. Фирменный протокол устройства не поддерживается.");
                    releaseGatt();
                } else {
                    status("configuring", "Найдены стандартные измерения. Настройка получения данных.");
                    next();
                }
            });
        }
        @Override public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int code) {
            handler.post(() -> {
                if (g == gatt && active != null && active.subscribe && active.characteristic == d.getCharacteristic())
                    complete(code);
            });
        }
        @Override public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic c, int code) {
            if (Build.VERSION.SDK_INT < 33) read(g,c,c.getValue() == null ? null : c.getValue().clone(),code);
        }
        @Override public void onCharacteristicRead(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] value, int code) {
            read(g,c,value == null ? null : value.clone(),code);
        }
        @Override public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) {
            if (Build.VERSION.SDK_INT < 33) changed(g,c,c.getValue() == null ? null : c.getValue().clone());
        }
        @Override public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] value) {
            changed(g,c,value == null ? null : value.clone());
        }
    };
    private void read(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] value, int code) {
        handler.post(() -> {
            if (g != gatt || active == null || active.subscribe || active.characteristic != c) return;
            if (code == BluetoothGatt.GATT_SUCCESS) measurement(c,value);
            complete(code);
        });
    }
    private void changed(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] value) {
        handler.post(() -> { if (g == gatt && !closed) measurement(c,value); });
    }
    private static final class Operation {
        final BluetoothGattCharacteristic characteristic;
        final boolean subscribe;
        Operation(BluetoothGattCharacteristic characteristic, boolean subscribe) {
            this.characteristic = characteristic;
            this.subscribe = subscribe;
        }
    }
    private void next() {
        if (gatt == null || closed || active != null) return;
        active = queue.poll();
        if (active == null) {
            if (supportedProfiles.isEmpty()) {
                error("no_accessible_measurements", "Не удалось включить получение стандартных измерений. Может требоваться сопряжение.");
                releaseGatt();
                return;
            }
            status("ready", "Подключено. Ожидание измерения на датчике; наличие сервиса не гарантирует данные.");
            emit(object("type","knownDevice","address",connectionAddress,"name",connectionName,
                    "supportedProfiles",new JSONArray(supportedProfiles),"verifiedBy","gatt_access",
                    "autoReconnect",false));
            return;
        }
        try {
            BluetoothGattCharacteristic c = active.characteristic;
            boolean started;
            if (active.subscribe) {
                BluetoothGattDescriptor descriptor = c.getDescriptor(CCC);
                if (descriptor == null || !gatt.setCharacteristicNotification(c, true)) {
                    complete(-1);
                    return;
                }
                byte[] value = (c.getProperties() & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0
                        ? BluetoothGattDescriptor.ENABLE_INDICATION_VALUE : BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE;
                if (Build.VERSION.SDK_INT >= 33) started = gatt.writeDescriptor(descriptor, value) == BluetoothStatusCodes.SUCCESS;
                else { descriptor.setValue(value); started = gatt.writeDescriptor(descriptor); }
            } else started = gatt.readCharacteristic(c);
            if (started) handler.postDelayed(operationTimeout, 10000);
            else complete(-1);
        } catch (RuntimeException e) { complete(-1); }
    }
    private void complete(int code) {
        if (closed || gatt == null || active == null) return;
        handler.removeCallbacks(operationTimeout);
        if (code != BluetoothGatt.GATT_SUCCESS)
            error("gatt_operation", "Не удалось прочитать/подписаться на " + active.characteristic.getUuid()
                    + " (код " + code + "). Может требоваться сопряжение или фирменное приложение.");
        else supportedProfiles.add(profile(active.characteristic.getUuid()));
        active = null;
        next();
    }
    private void measurement(BluetoothGattCharacteristic characteristic, byte[] value) {
        if (!HealthGattDecoder.supports(characteristic.getUuid().toString())) return;
        try {
            JSONObject data = new JSONObject(HealthGattDecoder.decode(characteristic.getUuid().toString(),value));
            data.put("type","measurement");
            data.put("address",gatt.getDevice().getAddress());
            data.put("name",connectionName);
            data.put("characteristic",characteristic.getUuid().toString());
            data.put("receivedAt",System.currentTimeMillis());
            emit(data);
        } catch (IllegalArgumentException | JSONException | SecurityException e) {
            error("invalid_measurement", "Датчик передал неполное или неподдерживаемое измерение.");
        }
    }
    private void releaseGatt() {
        handler.removeCallbacks(connectTimeout);
        handler.removeCallbacks(operationTimeout);
        queue.clear();
        active = null;
        BluetoothGatt old = gatt;
        gatt = null;
        if (old != null) {
            try { old.disconnect(); } catch (RuntimeException ignored) {}
            try { old.close(); } catch (RuntimeException ignored) {}
        }
    }
    private static String profile(UUID uuid) {
        switch (uuid.toString().substring(4,8)) {
            case "2a37": return "heart_rate";
            case "2a9d": return "weight";
            case "2a35": return "blood_pressure";
            case "2a1c": return "temperature";
            case "2a5e": return "pulse_oximeter";
            case "2a18": return "glucose";
            default: return "unknown";
        }
    }
    private void status(String state, String message) {
        if (!state.equals("scanning") && !state.equals("scan_complete")) connectionPhase = state;
        emit(object("type","status","state",state,"message",message,
                "address",connectionAddress == null ? JSONObject.NULL : connectionAddress,
                "name",connectionName == null ? JSONObject.NULL : connectionName,
                "supportedProfiles",new JSONArray(supportedProfiles),
                "scanMode",expandedScan ? "expanded" : "compatible"));
    }
    private void error(String code, String message) {
        emit(object("type","error","code",code,"message",message,
                "address",connectionAddress == null ? JSONObject.NULL : connectionAddress,
                "name",connectionName == null ? JSONObject.NULL : connectionName));
    }
    private void connectionError(int status) {
        String message = status == GATT_CONNECTION_TERMINATED_BY_PEER
                ? "Прибор завершил соединение. Включите режим передачи измерений и повторите подключение (GATT 19)."
                : "Не удалось установить или сохранить соединение с прибором. Поднесите его ближе, включите режим передачи измерений и повторите подключение (GATT " + status + ").";
        emit(object("type","error","code","gatt_connection","gattStatus",status,"message",message,
                "address",connectionAddress == null ? JSONObject.NULL : connectionAddress,
                "name",connectionName == null ? JSONObject.NULL : connectionName));
    }
    private static JSONObject object(Object... pairs) {
        JSONObject result = new JSONObject();
        try { for (int i=0;i<pairs.length;i+=2) result.put((String)pairs[i],pairs[i+1]); }
        catch (JSONException e) { throw new IllegalArgumentException(e); }
        return result;
    }
    private void emit(JSONObject event) {
        if (closed) return;
        // Pass JSON through JSON.parse(string literal), never interpolate names into executable code.
        String json = JSONObject.quote(event.toString());
        web.evaluateJavascript("if(typeof window.onBleEvent==='function'){window.onBleEvent(JSON.parse(" + json + "));}",null);
    }
}
