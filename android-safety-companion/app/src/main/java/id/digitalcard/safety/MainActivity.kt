package id.digitalcard.safety

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var status: TextView
    private var pendingWebPermission: PermissionRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestNotificationPermission()
        buildScreen()
        handleIntent(intent)
    }

    private fun buildScreen() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(20, 18, 20, 8)
        }
        val title = TextView(this).apply {
            text = "Digital Card Safety"
            textSize = 21f
            setTextColor(0xFF12394A.toInt())
        }
        val note = TextView(this).apply {
            text = "Pemantauan benturan hanya berjalan setelah Anda mengaktifkannya. Tidak ada SOS, SMS, atau panggilan otomatis."
            textSize = 13f
            setPadding(0, 6, 0, 10)
        }
        status = TextView(this).apply {
            text = "Pemantauan benturan tidak aktif."
            textSize = 13f
            setPadding(0, 4, 0, 8)
        }
        val controls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        controls.addView(Button(this).apply {
            text = "Aktifkan sensor"
            setOnClickListener { startMonitoring() }
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        controls.addView(Button(this).apply {
            text = "Matikan sensor"
            setOnClickListener { stopMonitoring() }
        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = true
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return request.url.host != "digital-card-os.hatchable.site"
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                val cameraOnly = request.resources.all { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
                if (!cameraOnly || request.origin.host != "digital-card-os.hatchable.site") {
                    request.deny()
                    return
                }
                if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.resources)
                } else {
                    pendingWebPermission = request
                    requestPermissions(arrayOf(Manifest.permission.CAMERA), CAMERA_PERMISSION_REQUEST)
                }
            }
        }
        webView.loadUrl(WALLET_URL)

        root.addView(title)
        root.addView(note)
        root.addView(status)
        root.addView(controls)
        root.addView(webView, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        setContentView(root)
    }

    private fun startMonitoring() {
        val sensor = packageManager.hasSystemFeature(PackageManager.FEATURE_SENSOR_ACCELEROMETER)
        if (!sensor) {
            status.text = "Perangkat ini tidak melaporkan dukungan akselerometer."
            return
        }
        val intent = Intent(this, ImpactMonitoringService::class.java)
            .setAction(ImpactMonitoringService.ACTION_START)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
            status.text = "Permintaan pemantauan dikirim. Periksa notifikasi untuk statusnya."
        } catch (e: Exception) {
            status.text = "Sensor tidak dapat diaktifkan: ${e.message ?: "izin atau kebijakan perangkat"}"
        }
    }

    private fun stopMonitoring() {
        startService(Intent(this, ImpactMonitoringService::class.java).setAction(ImpactMonitoringService.ACTION_STOP))
        status.text = "Permintaan mematikan sensor dikirim."
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_PERMISSION_REQUEST)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            val request = pendingWebPermission
            pendingWebPermission = null
            if (request != null && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.resources)
            } else request?.deny()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        when (intent?.action) {
            ACTION_IMPACT_SAFE -> {
                startService(Intent(this, ImpactMonitoringService::class.java).setAction(ImpactMonitoringService.ACTION_ACK))
                Toast.makeText(this, "Anda mengonfirmasi bahwa Anda baik-baik saja.", Toast.LENGTH_LONG).show()
            }
            ACTION_IMPACT_HELP -> {
                startService(Intent(this, ImpactMonitoringService::class.java).setAction(ImpactMonitoringService.ACTION_HELP))
                android.app.AlertDialog.Builder(this)
                    .setTitle("Butuh bantuan?")
                    .setMessage("Hubungi kontak tepercaya atau layanan darurat setempat sekarang. Aplikasi tidak mengirim SOS otomatis.")
                    .setPositiveButton("Buka Safety Center") { _, _ ->
                        webView.post { webView.evaluateJavascript("document.getElementById('safety-panel')?.scrollIntoView({behavior:'smooth'})", null) }
                    }
                    .setNegativeButton("Tutup", null)
                    .show()
            }
        }
    }

    override fun onDestroy() {
        pendingWebPermission?.deny()
        pendingWebPermission = null
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        const val WALLET_URL = "https://digital-card-os.hatchable.site/wallet/"
        const val ACTION_IMPACT_SAFE = "id.digitalcard.safety.IMPACT_SAFE"
        const val ACTION_IMPACT_HELP = "id.digitalcard.safety.IMPACT_HELP"
        const val CAMERA_PERMISSION_REQUEST = 410
        const val NOTIFICATION_PERMISSION_REQUEST = 411
    }
}
