package id.digitalcard.safety

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var pendingWebPermission: PermissionRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        )
        buildWallet()
    }

    private fun buildWallet() {
        webView = WebView(this)
        webView.setBackgroundColor(0xFF071522.toInt())
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.webViewClient = object : WebViewClient() {
            private var offlineShown = false
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return uri.scheme != "https" || uri.host != "yudi8377.github.io"
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                super.onReceivedError(view, request, error)
                if (request.isForMainFrame && !offlineShown) {
                    offlineShown = true
                    view.loadDataWithBaseURL(null, offlineWalletHtml(), "text/html", "UTF-8", null)
                }
            }
            override fun onPageStarted(view: WebView, url: String, favicon: android.graphics.Bitmap?) {
                if (url == WALLET_URL) offlineShown = false
                super.onPageStarted(view, url, favicon)
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                val cameraOnly = request.resources.all { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
                if (!cameraOnly || request.origin.host != "yudi8377.github.io") {
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
        setContentView(webView)
        webView.loadUrl(WALLET_URL)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_REQUEST) {
            val request = pendingWebPermission
            pendingWebPermission = null
            if (request != null && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.resources)
            } else {
                request?.deny()
                Toast.makeText(this, "Izin kamera tidak diberikan.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        pendingWebPermission?.deny()
        pendingWebPermission = null
        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun offlineWalletHtml(): String = """
        <!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
        <meta name="theme-color" content="#071522"><title>Dompet Kartu Digital · Offline</title>
        <style>
        *{box-sizing:border-box}body{margin:0;background:#071522;color:#f3f8fb;font:16px system-ui,sans-serif;padding:12px}
        .menu{position:fixed;right:12px;top:12px;z-index:2}button{background:#102a3b;color:white;border:1px solid #315163;border-radius:12px;padding:12px}
        #items{display:none;position:fixed;right:12px;top:62px;z-index:3;background:#0b2030;border:1px solid #315163;border-radius:14px;padding:8px;max-width:85vw}
        #items p{font-size:13px;color:#b8ccd7;padding:8px;margin:0}.card{height:80svh;min-height:380px;border-radius:22px;padding:24px;background:linear-gradient(145deg,#16465a,#102a3b 58%,#0b1728);display:flex;flex-direction:column;justify-content:space-between;border:1px solid #5ce0c555}
        .eyebrow{font-size:11px;letter-spacing:2px;color:#8debd9}.name{font-size:28px;font-weight:800;margin:10px 0}.muted{color:#b8ccd7;font-size:13px}.foot{border-top:1px solid #ffffff33;padding-top:18px}
        </style></head><body>
        <button class="menu" onclick="let m=document.getElementById('items');m.style.display=m.style.display==='block'?'none':'block'" aria-label="Menu">☰</button>
        <nav id="items"><p>Scan e-KTP — perlu koneksi untuk fitur online</p><p>QR & Presensi — data demo offline</p><p>Simpan Kontak — belum tersedia offline</p><p>Safety Center & Peta — perlu koneksi</p><p>Mode offline: kartu contoh saja, belum terverifikasi</p><button onclick="location.href='https://yudi8377.github.io/Kartu-Pelajar-Digital-Student-ID-OS/wallet/'">Coba sambungkan kembali</button></nav>
        <main class="card"><div><div class="eyebrow">DIGITAL IDENTITY · DEMO</div><div class="name">Dompet Kartu Digital</div><div class="muted">Kartu contoh offline</div></div>
        <div class="foot"><div style="font-size:18px;font-weight:700">Kartu tersimpan lokal</div><p class="muted">Data asli tidak dimuat saat offline. Ini bukan kartu identitas resmi atau bukti verifikasi.</p><div class="eyebrow">DIGITAL CARD OS</div></div></main>
        </body></html>
    """.trimIndent()

    companion object {
        const val WALLET_URL = "https://yudi8377.github.io/Kartu-Pelajar-Digital-Student-ID-OS/wallet/"
        const val CAMERA_PERMISSION_REQUEST = 410
        const val ACTION_IMPACT_SAFE = "id.digitalcard.safety.IMPACT_SAFE"
        const val ACTION_IMPACT_HELP = "id.digitalcard.safety.IMPACT_HELP"
    }
}
