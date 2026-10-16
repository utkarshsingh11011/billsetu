package `in`.billsetu.app.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Dashboard : Screen("dashboard", "BillSetu")
    object CreateInvoice : Screen("create_invoice?invoiceId={invoiceId}&partyId={partyId}", "Create Invoice") {
        fun createRoute(invoiceId: String? = null, partyId: String? = null): String {
            return "create_invoice?invoiceId=${invoiceId ?: ""}&partyId=${partyId ?: ""}"
        }
    }
    object InvoiceDetail : Screen("invoice_detail/{invoiceId}", "Invoice Details") {
        fun createRoute(invoiceId: String): String = "invoice_detail/$invoiceId"
    }
    object ThermalReceipt : Screen("thermal_receipt/{invoiceId}", "Thermal Receipt") {
        fun createRoute(invoiceId: String): String = "thermal_receipt/$invoiceId"
    }
    object Scan : Screen("scan", "Scan Bill")
    object Records : Screen("records", "Records & Ledgers")
    object Parties : Screen("parties", "Customers & Parties")
    object Subscription : Screen("subscription", "Brand & Pro")
    object Reports : Screen("reports", "GST & Reports")
}
