package `in`.billsetu.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import `in`.billsetu.app.data.model.*
import `in`.billsetu.app.data.repository.BillSetuRepository
import `in`.billsetu.app.data.service.TaxEngine
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class BillSetuViewModel(
    private val repository: BillSetuRepository = BillSetuRepository()
) : ViewModel() {

    val profile: StateFlow<BusinessProfile> = repository.profile
    val subscription: StateFlow<Subscription> = repository.subscription
    val invoices: StateFlow<List<Invoice>> = repository.invoices
    val parties: StateFlow<List<Party>> = repository.parties
    val items: StateFlow<List<Item>> = repository.items
    val scans: StateFlow<List<ScannedDocument>> = repository.scans
    val expenses: StateFlow<List<PurchaseExpense>> = repository.expenses

    fun getInvoice(id: String): Invoice? {
        return invoices.value.find { it.id == id }
    }

    fun getParty(id: String): Party? {
        return parties.value.find { it.id == id }
    }

    fun saveInvoice(invoice: Invoice): Invoice {
        return repository.saveInvoice(invoice)
    }

    fun cancelInvoice(invoiceId: String, reason: String) {
        repository.cancelInvoice(invoiceId, reason)
    }

    fun recordPayment(invoiceId: String, amountPaise: Long, method: String, reference: String?) {
        val payment = PaymentRecord(
            id = "pay_${System.currentTimeMillis()}",
            amountPaise = amountPaise,
            date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
            method = method,
            referenceNo = reference
        )
        repository.recordPayment(invoiceId, payment)
    }

    fun cloneInvoice(source: Invoice): Invoice {
        val prof = profile.value
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val dueDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(
            Date(System.currentTimeMillis() + 15L * 24 * 3600 * 1000)
        )

        return source.copy(
            id = "", // new draft
            invoiceNumber = "${prof.invoicePrefix}${prof.nextInvoiceSequence}",
            invoiceDate = today,
            dueDate = dueDate,
            status = "draft",
            issuedAt = null,
            cancelledAt = null,
            cancellationReason = null,
            payments = emptyList(),
            amountPaidPaise = 0L,
            balanceDuePaise = source.grandTotalPaise
        )
    }

    fun saveParty(party: Party) {
        repository.saveParty(party)
    }

    fun saveScan(scan: ScannedDocument) {
        repository.saveScan(scan)
    }

    fun saveExpense(expense: PurchaseExpense) {
        repository.saveExpense(expense)
    }

    fun upgradeToPro() {
        repository.upgradeToPro()
    }

    fun downgradeToFree() {
        repository.downgradeToFree()
    }
}
