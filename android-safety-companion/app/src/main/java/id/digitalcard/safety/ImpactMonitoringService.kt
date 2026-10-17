package id.digitalcard.safety

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.app.AlertDialog

class ImpactMonitoringService : Service(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var linearAcceleration: Sensor? = null
    private var lastHighSampleAt = 0L
    private var lastImpactAt = 0L
    private var alertPending = false
    private lateinit var notificationManager: NotificationManager

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopMonitoring()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_ACK -> {
                alertPending = false
                lastHighSampleAt = 0L
                notificationManager.notify(NOTIFICATION_ID, buildNotification(false))
                return START_STICKY
            }
            ACTION_HELP -> {
                alertPending = true
                notificationManager.notify(NOTIFICATION_ID, buildNotification(true, "Anda memilih membutuhkan bantuan. Hubungi orang tepercaya atau layanan darurat."))
                return START_STICKY
            }
        }

        try {
            startForeground(NOTIFICATION_ID, buildNotification(false))
            linearAcceleration = sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION)
            if (linearAcceleration == null) {
                notificationManager.notify(NOTIFICATION_ID, buildNotification(false, "Sensor akselerasi linear tidak tersedia di perangkat ini."))
                stopSelf()
                return START_NOT_STICKY
            }
            sensorManager.unregisterListener(this)
            sensorManager.registerListener(this, linearAcceleration, SensorManager.SENSOR_DELAY_GAME)
        } catch (e: Exception) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_LINEAR_ACCELERATION || event.values.size < 3) return
        val x = event.values[0].toDouble()
        val y = event.values[1].toDouble()
        val z = event.values[2].toDouble()
        val magnitude = kotlin.math.sqrt(x * x + y * y + z * z)
        val now = System.currentTimeMillis()

        // Require two close high samples to reduce single-sample noise; this is not a validated crash detector.
        if (magnitude >= IMPACT_THRESHOLD) {
            if (lastHighSampleAt != 0L && now - lastHighSampleAt <= 350 && now - lastImpactAt >= COOLDOWN_MS) {
                lastImpactAt = now
                alertPending = true
                vibrate()
                notificationManager.notify(NOTIFICATION_ID, buildNotification(
                    true,
                    "Gerakan kuat terdeteksi. Periksa kondisi Anda; ini belum tentu kecelakaan."
                ))
                lastHighSampleAt = 0L
            } else {
                lastHighSampleAt = now
            }
        } else {
            lastHighSampleAt = 0L
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun buildNotification(alert: Boolean, messageOverride: String? = null): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            action = if (alert) MainActivity.ACTION_IMPACT_HELP else Intent.ACTION_MAIN
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPending = PendingIntent.getActivity(
            this, 100, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        builder.setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(if (alert) "Safety Center: periksa kondisi" else "Safety Center aktif")
            .setContentText(messageOverride ?: if (alert) "Gerakan kuat terdeteksi. Apakah Anda baik-baik saja?" else "Pemantauan benturan aktif atas permintaan Anda.")
            .setStyle(Notification.BigTextStyle().bigText(messageOverride ?: if (alert) "Gerakan kuat terdeteksi. Konfirmasi kondisi Anda. Alarm bisa keliru; tidak ada panggilan otomatis." else "Sensor aktif hanya setelah Anda menyalakannya. Ketuk untuk membuka Digital Card OS."))
            .setCategory(if (alert) Notification.CATEGORY_ALARM else Notification.CATEGORY_SERVICE)
            .setPriority(if (alert) Notification.PRIORITY_HIGH else Notification.PRIORITY_LOW)
            .setOngoing(!alert)
            .setAutoCancel(alert)
            .setContentIntent(openPending)

        if (alert) {
            val safeIntent = Intent(this, MainActivity::class.java).apply {
                action = MainActivity.ACTION_IMPACT_SAFE
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val helpIntent = Intent(this, MainActivity::class.java).apply {
                action = MainActivity.ACTION_IMPACT_HELP
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val safePending = PendingIntent.getActivity(this, 101, safeIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val helpPending = PendingIntent.getActivity(this, 102, helpIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            builder.addAction(Notification.Action.Builder(android.R.drawable.ic_menu_view, "Saya aman", safePending).build())
            builder.addAction(Notification.Action.Builder(android.R.drawable.ic_menu_call, "Butuh bantuan", helpPending).build())
        }
        return builder.build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Pemantauan keselamatan",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Status pemantauan sensor dan konfirmasi gerakan kuat"
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun vibrate() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val manager = getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager
                manager.defaultVibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 250, 120, 250), -1))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 250, 120, 250), -1))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(longArrayOf(0, 250, 120, 250), -1)
                }
            }
        } catch (_: Exception) {
            // Vibration is optional and device-dependent.
        }
    }

    private fun stopMonitoring() {
        sensorManager.unregisterListener(this)
        stopForeground(true)
    }

    override fun onDestroy() {
        stopMonitoring()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "id.digitalcard.safety.START"
        const val ACTION_STOP = "id.digitalcard.safety.STOP"
        const val ACTION_ACK = "id.digitalcard.safety.ACK"
        const val ACTION_HELP = "id.digitalcard.safety.HELP"
        private const val CHANNEL_ID = "digital_card_safety"
        private const val NOTIFICATION_ID = 4102
        private const val IMPACT_THRESHOLD = 28.0 // m/s², provisional—not medically validated
        private const val COOLDOWN_MS = 30_000L
    }
}
