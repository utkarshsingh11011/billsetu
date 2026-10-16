package `in`.billsetu.app.data.repository

import `in`.billsetu.app.data.model.*
import `in`.billsetu.app.data.service.TaxEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class BillSetuRepository {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    // Profile & Subscription
    private val _profile = MutableStateFlow(BusinessProfile())
    val profile: StateFlow<BusinessProfile> = _profile.asStateFlow()

    private val _subscription = MutableStateFlow(Subscription(plan = "free"))
    val subscription: StateFlow<Subscription> = _subscription.asStateFlow()

    // Parties
    private val initialParties = listOf(
        Party(
            id = "p_001",
            type = "customer",
            name = "Metro Hardware Wholesalers Pvt Ltd",
            tradeName = "Metro Hardware",
            gstin = "29AABCU9603R1ZM",
            state = "Karnataka",
            stateCode = "29",
            address = "42 Industrial Layout, Peenya 2nd Stage",
            city = "Bengaluru",
            pincode = "560058",
            phone = "+91 98450 11223",
            email = "accounts@metrohardware.in",
            balancePaise = 247800L,
            lookupStatus = "verified_active"
        ),
        Party(
            id = "p_002",
            type = "customer",
            name = "Godrej & Boyce Mfg Co Ltd",
            tradeName = "Godrej Security Solutions",
            gstin = "27AAACG0562D1ZT",
            state = "Maharashtra",
            stateCode = "27",
            address = "Pirojshanagar, Vikhroli East",
            city = "Mumbai",
            pincode = "400079",
            phone = "+91 98200 44556",
            email = "procurement@godrej.com",
            balancePaise = 0L,
            lookupStatus = "verified_active"
        ),
        Party(
            id = "p_003",
            type = "customer",
            name = "Ramesh Kumar Gupta (Retail)",
            tradeName = null,
            gstin = null,
            state = "Maharashtra",
            stateCode = "27",
            address = "Flat 402, Sai Sagar Apts, Sector 9",
            city = "Navi Mumbai",
            pincode = "400703",
            phone = "+91 98199 88776",
            email = null,
            balancePaise = 0L,
            lookupStatus = "unverified_manual"
        ),
        Party(
            id = "p_004",
            type = "supplier",
            name = "Polycab Wires & Cables Ltd",
            tradeName = "Polycab India",
            gstin = "24AAACP4997K1ZL",
            state = "Gujarat",
            stateCode = "24",
            address = "Polycab House, 771 Mogra Village",
            city = "Vadodara",
            pincode = "390001",
            phone = "+91 99000 12345",
            email = "billing@polycab.com",
            balancePaise = 1580000L,
            lookupStatus = "verified_active"
        )
    )

    private val _parties = MutableStateFlow(initialParties)
    val parties: StateFlow<List<Party>> = _parties.asStateFlow()

    // Items
    private val initialItems = listOf(
        Item(
            id = "it_001",
            name = "Copper Wire 2.5 sq mm (90m roll)",
            hsnSac = "8544",
            unit = "roll",
            defaultPricePaise = 185000L,
            defaultTaxRate = 18,
            isTaxInclusive = false
        ),
        Item(
            id = "it_002",
            name = "Modular 6A Switch (White)",
            hsnSac = "8536",
            unit = "pcs",
            defaultPricePaise = 6500L,
            defaultTaxRate = 18,
            isTaxInclusive = true
        ),
        Item(
            id = "it_003",
            name = "MCB Single Pole 16A C-Curve",
            hsnSac = "8536",
            unit = "pcs",
            defaultPricePaise = 24000L,
            defaultTaxRate = 18,
            isTaxInclusive = false
        ),
        Item(
            id = "it_004",
            name = "Electrical Consulting & Panel Installation",
            hsnSac = "998711",
            unit = "hours",
            defaultPricePaise = 150000L,
            defaultTaxRate = 18,
            isTaxInclusive = false
        )
    )

    private val _items = MutableStateFlow(initialItems)
    val items: StateFlow<List<Item>> = _items.asStateFlow()

    // Seed Invoices
    private val initialInvoices = mutableListOf<Invoice>()

    init {
        // Build initial invoice 1
        val inv1Customer = initialParties[0]
        val l1 = TaxEngine.calculateLineItem(
            InvoiceLine(
                id = "l_01",
                description = "Copper Wire 2.5 sq mm (90m roll)",
                hsnSac = "8544",
                quantity = 10.0,
                unit = "roll",
                unitPricePaise = 185000L,
                taxRate = 18,
                isTaxInclusive = false
            ),
            isInterState = true,
            isGstInvoice = true
        )
        val l2 = TaxEngine.calculateLineItem(
            InvoiceLine(
                id = "l_02",
                description = "MCB Single Pole 16A C-Curve",
                hsnSac = "8536",
                quantity = 15.0,
                unit = "pcs",
                unitPricePaise = 24000L,
                taxRate = 18,
                isTaxInclusive = false
            ),
            isInterState = true,
            isGstInvoice = true
        )
        val t1 = TaxEngine.calculateInvoiceTotals(listOf(l1, l2), amountPaidPaise = 0L)
        initialInvoices.add(
            Invoice(
                id = "inv_001",
                businessId = "biz_001",
                invoiceNumber = "INV-2026-101",
                invoiceDate = "2026-10-12",
                dueDate = "2026-10-27",
                type = "gst_tax_invoice",
                status = "issued",
                party = inv1Customer,
                placeOfSupplyState = inv1Customer.state,
                placeOfSupplyStateCode = inv1Customer.stateCode,
                lines = listOf(l1, l2),
                subtotalPaise = t1.subtotalPaise,
                totalDiscountPaise = t1.totalDiscountPaise,
                taxableValuePaise = t1.taxableValuePaise,
                cgstPaise = t1.cgstPaise,
                sgstPaise = t1.sgstPaise,
                igstPaise = t1.igstPaise,
                roundOffPaise = t1.roundOffPaise,
                grandTotalPaise = t1.grandTotalPaise,
                amountPaidPaise = 0L,
                balanceDuePaise = t1.grandTotalPaise,
                issuedAt = "2026-10-12T10:30:00Z"
            )
        )

        // Build initial invoice 2 (Paid Intra-state)
        val inv2Customer = initialParties[1]
        val l3 = TaxEngine.calculateLineItem(
            InvoiceLine(
                id = "l_03",
                description = "Electrical Consulting & Panel Installation",
                hsnSac = "998711",
                quantity = 8.0,
                unit = "hours",
                unitPricePaise = 150000L,
                taxRate = 18,
                isTaxInclusive = false
            ),
            isInterState = false,
            isGstInvoice = true
        )
        val t2 = TaxEngine.calculateInvoiceTotals(listOf(l3), amountPaidPaise = 1416000L)
        initialInvoices.add(
            Invoice(
                id = "inv_002",
                businessId = "biz_001",
                invoiceNumber = "INV-2026-102",
                invoiceDate = "2026-10-15",
                dueDate = "2026-10-30",
                type = "gst_tax_invoice",
                status = "paid",
                party = inv2Customer,
                placeOfSupplyState = inv2Customer.state,
                placeOfSupplyStateCode = inv2Customer.stateCode,
                lines = listOf(l3),
                subtotalPaise = t2.subtotalPaise,
                totalDiscountPaise = t2.totalDiscountPaise,
                taxableValuePaise = t2.taxableValuePaise,
                cgstPaise = t2.cgstPaise,
                sgstPaise = t2.sgstPaise,
                igstPaise = t2.igstPaise,
                roundOffPaise = t2.roundOffPaise,
                grandTotalPaise = t2.grandTotalPaise,
                amountPaidPaise = t2.grandTotalPaise,
                balanceDuePaise = 0L,
                issuedAt = "2026-10-15T14:10:00Z",
                payments = listOf(
                    PaymentRecord(
                        id = "pay_01",
                        amountPaise = t2.grandTotalPaise,
                        date = "2026-10-15",
                        method = "upi",
                        referenceNo = "UPI/261015/09876"
                    )
                )
            )
        )
    }

    private val _invoices = MutableStateFlow<List<Invoice>>(initialInvoices)
    val invoices: StateFlow<List<Invoice>> = _invoices.asStateFlow()

    // Scans
    private val initialScans = listOf(
        ScannedDocument(
            id = "scan_001",
            fileName = "metro_hardware_tax_invoice.pdf",
            scannedAt = "2026-10-16 11:20",
            status = "needs_review",
            vendorName = ExtractedField("Metro Hardware Wholesalers Pvt Ltd", 0.96f),
            vendorGstin = ExtractedField("29AABCU9603R1ZM", 0.98f),
            invoiceNumber = ExtractedField("MH-2026-881", 0.94f),
            invoiceDate = ExtractedField("2026-10-14", 0.95f),
            totalAmountPaise = ExtractedField(254880L, 0.97f),
            taxAmountPaise = ExtractedField(38880L, 0.93f),
            destination = "expense",
            lines = listOf(
                ExtractedLine("Heavy Duty Drill Bit 12mm", 4.0, 54000L, 18, 254880L, 0.95f)
            )
        ),
        ScannedDocument(
            id = "scan_002",
            fileName = "sagar_store_thermal_slip.png",
            scannedAt = "2026-10-16 14:05",
            status = "needs_review",
            vendorName = ExtractedField("Sagar General Store", 0.76f, isUncertain = true),
            vendorGstin = null,
            invoiceNumber = ExtractedField("REC-4019", 0.72f, isUncertain = true),
            invoiceDate = ExtractedField("2026-10-16", 0.88f),
            totalAmountPaise = ExtractedField(145000L, 0.82f, isUncertain = true),
            taxAmountPaise = ExtractedField(0L, 0.70f, isUncertain = true),
            destination = "expense",
            lines = listOf(
                ExtractedLine("Cleaning and Office Supplies", 1.0, 145000L, 0, 145000L, 0.78f)
            )
        ),
        ScannedDocument(
            id = "scan_003",
            fileName = "capital_stationery_mismatch.pdf",
            scannedAt = "2026-10-15 17:30",
            status = "needs_review",
            vendorName = ExtractedField("Capital Stationery & Paper Mart", 0.91f),
            vendorGstin = ExtractedField("07AAAAA0000A1Z5", 0.92f),
            invoiceNumber = ExtractedField("CS-2026-104", 0.89f),
            invoiceDate = ExtractedField("2026-10-15", 0.94f),
            totalAmountPaise = ExtractedField(295000L, 0.90f),
            taxAmountPaise = ExtractedField(31400L, 0.85f),
            destination = "expense",
            hasArithmeticMismatch = true,
            arithmeticNote = "Printed total is ₹2,950.00 but extracted items sum to ₹2,464.00. Review line prices."
        )
    )

    private val _scans = MutableStateFlow(initialScans)
    val scans: StateFlow<List<ScannedDocument>> = _scans.asStateFlow()

    // Expenses
    private val initialExpenses = listOf(
        PurchaseExpense(
            id = "exp_001",
            invoiceNumber = "POL-2026-901",
            invoiceDate = "2026-10-10",
            vendorName = "Polycab Wires & Cables Ltd",
            vendorGstin = "24AAACP4997K1ZL",
            category = "Inventory / Raw Material",
            taxableAmountPaise = 850000L,
            taxPaise = 153000L,
            totalAmountPaise = 1003000L,
            paymentStatus = "paid"
        ),
        PurchaseExpense(
            id = "exp_002",
            invoiceNumber = "AWS-2026-441",
            invoiceDate = "2026-10-05",
            vendorName = "Amazon Web Services India",
            vendorGstin = "27AAACR1234A1Z9",
            category = "Software & Cloud Services",
            taxableAmountPaise = 450000L,
            taxPaise = 81000L,
            totalAmountPaise = 531000L,
            paymentStatus = "paid"
        )
    )

    private val _expenses = MutableStateFlow(initialExpenses)
    val expenses: StateFlow<List<PurchaseExpense>> = _expenses.asStateFlow()

    // CRUD & Business Methods
    fun saveInvoice(invoice: Invoice): Invoice {
        val current = _invoices.value.toMutableList()
        val finalInvoice = if (invoice.id.isBlank()) {
            val nextSeq = _profile.value.nextInvoiceSequence
            _profile.value = _profile.value.copy(nextInvoiceSequence = nextSeq + 1)
            invoice.copy(id = "inv_${UUID.randomUUID().toString().take(8)}")
        } else {
            invoice
        }

        val idx = current.indexOfFirst { it.id == finalInvoice.id }
        if (idx >= 0) {
            current[idx] = finalInvoice
        } else {
            current.add(0, finalInvoice)
        }
        _invoices.value = current
        return finalInvoice
    }

    fun cancelInvoice(invoiceId: String, reason: String) {
        val current = _invoices.value.toMutableList()
        val idx = current.indexOfFirst { it.id == invoiceId }
        if (idx >= 0) {
            val inv = current[idx]
            current[idx] = inv.copy(
                status = "cancelled",
                cancelledAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()).format(Date()),
                cancellationReason = reason,
                balanceDuePaise = 0L
            )
            _invoices.value = current
        }
    }

    fun recordPayment(invoiceId: String, payment: PaymentRecord) {
        val current = _invoices.value.toMutableList()
        val idx = current.indexOfFirst { it.id == invoiceId }
        if (idx >= 0) {
            val inv = current[idx]
            val updatedPayments = inv.payments + payment
            val newAmountPaid = inv.amountPaidPaise + payment.amountPaise
            val newBalance = maxOf(0L, inv.grandTotalPaise - newAmountPaid)
            val newStatus = if (newBalance == 0L) "paid" else inv.status

            current[idx] = inv.copy(
                payments = updatedPayments,
                amountPaidPaise = newAmountPaid,
                balanceDuePaise = newBalance,
                status = newStatus
            )
            _invoices.value = current

            // Also reduce customer balance
            val partyList = _parties.value.toMutableList()
            val pIdx = partyList.indexOfFirst { it.id == inv.party.id }
            if (pIdx >= 0) {
                val p = partyList[pIdx]
                partyList[pIdx] = p.copy(balancePaise = maxOf(0L, p.balancePaise - payment.amountPaise))
                _parties.value = partyList
            }
        }
    }

    fun saveParty(party: Party) {
        val current = _parties.value.toMutableList()
        val target = if (party.id.isBlank()) party.copy(id = "p_${UUID.randomUUID().toString().take(6)}") else party
        val idx = current.indexOfFirst { it.id == target.id }
        if (idx >= 0) {
            current[idx] = target
        } else {
            current.add(0, target)
        }
        _parties.value = current
    }

    fun saveScan(scan: ScannedDocument) {
        val current = _scans.value.toMutableList()
        val idx = current.indexOfFirst { it.id == scan.id }
        if (idx >= 0) {
            current[idx] = scan
        } else {
            current.add(0, scan)
        }
        _scans.value = current
    }

    fun saveExpense(expense: PurchaseExpense) {
        val current = _expenses.value.toMutableList()
        val target = if (expense.id.isBlank()) expense.copy(id = "exp_${UUID.randomUUID().toString().take(6)}") else expense
        current.add(0, target)
        _expenses.value = current
    }

    fun upgradeToPro() {
        val oneYearFromNow = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(
            Date(System.currentTimeMillis() + 365L * 24 * 3600 * 1000)
        )
        _subscription.value = Subscription(
            plan = "pro",
            renewalDate = oneYearFromNow,
            scansQuota = 500,
            scansUsed = _subscription.value.scansUsed,
            customLogoAllowed = true,
            watermarkRemoved = true
        )
    }

    fun downgradeToFree() {
        _subscription.value = Subscription(plan = "free")
    }
}
