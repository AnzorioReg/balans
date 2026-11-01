package com.anzor.balans

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.feature.ExperimentalMindfulnessSessionApi
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.time.*
import kotlin.reflect.KClass

/** Pure comparison seam: Health Connect record order need not order their individual samples. */
internal fun shouldReplaceHourlySample(previousTimestamp: Long?, candidateTimestamp: Long): Boolean =
    previousTimestamp == null || candidateTimestamp > previousTimestamp

internal fun checkedHistoryDays(days: Int): Int {
    require(days in 1..366) { "Диапазон чтения: от 1 до 366 дней." }
    return days
}

/** Keep recent detail while bounding year-long dense streams and the WebView payload. */
internal fun denseHistoryBucketHours(sampleMillis: Long, endMillis: Long): Int =
    if (sampleMillis >= endMillis - Duration.ofDays(30).toMillis()) 1 else 6

internal fun historyRangeStart(endMillis: Long, days: Int, zone: ZoneId): Long =
    Instant.ofEpochMilli(endMillis).atZone(zone).toLocalDate().minusDays(checkedHistoryDays(days)-1L)
        .atStartOfDay(zone).toInstant().toEpochMilli()

internal suspend fun resolveReadableHistoryDays(requested: Int, canRead: suspend (Int) -> Boolean): Int {
    checkedHistoryDays(requested)
    if (canRead(requested)) return requested
    if (requested == 1 || !canRead(1)) throw SecurityException("Нет доступа даже к текущему дню.")
    var allowed = 1
    var denied = requested
    while (denied - allowed > 1) {
        val middle = allowed + (denied - allowed) / 2
        if (canRead(middle)) allowed = middle else denied = middle
    }
    return allowed
}

internal fun retainedSleepStageIndices(count: Int, limit: Int = 200): IntArray {
    require(count >= 0 && limit >= 2)
    if (count <= limit) return IntArray(count) { it }
    return IntArray(limit) { index -> (index.toLong() * (count-1) / (limit-1)).toInt() }
}

