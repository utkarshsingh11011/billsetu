package `in`.billsetu.app.data.model

data class BankDetails(
    val bankName: String,
    val accountNo: String,
    val ifsc: String,
    val branch: String,
    val accountHolderName: String,
    val upiId: String? = null
)

data class BusinessProfile(
    val id: String = "biz_001",
    val legalName: String = "Sharma Electricals & Trading",
    val tradeName: String = "Sharma Electricals",
    val gstin: String? = "27AABCU9603R1ZM",
    val isGstRegistered: Boolean = true,
    val address: String = "Shop No 14, APMC Market, Vashi",
    val city: String = "Navi Mumbai",
    val state: String = "Maharashtra",
    val stateCode: String = "27",
    val pincode: String = "400703",
    val phone: String = "+91 98200 12345",
    val email: String = "contact@sharmaelectricals.in",
    val invoicePrefix: String = "INV-2026-",
    val nextInvoiceSequence: Int = 104,
    val financialYear: String = "2026-27",
    val logoUrl: String? = null,
    val termsAndConditions: String = "1. Goods once sold will not be taken back without valid invoice.\n2. Payment due within 15 days of invoice date.\n3. Subject to local jurisdiction.",
    val bankDetails: BankDetails = BankDetails(
        bankName = "State Bank of India",
        accountNo = "38920194821",
        ifsc = "SBIN0001234",
        branch = "Vashi Sector 17",
        accountHolderName = "Sharma Electricals & Trading",
        upiId = "sharmaelectricals@sbi"
    )
)

data class Subscription(
    val plan: String = "free", // "free" | "pro"
    val priceAnnualPaise: Long = 99900L,
    val renewalDate: String? = null,
    val scansQuota: Int = 20,
    val scansUsed: Int = 4,
    val customLogoAllowed: Boolean = false,
    val watermarkRemoved: Boolean = false
) {
    val isPro: Boolean
        get() = plan == "pro"
}
