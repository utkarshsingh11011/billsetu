package `in`.billsetu.app.data.model

data class Party(
    val id: String,
    val type: String = "customer", // "customer" | "supplier"
    val name: String,
    val tradeName: String? = null,
    val gstin: String? = null,
    val state: String,
    val stateCode: String,
    val address: String,
    val city: String,
    val pincode: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val balancePaise: Long = 0L,
    val lookupStatus: String = "unverified_manual" // "verified_active" | "unverified_manual" | "not_found"
) {
    val isGstRegistered: Boolean
        get() = !gstin.isNullOrBlank() && gstin.length == 15
}
