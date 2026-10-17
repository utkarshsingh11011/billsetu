package `in`.billsetu.app.data.model

data class PaymentRecord(
    val id: String,
    val amountPaise: Long,
    val date: String,
    val method: String = "upi", // "cash" | "upi" | "bank_transfer" | "cheque"
    val referenceNo: String? = null,
    val notes: String? = null
)

data class Invoice(
    val id: String,
    val businessId: String,
    val invoiceNumber: String,
    val invoiceDate: String,
    val dueDate: String,
    val type: String = "gst_tax_invoice", // "gst_tax_invoice" | "non_gst_bill"
    val status: String = "draft", // "draft" | "issued" | "paid" | "cancelled"
    val party: Party,
    val placeOfSupplyState: String,
    val placeOfSupplyStateCode: String,
    val isReverseCharge: Boolean = false,
    val lines: List<InvoiceLine> = emptyList(),
    val subtotalPaise: Long = 0L,
    val totalDiscountPaise: Long = 0L,
    val taxableValuePaise: Long = 0L,
    val cgstPaise: Long = 0L,
    val sgstPaise: Long = 0L,
    val igstPaise: Long = 0L,
    val roundOffPaise: Long = 0L,
    val grandTotalPaise: Long = 0L,
    val amountPaidPaise: Long = 0L,
    val balanceDuePaise: Long = 0L,
    val notes: String? = null,
    val terms: String? = null,
    val issuedAt: String? = null,
    val cancelledAt: String? = null,
    val cancellationReason: String? = null,
    val version: Int = 1,
    val payments: List<PaymentRecord> = emptyList()
) {
    val isInterState: Boolean
        get() = placeOfSupplyStateCode != party.stateCode

    val isPaid: Boolean
        get() = status == "paid" || (status == "issued" && balanceDuePaise == 0L)
}
