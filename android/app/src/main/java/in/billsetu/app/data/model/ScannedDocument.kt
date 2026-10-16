package `in`.billsetu.app.data.model

data class ExtractedField<T>(
    val value: T,
    val confidence: Float,
    val isUncertain: Boolean = confidence < 0.85f
)

data class ExtractedLine(
    val description: String,
    val quantity: Double,
    val unitPricePaise: Long,
    val taxRate: Int,
    val totalPaise: Long,
    val confidence: Float
)

data class ScannedDocument(
    val id: String,
    val fileName: String,
    val scannedAt: String,
    val status: String = "needs_review", // "needs_review" | "reviewed" | "archived"
    val vendorName: ExtractedField<String>,
    val vendorGstin: ExtractedField<String>?,
    val invoiceNumber: ExtractedField<String>,
    val invoiceDate: ExtractedField<String>,
    val totalAmountPaise: ExtractedField<Long>,
    val taxAmountPaise: ExtractedField<Long>?,
    val lines: List<ExtractedLine> = emptyList(),
    val destination: String = "expense", // "expense" | "sales_record" | "archive"
    val hasArithmeticMismatch: Boolean = false,
    val arithmeticNote: String? = null
)

data class PurchaseExpense(
    val id: String,
    val invoiceNumber: String,
    val invoiceDate: String,
    val vendorName: String,
    val vendorGstin: String? = null,
    val category: String = "Inventory / Stock",
    val taxableAmountPaise: Long,
    val taxPaise: Long,
    val totalAmountPaise: Long,
    val paymentStatus: String = "paid", // "paid" | "pending"
    val notes: String? = null
)
