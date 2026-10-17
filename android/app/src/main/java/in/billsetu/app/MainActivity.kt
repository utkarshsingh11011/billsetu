package `in`.billsetu.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.view.ViewGroup
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var splashView: FrameLayout
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    // Register activity result launcher for file and camera chooser
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult

        var results: Array<Uri>? = null
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            if (data == null || data.data == null) {
                // If there is no data, photo was captured by camera and stored in cameraImageUri
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

        // Root container
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

        // Splash View Overlay
        splashView = createSplashView()
        rootLayout.addView(webView)
        rootLayout.addView(splashView)
        setContentView(rootLayout)

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

        // WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
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
                // Smoothly dismiss splash screen after brief render delay
                Handler(Looper.getMainLooper()).postDelayed({
                    splashView.animate()
                        .alpha(0f)
                        .setDuration(250)
                        .withEndAction { splashView.visibility = View.GONE }
                        .start()
                }, 150)
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
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            displayZoomControls = false
            userAgentString = "${settings.userAgentString} BillSetuMobileApp/1.0.0"
        }
        WebView.setWebContentsDebuggingEnabled(false)
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
                // Base64 Data URL Download (e.g. jspdf generated invoices)
                val base64Data = url.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)

                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val fileName = "BillSetu_Invoice_${System.currentTimeMillis()}.pdf"
                val targetFile = File(downloadsDir, fileName)

                FileOutputStream(targetFile).use { it.write(decodedBytes) }

                Toast.makeText(this, "Invoice PDF saved to Downloads: $fileName", Toast.LENGTH_LONG).show()

                // Broadcast media scan
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

        // Handle https://billsetu.in/bill/<id> or billsetu://bill/<id>
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
