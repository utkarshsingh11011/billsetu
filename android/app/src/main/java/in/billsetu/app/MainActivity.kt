package `in`.billsetu.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.print.PrintAttributes
import android.print.PrintManager
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var splashView: FrameLayout
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    // Native Bridge class exposed to WebView JavaScript as window.BillSetuNative and window.Android
    inner class BillSetuNativeBridge {
        @JavascriptInterface
        fun isNativeApp(): Boolean = true

        @JavascriptInterface
        fun getAppVersion(): String = "1.11"

        @JavascriptInterface
        fun vibrate(durationMs: Long) {
            vibratePhone(durationMs)
        }

        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun shareInvoice(shareText: String, base64Pdf: String?, fileName: String?) {
            runOnUiThread {
                shareInvoiceNative(shareText, base64Pdf, fileName)
            }
        }

        @JavascriptInterface
        fun printInvoice(jobTitle: String?) {
            runOnUiThread {
                printCurrentWebPage(jobTitle ?: "BillSetu_Invoice")
            }
        }

        @JavascriptInterface
        fun openUpiPay(upiUrl: String) {
            runOnUiThread {
                launchUpiIntent(upiUrl)
            }
        }

        @JavascriptInterface
        fun savePdfToDownloads(base64Data: String, fileName: String) {
            runOnUiThread {
                savePdfToDownloadsNative(base64Data, fileName)
            }
        }
    }

    // Register activity result launcher for file and camera chooser
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult

        var results: Array<Uri>? = null
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            if (data == null || data.data == null) {
                // Photo captured by camera
                if (cameraImageUri != null) {
                    results = arrayOf(cameraImageUri!!)
                }
            } else {
                val dataUri = data.data
                if (dataUri != null) {
                    results = arrayOf(dataUri)
                }
            }
        }
        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Root container with brand background
        val rootLayout = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0C2B62"))
        }

        // Initialize WebView
        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            setBackgroundColor(Color.parseColor("#0C2B62"))
        }

        // Configure WebView Asset Loader for local HTTPS execution
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        setupWebSettings(webView.settings)

        // Register Native JavaScript Bridges
        val nativeBridge = BillSetuNativeBridge()
        webView.addJavascriptInterface(nativeBridge, "BillSetuNative")
        webView.addJavascriptInterface(nativeBridge, "Android")

        // Splash View Overlay
        splashView = createSplashView()
        rootLayout.addView(webView)
        rootLayout.addView(splashView)
        setContentView(rootLayout)

        // Safety timer: Dismiss splash after max 1500ms so user is never stuck
        Handler(Looper.getMainLooper()).postDelayed({
            dismissSplash()
        }, 1500)

        // Back press handling
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // WebViewClient with robust local asset interceptor
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") {
                    val path = url.path ?: ""
                    val cleanPath = when {
                        path.startsWith("/assets/www/") -> "www/" + path.removePrefix("/assets/www/")
                        path.startsWith("/assets/") -> "www/" + path.removePrefix("/assets/")
                        path.startsWith("/www/") -> "www/" + path.removePrefix("/www/")
                        path.startsWith("/") -> "www" + path
                        else -> "www/$path"
                    }
                    val targetPath = if (cleanPath == "www/" || cleanPath == "www" || cleanPath.endsWith("/")) {
                        "www/index.html"
                    } else {
                        cleanPath
                    }

                    try {
                        val inputStream = assets.open(targetPath)
                        val mimeType = when {
                            targetPath.endsWith(".html") -> "text/html"
                            targetPath.endsWith(".js") || targetPath.endsWith(".mjs") -> "application/javascript"
                            targetPath.endsWith(".css") -> "text/css"
                            targetPath.endsWith(".json") -> "application/json"
                            targetPath.endsWith(".svg") -> "image/svg+xml"
                            targetPath.endsWith(".png") -> "image/png"
                            targetPath.endsWith(".jpg") || targetPath.endsWith(".jpeg") -> "image/jpeg"
                            targetPath.endsWith(".ico") -> "image/x-icon"
                            targetPath.endsWith(".woff2") -> "font/woff2"
                            targetPath.endsWith(".woff") -> "font/woff"
                            targetPath.endsWith(".ttf") -> "font/ttf"
                            else -> "application/octet-stream"
                        }
                        val response = WebResourceResponse(mimeType, "UTF-8", inputStream)
                        val headers = HashMap<String, String>()
                        headers["Access-Control-Allow-Origin"] = "*"
                        response.responseHeaders = headers
                        return response
                    } catch (_: Exception) {
                        // SPA fallback: return index.html for extensionless client routes
                        val lastSegment = targetPath.substringAfterLast("/")
                        if (!lastSegment.contains(".")) {
                            try {
                                val indexStream = assets.open("www/index.html")
                                val response = WebResourceResponse("text/html", "UTF-8", indexStream)
                                val headers = HashMap<String, String>()
                                headers["Access-Control-Allow-Origin"] = "*"
                                response.responseHeaders = headers
                                return response
                            } catch (_: Exception) {}
                        }
                    }
                }
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                return handleExternalUrls(url)
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                Handler(Looper.getMainLooper()).postDelayed({
                    dismissSplash()
                }, 100)

                // Inject native print & native helpers
                view.evaluateJavascript(
                    """
                    if (!window.__billsetu_native_ready) {
                        window.__billsetu_native_ready = true;
                        window.print = function() {
                            if (window.BillSetuNative && window.BillSetuNative.printInvoice) {
                                window.BillSetuNative.printInvoice(document.title || 'BillSetu_Invoice');
                            }
                        };
                    }
                    """.trimIndent(), null
                )
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                super.onReceivedError(view, request, error)
                if (request.isForMainFrame) {
                    if (request.url.toString().startsWith("https://appassets.androidplatform.net")) {
                        view.loadUrl("file:///android_asset/www/index.html")
                    }
                }
            }
        }

        // WebChromeClient
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                openCameraOrFileChooser()
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.d("BillSetuWeb", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                }
                return true
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message?
            ): Boolean {
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                val newWebView = WebView(this@MainActivity)
                newWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                        val targetUrl = request.url.toString()
                        if (handleExternalUrls(targetUrl)) {
                            return true
                        }
                        return try {
                            startActivity(Intent(Intent.ACTION_VIEW, request.url))
                            true
                        } catch (_: Exception) {
                            false
                        }
                    }
                }
                transport.webView = newWebView
                resultMsg.sendToTarget()
                return true
            }
        }

        // Download Listener for generated Invoices & PDFs
        webView.setDownloadListener { url, _, _, mimetype, _ ->
            handleInvoiceDownload(url, mimetype)
        }

        // Determine initial URL (check deep links e.g. https://billsetu.in/bill/* or billsetu://bill/*)
        val initialUrl = determineStartUrl(intent)
        webView.loadUrl(initialUrl)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val deepLinkUrl = determineStartUrl(intent)
        webView.loadUrl(deepLinkUrl)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebSettings(settings: WebSettings) {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            displayZoomControls = false
            setSupportMultipleWindows(true)
            userAgentString = "${settings.userAgentString} BillSetuMobileApp/1.11"
        }
        WebView.setWebContentsDebuggingEnabled(true)
    }

    private fun dismissSplash() {
        if (::splashView.isInitialized && splashView.visibility == View.VISIBLE) {
            splashView.animate()
                .alpha(0f)
                .setDuration(200)
                .withEndAction { splashView.visibility = View.GONE }
                .start()
        }
    }

    fun printCurrentWebPage(jobTitle: String = "BillSetu_Invoice") {
        try {
            val printManager = getSystemService(Context.PRINT_SERVICE) as? PrintManager ?: return
            val printAdapter = webView.createPrintDocumentAdapter(jobTitle)
            val printAttributes = PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build()
            printManager.print(jobTitle, printAdapter, printAttributes)
        } catch (e: Exception) {
            Toast.makeText(this, "Print error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun shareInvoiceNative(shareText: String, base64Pdf: String?, fileName: String?) {
        try {
            if (!base64Pdf.isNullOrEmpty()) {
                val pdfRaw = if (base64Pdf.contains("base64,")) {
                    base64Pdf.substringAfter("base64,")
                } else {
                    base64Pdf
                }
                val pdfBytes = Base64.decode(pdfRaw, Base64.DEFAULT)

                val shareDir = File(cacheDir, "shared_invoices").apply { mkdirs() }
                val targetFileName = fileName ?: "BillSetu_Invoice_${System.currentTimeMillis()}.pdf"
                val file = File(shareDir, targetFileName)
                FileOutputStream(file).use { it.write(pdfBytes) }

                val contentUri = FileProvider.getUriForFile(this, "${packageName}.fileprovider", file)

                val sendIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "application/pdf"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(Intent.EXTRA_TEXT, shareText)
                    putExtra(Intent.EXTRA_SUBJECT, targetFileName.removeSuffix(".pdf"))
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                val chooser = Intent.createChooser(sendIntent, "Share Bill via")
                startActivity(chooser)
            } else {
                val textIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, shareText)
                }
                startActivity(Intent.createChooser(textIntent, "Share Bill Details"))
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to share bill: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun savePdfToDownloadsNative(base64Data: String, fileName: String) {
        try {
            val rawBase64 = if (base64Data.contains("base64,")) {
                base64Data.substringAfter("base64,")
            } else {
                base64Data
            }
            val decodedBytes = Base64.decode(rawBase64, Base64.DEFAULT)
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs()
            }
            val finalName = if (fileName.endsWith(".pdf")) fileName else "$fileName.pdf"
            val targetFile = File(downloadsDir, finalName)
            FileOutputStream(targetFile).use { it.write(decodedBytes) }

            Toast.makeText(this, "Invoice saved to Downloads: $finalName", Toast.LENGTH_LONG).show()

            // Media scan broadcast
            @Suppress("DEPRECATION")
            val scanIntent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE).apply {
                data = Uri.fromFile(targetFile)
            }
            sendBroadcast(scanIntent)
        } catch (e: Exception) {
            Toast.makeText(this, "Could not save PDF: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun launchUpiIntent(upiUrl: String) {
        try {
            val upiIntent = Intent(Intent.ACTION_VIEW, Uri.parse(upiUrl))
            val chooser = Intent.createChooser(upiIntent, "Pay Invoice with UPI")
            startActivity(chooser)
        } catch (_: Exception) {
            Toast.makeText(this, "No UPI payment app found", Toast.LENGTH_SHORT).show()
        }
    }

    fun vibratePhone(durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createOneShot(durationMs.coerceAtMost(500), VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                @Suppress("DEPRECATION")
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(durationMs.coerceAtMost(500))
            }
        } catch (_: Exception) {}
    }

    private fun handleExternalUrls(url: String): Boolean {
        // Direct WhatsApp Integration
        if (url.startsWith("whatsapp://") || url.startsWith("https://wa.me/") || url.startsWith("https://api.whatsapp.com/")) {
            return try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    setPackage("com.whatsapp")
                }
                startActivity(intent)
                true
            } catch (e: ActivityNotFoundException) {
                try {
                    val fallbackIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(fallbackIntent)
                    true
                } catch (e2: Exception) {
                    Toast.makeText(this, "WhatsApp is not installed on this device", Toast.LENGTH_SHORT).show()
                    true
                }
            }
        }

        // Direct UPI Payment Intent (GPay, PhonePe, Paytm, BHIM)
        if (url.startsWith("upi://")) {
            return try {
                val upiIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                startActivity(Intent.createChooser(upiIntent, "Pay using UPI"))
                true
            } catch (e: Exception) {
                Toast.makeText(this, "No UPI payment app found", Toast.LENGTH_SHORT).show()
                true
            }
        }

        // Phone Dial & Email
        if (url.startsWith("tel:") || url.startsWith("mailto:")) {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                return true
            } catch (e: Exception) {
                return false
            }
        }

        return false
    }

    private fun openCameraOrFileChooser() {
        // Prepare temporary camera image output
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        val photoFile = File.createTempFile("DUTY_SLIP_${timeStamp}_", ".jpg", storageDir)
        cameraImageUri = FileProvider.getUriForFile(this, "${packageName}.fileprovider", photoFile)

        val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
        }

        val pickIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
        }

        val chooserIntent = Intent.createChooser(pickIntent, "Capture Duty Slip or Select Receipt").apply {
            putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(captureIntent))
        }

        fileChooserLauncher.launch(chooserIntent)
    }

    private fun handleInvoiceDownload(url: String, mimetype: String?) {
        try {
            if (url.startsWith("data:")) {
                val base64Data = url.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)

                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val fileName = "BillSetu_Invoice_${System.currentTimeMillis()}.pdf"
                val targetFile = File(downloadsDir, fileName)

                FileOutputStream(targetFile).use { it.write(decodedBytes) }

                Toast.makeText(this, "Invoice PDF saved to Downloads: $fileName", Toast.LENGTH_LONG).show()

                @Suppress("DEPRECATION")
                val scanIntent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE).apply {
                    data = Uri.fromFile(targetFile)
                }
                sendBroadcast(scanIntent)
            } else {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                startActivity(browserIntent)
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Failed to download bill: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun determineStartUrl(intent: Intent?): String {
        val baseAssetUrl = "https://appassets.androidplatform.net/assets/www/index.html"
        val dataUri = intent?.data ?: return baseAssetUrl

        val scheme = dataUri.scheme
        val path = dataUri.path ?: ""
        if ((scheme == "https" || scheme == "http") && path.startsWith("/bill/")) {
            val billId = path.substringAfter("/bill/")
            return "$baseAssetUrl?bill=$billId"
        }
        if (scheme == "billsetu") {
            val host = dataUri.host ?: ""
            if (host == "bill" || path.startsWith("/bill/")) {
                val billId = if (host == "bill") path.removePrefix("/") else path.substringAfter("/bill/")
                return "$baseAssetUrl?bill=$billId"
            }
        }

        return baseAssetUrl
    }

    private fun createSplashView(): FrameLayout {
        return FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0C2B62"))

            val logoView = ImageView(this@MainActivity).apply {
                layoutParams = FrameLayout.LayoutParams(360, 180).apply {
                    gravity = android.view.Gravity.CENTER
                }
                setImageResource(R.drawable.billsetu_logo)
                scaleType = ImageView.ScaleType.FIT_CENTER
            }

            val progressBar = ProgressBar(this@MainActivity).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    gravity = android.view.Gravity.BOTTOM or android.view.Gravity.CENTER_HORIZONTAL
                    bottomMargin = 180
                }
                indeterminateDrawable?.setTint(Color.parseColor("#19B0A0"))
            }

            addView(logoView)
            addView(progressBar)
        }
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
