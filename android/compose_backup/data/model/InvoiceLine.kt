package `in`.billsetu.app.data.model

data class InvoiceLine(
    val id: String,
    val description: String,
    val hsnSac: String,
    val quantity: Double,
    val unit: String = "pcs",
    val unitPricePaise: Long,
    val discountPercent: Double = 0.0,
    val discountPaise: Long = 0L,
    val taxRate: Int = 18,
    val isTaxInclusive: Boolean = false,
    val taxableValuePaise: Long = 0L,
    val cgstPaise: Long = 0L,
    val sgstPaise: Long = 0L,
    val igstPaise: Long = 0L,
    val totalPaise: Long = 0L
)