/** Read-only, on-device Health Connect integration. No health data leaves the device. */
@OptIn(ExperimentalMindfulnessSessionApi::class)
class HealthBridge(private val activity: MainActivity, private val web: WebView) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private var job: Job? = null
    private var revoked = false
    private var currentDays = 366
    @Volatile private var syncGeneration = 0L
    private val types: List<KClass<out Record>> = listOf(
        StepsRecord::class, DistanceRecord::class, ActiveCaloriesBurnedRecord::class,
        TotalCaloriesBurnedRecord::class, ExerciseSessionRecord::class, FloorsClimbedRecord::class,
        ElevationGainedRecord::class, SpeedRecord::class, HeartRateRecord::class,
        RestingHeartRateRecord::class, BloodPressureRecord::class, OxygenSaturationRecord::class,
        HeartRateVariabilityRmssdRecord::class, RespiratoryRateRecord::class, SleepSessionRecord::class,
        WeightRecord::class, HeightRecord::class, BodyFatRecord::class, LeanBodyMassRecord::class,
        BodyWaterMassRecord::class, BoneMassRecord::class, HydrationRecord::class, NutritionRecord::class,
        BodyTemperatureRecord::class, BloodGlucoseRecord::class, Vo2MaxRecord::class,
        BasalMetabolicRateRecord::class, PowerRecord::class, StepsCadenceRecord::class,
        CyclingPedalingCadenceRecord::class
    )
    private fun availableTypes(hc: HealthConnectClient): List<KClass<out Record>> = types + buildList {
        if (hc.features.getFeatureStatus(HealthConnectFeatures.FEATURE_SKIN_TEMPERATURE) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE)
            add(SkinTemperatureRecord::class)
        if (hc.features.getFeatureStatus(HealthConnectFeatures.FEATURE_MINDFULNESS_SESSION) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE)
            add(MindfulnessSessionRecord::class)
    }
    private val permissionLauncher = activity.registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) {
        // The result only covers this request. Declining history must not erase existing
        // category grants (or cause the frontend to discard their cached measurements).
        scope.launch {
            try {
                val hc = client() ?: return@launch
                val granted = hc.permissionController.getGrantedPermissions()
                if (availableTypes(hc).any { HealthPermission.getReadPermission(it) in granted })
                    syncRange(currentDays)
                else event("permissions","Доступ к категориям данных не предоставлен",
                    JSONObject().put("granted",JSONArray(granted.toList())))
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { event("error","Не удалось проверить разрешения: ${e.localizedMessage}") }
        }
    }
    private fun event(type: String, message: String, extra: JSONObject = JSONObject(), generation: Long? = null) {
        extra.put("type", type).put("message", message)
        val script = "window.onHealthEvent&&window.onHealthEvent($extra)"
        activity.runOnUiThread {
            if (generation != null && (generation != syncGeneration || revoked)) return@runOnUiThread
            web.evaluateJavascript(script, null)
        }
    }
    private fun client(): HealthConnectClient? {
        return when (HealthConnectClient.getSdkStatus(activity)) {
            HealthConnectClient.SDK_AVAILABLE -> HealthConnectClient.getOrCreate(activity)
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                event("unavailable", "Установите или обновите Health Connect", JSONObject().put("install", true)); null
            }
            else -> { event("unavailable", "Health Connect недоступен на этом устройстве"); null }
        }
    }
    @JavascriptInterface fun connect() { activity.runOnUiThread {
        revoked = false
        val hc = client() ?: return@runOnUiThread
        try {
            val permissions = availableTypes(hc).map { HealthPermission.getReadPermission(it) }.toMutableSet()
            if (canRequestHistory(hc)) permissions.add(HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY)
            permissionLauncher.launch(permissions)
        }
        catch (e: Exception) { event("error", "Не удалось открыть разрешения: ${e.localizedMessage}") }
    } }
    private fun canRequestHistory(hc: HealthConnectClient): Boolean {
        if (hc.features.getFeatureStatus(HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_HISTORY) !=
            HealthConnectFeatures.FEATURE_STATUS_AVAILABLE) return false
        @Suppress("DEPRECATION")
        val declared = activity.packageManager.getPackageInfo(activity.packageName,PackageManager.GET_PERMISSIONS).requestedPermissions
        return declared?.contains(HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY) == true
    }
    /** Explicit user action only. Sync never launches a permissions dialog. */
    @JavascriptInterface fun requestHistory() { activity.runOnUiThread {
        val hc = client() ?: return@runOnUiThread
        if (!canRequestHistory(hc)) {
            event("error", "Расширенное чтение истории недоступно в этой версии Health Connect или не объявлено приложением.")
            return@runOnUiThread
        }
        try { permissionLauncher.launch(setOf(HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY)) }
        catch (e: Exception) { event("error", "Не удалось запросить доступ к истории: ${e.localizedMessage}") }
    } }
    @JavascriptInterface fun install() { activity.runOnUiThread {
        try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.apps.healthdata"))) }
        catch (_: Exception) { event("error", "Откройте магазин и установите Health Connect вручную") }
    } }
    @JavascriptInterface fun settings() { activity.runOnUiThread {
        try { activity.startActivity(Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)) }
        catch (_: Exception) { connect() }
    } }
    @JavascriptInterface fun openSource(id: String) { activity.runOnUiThread {
        val packages = mapOf(
            "samsung" to "com.sec.android.app.shealth", "google" to "com.fitbit.FitbitMobile",
            "garmin" to "com.garmin.android.apps.connectmobile", "withings" to "com.withings.wiscale2",
            "oura" to "com.ouraring.oura", "polar" to "fi.polar.polarflow",
            "whoop" to "com.whoop.android", "huawei" to "com.huawei.health",
            "xiaomi" to "com.xiaomi.wearable", "strava" to "com.strava",
            "mfp" to "com.myfitnesspal.android")
        val pkg = packages[id] ?: return@runOnUiThread
        try {
            val candidates = if (id == "google") listOf(pkg, "com.google.android.apps.fitness") else listOf(pkg)
            val launch = candidates.firstNotNullOfOrNull { activity.packageManager.getLaunchIntentForPackage(it) }
            if (launch != null) activity.startActivity(launch)
            else event("error", "Приложение источника не установлено или не имеет экрана запуска. Установите его и включите передачу данных в Health Connect.")
        } catch (e: Exception) { event("error", "Не удалось открыть приложение источника: ${e.localizedMessage}") }
    } }
    @JavascriptInterface fun disconnect() { activity.runOnUiThread {
        revoked = true
        syncGeneration++
        job?.cancel()
        scope.launch {
            try {
                val hc = client()
                if (hc == null) {
                    event("error", "Отзыв доступа не подтверждён: Health Connect недоступен. Проверьте разрешения в настройках Android.")
                    return@launch
                }
                hc.permissionController.revokeAllPermissions()
                event("disconnected", "Разрешения Health Connect отозваны")
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { event("error", "Не удалось отозвать доступ: ${e.localizedMessage}") }
        }
    } }
    @JavascriptInterface fun status() { activity.runOnUiThread {
        scope.launch {
            try {
                val hc = client() ?: return@launch
                val granted = hc.permissionController.getGrantedPermissions()
                event("permissions", if (granted.isEmpty()) "Нет разрешений" else "Разрешения проверены",
                    JSONObject().put("granted", JSONArray(granted.toList())))
            } catch (e: Exception) { event("error", e.localizedMessage ?: "Ошибка проверки разрешений") }
        }
    } }
    @JavascriptInterface fun sync() { syncRange(366) }
    @JavascriptInterface fun syncRange(days: Int) { activity.runOnUiThread {
        try { checkedHistoryDays(days) }
        catch (e: IllegalArgumentException) { event("error",e.message ?: "Некорректный диапазон"); return@runOnUiThread }
        if (job?.isActive == true) {
            if (currentDays == days) return@runOnUiThread
            job?.cancel() // Latest explicit range wins; a cancelled read never emits a snapshot.
        }
        currentDays = days
        val generation = ++syncGeneration
        revoked = false
        job = scope.launch {
            try {
                val hc = client() ?: return@launch
                val granted = hc.permissionController.getGrantedPermissions()
                if (granted.isEmpty()) {
                    event("permissions", "Сначала разрешите чтение данных", JSONObject().put("granted", JSONArray())); return@launch
                }
                event("progress", "Проверка доступной истории: запрошено $days дней")
                val output = JSONObject()
                val origins = mutableSetOf<String>()
                val warnings = JSONArray()
                val end = Instant.now()
                val requestedStart = Instant.ofEpochMilli(historyRangeStart(end.toEpochMilli(),days,ZoneId.systemDefault()))
                val historyGranted = HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY in granted
                val range = JSONObject().put("requestedDays",days).put("requestedStart",requestedStart.toEpochMilli())
                    .put("requestedEnd",end.toEpochMilli()).put("historyPermission",historyGranted)
                    .put("historyPermissionRequestable",canRequestHistory(hc))
                    .put("dayDefinition","local_calendar").put("timezone",ZoneId.systemDefault().id)
                var start = requestedStart
                var historyLimited = false
                val perMetricRange = JSONObject()
                val successful = mutableSetOf<String>()
                val failed = mutableSetOf<String>()
                val truncatedMetrics = mutableSetOf<String>()
                var truncated = false
                withContext(Dispatchers.IO) {
                    val readable = availableTypes(hc).filter { HealthPermission.getReadPermission(it) in granted }
                    if (readable.isEmpty()) throw IllegalStateException("Нет разрешений на поддерживаемые категории данных.")
                    val allowedDays = readableDays(hc,readable.first(),days,end,historyGranted)
                    start = Instant.ofEpochMilli(historyRangeStart(end.toEpochMilli(),allowedDays,ZoneId.systemDefault()))
                    historyLimited = allowedDays < days
                    range.put("queriedStart",start.toEpochMilli()).put("queriedEnd",end.toEpochMilli())
                        .put("queriedDays",allowedDays).put("historyLimited",historyLimited)
                        .put("boundaryApproximate",historyLimited)
                    if (historyLimited) warnings.put("Health Connect разрешил запрос только за последние $allowedDays дней из $days. Граница проверена с точностью до суток; более старые записи не прочитаны.")
                    if (!historyGranted) warnings.put("Расширенный доступ к истории не предоставлен. По умолчанию Health Connect ограничивает чтение датой первого разрешения минус 30 дней, а не текущими последними 30 днями.")
                    for (type in readable) {
                        ensureActive()
                        if (isDailyTotal(type)) continue // Aggregate once; avoid reading every raw interval too.
                        try {
                            val typeTruncated = readType(hc, type, start, end, output, origins, warnings)
                            if (typeTruncated) truncatedMetrics.addAll(metricIds(type))
                            truncated = typeTruncated || truncated
                            successful.addAll(metricIds(type))
                        }
                        catch (e: CancellationException) { throw e }
                        catch (e: Exception) {
                            failed.addAll(metricIds(type))
                            warnings.put("${type.simpleName}: ${e.localizedMessage ?: "недоступно"}")
                        }
                    }
                    val dailyIds = readable.filter { isDailyTotal(it) }.flatMap { metricIds(it) }
                    if (aggregateDaily(hc, granted, start, end, output, origins, warnings)) successful.addAll(dailyIds)
                    else failed.addAll(dailyIds)
                    var earliest: Long? = null
                    var latest: Long? = null
                    output.keys().forEach { id ->
                        val rows = output.getJSONArray(id)
                        if (rows.length() > 0) {
                            val first = rows.getJSONObject(0).getLong("ts")
                            val last = rows.getJSONObject(rows.length()-1).getLong("ts")
                            perMetricRange.put(id,JSONObject().put("start",first).put("end",last).put("count",rows.length()))
                            earliest = minOf(earliest ?: first,first)
                            latest = maxOf(latest ?: last,last)
                        }
                    }
                    range.put("availableStart",earliest ?: JSONObject.NULL).put("availableEnd",latest ?: JSONObject.NULL)
                        .put("truncated",truncated)
                        .put("complete",!historyLimited && warnings.length() == 0)
                    // Serialization is intentionally off-main; year-long snapshots can be substantial.
                    ensureActive()
                    if (!revoked) event("synced", "Данные Health Connect прочитаны",
                        JSONObject().put("records",output).put("origins",JSONArray(origins.toList()))
                            .put("granted",JSONArray(granted.toList())).put("warnings",warnings)
                            .put("range",range).put("perMetricRange",perMetricRange)
                            .put("successfulMetricIds",JSONArray(successful.toList()))
                            .put("failedMetricIds",JSONArray(failed.toList()))
                            .put("truncatedMetricIds",JSONArray(truncatedMetrics.toList()))
                            .put("sampling",JSONObject().put("recentDays",30).put("recentDenseHours",1)
                                .put("historicalDenseHours",6).put("maxPointsPerMetric",5000))
                            .put("at",System.currentTimeMillis()),generation)
                }
            } catch (e: CancellationException) { throw e }
            catch (e: Exception) { event("error", "Синхронизация не завершена: ${e.localizedMessage}") }
        }
    } }
    /** Tiny probes find an allowed suffix without guessing the unknown first-grant date. */
    private suspend fun <T : Record> readableDays(hc: HealthConnectClient, type: KClass<T>,
        requested: Int, end: Instant, historyGranted: Boolean): Int {
        return resolveReadableHistoryDays(requested) { days ->
            currentCoroutineContext().ensureActive()
            try {
                hc.readRecords(ReadRecordsRequest(type,TimeRangeFilter.between(
                    Instant.ofEpochMilli(historyRangeStart(end.toEpochMilli(),days,ZoneId.systemDefault())),end),
                    ascendingOrder=false,pageSize=1))
                true
            }
            catch (e: CancellationException) { throw e }
            catch (e: SecurityException) { if (historyGranted) throw e else false }
        }
    }
    private fun isDailyTotal(type: KClass<out Record>): Boolean = type in setOf(
        StepsRecord::class,DistanceRecord::class,ActiveCaloriesBurnedRecord::class,
        TotalCaloriesBurnedRecord::class,ExerciseSessionRecord::class,FloorsClimbedRecord::class,
        ElevationGainedRecord::class,HydrationRecord::class,NutritionRecord::class)
    private fun metricIds(type: KClass<out Record>): List<String> = listOfNotNull(when (type) {
        StepsRecord::class -> "steps"
        DistanceRecord::class -> "distance"
        ActiveCaloriesBurnedRecord::class -> "activeCalories"
        TotalCaloriesBurnedRecord::class -> "totalCalories"
        ExerciseSessionRecord::class -> "exercise"
        FloorsClimbedRecord::class -> "floors"
        ElevationGainedRecord::class -> "elevation"
        SpeedRecord::class -> "speed"
        HeartRateRecord::class -> "heart"
        RestingHeartRateRecord::class -> "restingHeart"
        BloodPressureRecord::class -> "bp"
        OxygenSaturationRecord::class -> "spo2"
        HeartRateVariabilityRmssdRecord::class -> "hrv"
        RespiratoryRateRecord::class -> "resp"
        SleepSessionRecord::class -> "sleep"
        WeightRecord::class -> "weight"
        HeightRecord::class -> "height"
        BodyFatRecord::class -> "bodyFat"
        LeanBodyMassRecord::class -> "leanMass"
        BodyWaterMassRecord::class -> "bodyWater"
        BoneMassRecord::class -> "boneMass"
        HydrationRecord::class -> "water"
        NutritionRecord::class -> "nutrition"
        BodyTemperatureRecord::class -> "temp"
        BloodGlucoseRecord::class -> "glucose"
        Vo2MaxRecord::class -> "vo2"
        BasalMetabolicRateRecord::class -> "bmr"
        PowerRecord::class -> "power"
        StepsCadenceRecord::class -> "cadence"
        CyclingPedalingCadenceRecord::class -> "cyclingCadence"
        SkinTemperatureRecord::class -> "skinTemperature"
        MindfulnessSessionRecord::class -> "mindfulness"
        else -> null
    })
    private suspend fun <T : Record> readType(
        hc: HealthConnectClient, type: KClass<T>, start: Instant, end: Instant,
        out: JSONObject, origins: MutableSet<String>, warnings: JSONArray
    ): Boolean {
        val buffers = mutableMapOf<String, java.util.TreeMap<Long, JSONObject>>()
        var limited = false
        var reducedDenseSamples = false
        var reducedSleepStages = false
        var pageLimited = false
        var token: String? = null
        var pages = 0
        do {
            val response = hc.readRecords(ReadRecordsRequest(type, TimeRangeFilter.between(start, end),
                ascendingOrder = false, pageSize = 100, pageToken = token))
            for (r in response.records) {
                currentCoroutineContext().ensureActive()
                val origin = r.metadata.dataOrigin.packageName
                origins.add(origin)
                fun put(id: String, value: Double, time: Instant, lo: Double? = null) {
                    if (!value.isFinite() || time < start || time >= end) return
                    val buffer = buffers.getOrPut(id) { java.util.TreeMap() }
                    val item = JSONObject().put("id", "${r.metadata.id}:${time.toEpochMilli()}").put("v", value)
                        .put("ts", time.toEpochMilli()).put("source", origin)
                    if (lo != null) item.put("lo", lo)
                    // Dense sensor streams: retain the actual last sample per hour, not a fabricated average.
                    val dense = id in setOf("heart","speed","power","cadence","cyclingCadence","skinTemperature")
                    val bucketHours = denseHistoryBucketHours(time.toEpochMilli(),end.toEpochMilli())
                    val key = if (dense) time.epochSecond / (3600 * bucketHours) * (3600 * bucketHours) else time.toEpochMilli()
                    if (dense) {
                        val previous = buffer[key]
                        if (previous != null) reducedDenseSamples = true
                        if (!shouldReplaceHourlySample(previous?.getLong("ts"),time.toEpochMilli())) return
                    }
                    buffer[key] = item
                    if (buffer.size > 5000) { buffer.pollFirstEntry(); limited = true }
                }
                when (r) {
                    is StepsRecord -> put("steps", r.count.toDouble(), r.endTime)
                    is DistanceRecord -> put("distance", r.distance.inKilometers, r.endTime)
                    is ActiveCaloriesBurnedRecord -> put("activeCalories", r.energy.inKilocalories, r.endTime)
                    is TotalCaloriesBurnedRecord -> put("totalCalories", r.energy.inKilocalories, r.endTime)
                    is ExerciseSessionRecord -> put("exercise", Duration.between(r.startTime, r.endTime).seconds / 60.0, r.endTime)
                    is FloorsClimbedRecord -> put("floors", r.floors, r.endTime)
                    is ElevationGainedRecord -> put("elevation", r.elevation.inMeters, r.endTime)
                    is SpeedRecord -> r.samples.forEach { put("speed", it.speed.inKilometersPerHour, it.time) }
                    is HeartRateRecord -> r.samples.forEach { put("heart", it.beatsPerMinute.toDouble(), it.time) }
                    is RestingHeartRateRecord -> put("restingHeart", r.beatsPerMinute.toDouble(), r.time)
                    is BloodPressureRecord -> put("bp", r.systolic.inMillimetersOfMercury, r.time, r.diastolic.inMillimetersOfMercury)
                    is OxygenSaturationRecord -> put("spo2", r.percentage.value, r.time)
                    is HeartRateVariabilityRmssdRecord -> put("hrv", r.heartRateVariabilityMillis, r.time)
                    is RespiratoryRateRecord -> put("resp", r.rate, r.time)
                    is SleepSessionRecord -> {
                        val knownSleep = r.stages.filter { it.stage in setOf(SleepSessionRecord.STAGE_TYPE_SLEEPING,
                            SleepSessionRecord.STAGE_TYPE_LIGHT, SleepSessionRecord.STAGE_TYPE_DEEP,
                            SleepSessionRecord.STAGE_TYPE_REM) }.sumOf { Duration.between(it.startTime, it.endTime).seconds }
                        val awake = r.stages.filter { it.stage in setOf(SleepSessionRecord.STAGE_TYPE_AWAKE,
                            SleepSessionRecord.STAGE_TYPE_OUT_OF_BED) }.sumOf { Duration.between(it.startTime, it.endTime).seconds }
                        val sleepSeconds = if (knownSleep > 0) knownSleep else
                            (Duration.between(r.startTime, r.endTime).seconds - awake).coerceAtLeast(0)
                        put("sleep", sleepSeconds / 3600.0, r.endTime)
                        val stages = JSONArray()
                        // Duration above uses the FULL source stages; display sampling never
                        // changes it. Preserve year-long coverage, capping only huge sessions.
                        val keptStageIndices = retainedSleepStageIndices(r.stages.size)
                        val stagesTruncated = keptStageIndices.size < r.stages.size
                        if (stagesTruncated) reducedSleepStages = true
                        keptStageIndices.forEach { index ->
                            val it = r.stages[index]
                            val kind = when (it.stage) {
                                SleepSessionRecord.STAGE_TYPE_AWAKE -> "wake"
                                SleepSessionRecord.STAGE_TYPE_OUT_OF_BED -> "out"
                                SleepSessionRecord.STAGE_TYPE_LIGHT -> "light"
                                SleepSessionRecord.STAGE_TYPE_DEEP -> "deep"
                                SleepSessionRecord.STAGE_TYPE_REM -> "rem"
                                SleepSessionRecord.STAGE_TYPE_SLEEPING -> "sleep"
                                else -> "unknown"
                            }
                            stages.put(JSONObject().put("start", it.startTime.toEpochMilli())
                                .put("end", it.endTime.toEpochMilli()).put("kind", kind))
                        }
                        buffers["sleep"]?.get(r.endTime.toEpochMilli())?.put("stages", stages)
                            ?.put("start", r.startTime.toEpochMilli())?.put("end", r.endTime.toEpochMilli())
                            ?.put("sleepKind", if (knownSleep > 0) "staged_sleep" else "session_less_awake")
                            ?.put("stageDetailsTruncated",stagesTruncated)?.put("stageCountOriginal",r.stages.size)
                    }
                    is WeightRecord -> put("weight", r.weight.inKilograms, r.time)
                    is HeightRecord -> put("height", r.height.inMeters * 100, r.time)
                    is BodyFatRecord -> put("bodyFat", r.percentage.value, r.time)
                    is LeanBodyMassRecord -> put("leanMass", r.mass.inKilograms, r.time)
                    is BodyWaterMassRecord -> put("bodyWater", r.mass.inKilograms, r.time)
                    is BoneMassRecord -> put("boneMass", r.mass.inKilograms, r.time)
                    is HydrationRecord -> put("water", r.volume.inMilliliters, r.endTime)
                    is NutritionRecord -> r.energy?.let { put("nutrition", it.inKilocalories, r.endTime) }
                    is BodyTemperatureRecord -> put("temp", r.temperature.inCelsius, r.time)
                    is BloodGlucoseRecord -> put("glucose", r.level.inMillimolesPerLiter, r.time)
                    is Vo2MaxRecord -> put("vo2", r.vo2MillilitersPerMinuteKilogram, r.time)
                    is BasalMetabolicRateRecord -> put("bmr", r.basalMetabolicRate.inKilocaloriesPerDay, r.time)
                    is PowerRecord -> r.samples.forEach { put("power", it.power.inWatts, it.time) }
                    is StepsCadenceRecord -> r.samples.forEach { put("cadence", it.rate, it.time) }
                    is CyclingPedalingCadenceRecord -> r.samples.forEach { put("cyclingCadence", it.revolutionsPerMinute, it.time) }
                    is SkinTemperatureRecord -> r.deltas.forEach { put("skinTemperature", it.delta.inCelsius, it.time) }
                    is MindfulnessSessionRecord -> put("mindfulness", Duration.between(r.startTime, r.endTime).seconds / 60.0, r.endTime)
                }
            }
            token = response.pageToken
            pages++
            if (pages >= 100 && !token.isNullOrEmpty()) { pageLimited = true; break }
        } while (!token.isNullOrEmpty())
        buffers.forEach { (id, values) -> out.put(id, JSONArray(values.values.toList())) }
        if (limited) warnings.put("${type.simpleName}: сохранены только последние 5000 точек")
        if (pageLimited) warnings.put("${type.simpleName}: достигнут лимит страниц (100 × 100 записей); более старая история может быть неполной.")
        if (reducedDenseSamples) warnings.put(
            "${type.simpleName}: сохранена последняя точка часа за последние 30 дней и последняя точка каждого 6-часового интервала в более старой истории. Остальные точки не показаны; средние не рассчитывались."
        )
        if (reducedSleepStages) warnings.put(
            "${type.simpleName}: в сессиях с более чем 200 фазами показана равномерная выборка до 200 исходных фаз, включая первую и последнюю. Длительность сна рассчитана по полным исходным данным, а не по выборке."
        )
        return limited || pageLimited
    }
    /** HC aggregation respects source priorities; never add step counts from competing apps ourselves. */
    private suspend fun aggregateDaily(hc: HealthConnectClient, granted: Set<String>, start: Instant,
        end: Instant, out: JSONObject, origins: MutableSet<String>, warnings: JSONArray): Boolean {
        val metrics = mutableSetOf<androidx.health.connect.client.aggregate.AggregateMetric<*>>()
        if (HealthPermission.getReadPermission(StepsRecord::class) in granted) {
            metrics.add(StepsRecord.COUNT_TOTAL)
        }
        if (HealthPermission.getReadPermission(DistanceRecord::class) in granted) {
            metrics.add(DistanceRecord.DISTANCE_TOTAL)
        }
        if (HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class) in granted) {
            metrics.add(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL)
        }
        if (HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class) in granted) {
            metrics.add(TotalCaloriesBurnedRecord.ENERGY_TOTAL)
        }
        if (HealthPermission.getReadPermission(HydrationRecord::class) in granted) {
            metrics.add(HydrationRecord.VOLUME_TOTAL)
        }
        if (HealthPermission.getReadPermission(NutritionRecord::class) in granted) {
            metrics.add(NutritionRecord.ENERGY_TOTAL)
        }
        if (HealthPermission.getReadPermission(ExerciseSessionRecord::class) in granted) {
            metrics.add(ExerciseSessionRecord.EXERCISE_DURATION_TOTAL)
        }
        if (HealthPermission.getReadPermission(FloorsClimbedRecord::class) in granted) {
            metrics.add(FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL)
        }
        if (HealthPermission.getReadPermission(ElevationGainedRecord::class) in granted) {
            metrics.add(ElevationGainedRecord.ELEVATION_GAINED_TOTAL)
        }
        if (metrics.isEmpty()) return true
        val daily = JSONObject()
        val zone = ZoneId.systemDefault()
        try {
            currentCoroutineContext().ensureActive()
            val buckets = hc.aggregateGroupByPeriod(AggregateGroupByPeriodRequest(
                metrics,TimeRangeFilter.between(start.atZone(zone).toLocalDateTime(),end.atZone(zone).toLocalDateTime()),
                Period.ofDays(1)))
            for (bucket in buckets.sortedBy { it.startTime }) {
                currentCoroutineContext().ensureActive()
                val date = bucket.startTime.toLocalDate()
                val a = maxOf(start,bucket.startTime.atZone(zone).toInstant())
                val b = minOf(end,bucket.endTime.atZone(zone).toInstant())
                if (a < b) {
                    val result = bucket.result
                    result.dataOrigins.forEach { origins.add(it.packageName) }
                    fun put(id: String, v: Double?) {
                        if (v == null) return
                        val arr = daily.optJSONArray(id) ?: JSONArray().also { daily.put(id, it) }
                        arr.put(JSONObject().put("id", "day:$date").put("v", v).put("ts", b.minusMillis(1).toEpochMilli())
                            .put("day", date.toString()).put("source", "Health Connect"))
                    }
                    put("steps", result[StepsRecord.COUNT_TOTAL]?.toDouble())
                    put("distance", result[DistanceRecord.DISTANCE_TOTAL]?.inKilometers)
                    put("activeCalories", result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories)
                    put("totalCalories", result[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.inKilocalories)
                    put("water", result[HydrationRecord.VOLUME_TOTAL]?.inMilliliters)
                    put("nutrition", result[NutritionRecord.ENERGY_TOTAL]?.inKilocalories)
                    put("exercise", result[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.seconds?.div(60.0))
                    put("floors", result[FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL])
                    put("elevation", result[ElevationGainedRecord.ELEVATION_GAINED_TOTAL]?.inMeters)
                }
            }
            for (id in listOf("steps", "distance", "activeCalories", "totalCalories", "water","nutrition","exercise","floors","elevation")) {
                // Remove raw interval samples even when HC returned no aggregates.
                if (out.has(id)) out.remove(id)
                daily.optJSONArray(id)?.let { out.put(id, it) }
            }
            return true
        } catch (e: CancellationException) { throw e }
        catch (e: Exception) {
            // Never present partial interval samples as daily totals after aggregation failure.
            listOf("steps", "distance", "activeCalories", "totalCalories", "water","nutrition","exercise","floors","elevation").forEach { out.remove(it) }
            warnings.put("Итоги за день не прочитаны: ${e.localizedMessage}")
            return false
        }
    }
    /** Foreground reads only. Cancellation is rethrown before any snapshot is emitted. */
    fun onHostStop() {
        syncGeneration++
        val active = job
        if (active?.isActive == true) {
            active.cancel()
            event("cancelled", "Чтение приостановлено: приложение свёрнуто. Ранее прочитанные данные сохранены.")
        }
    }
    fun close() { syncGeneration++; scope.cancel() }
}
