package `in`.billsetu.app.ui.invoice

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.data.model.*
import `in`.billsetu.app.data.service.GstinService
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateInvoiceScreen(
    viewModel: BillSetuViewModel,
    initialInvoiceId: String? = null,
    initialPartyId: String? = null,
    onSaveSuccess: (String) -> Unit,
    onCancelClick: () -> Unit
) {
    val profile by viewModel.profile.collectAsState()
    val parties by viewModel.parties.collectAsState()
    val existingInvoices by viewModel.invoices.collectAsState()

    // Base invoice to edit or duplicate (if provided)
    val baseInvoice = remember(initialInvoiceId) {
        if (!initialInvoiceId.isNullOrBlank()) {
            existingInvoices.find { it.id == initialInvoiceId }
        } else null
    }

    var invoiceType by remember { mutableStateOf(baseInvoice?.type ?: if (profile.isGstRegistered) "gst_tax_invoice" else "non_gst_bill") }
    var invoiceNumber by remember { mutableStateOf(baseInvoice?.invoiceNumber ?: "${profile.invoicePrefix}${profile.nextInvoiceSequence}") }
    var invoiceDate by remember { mutableStateOf(baseInvoice?.invoiceDate ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())) }
    var dueDate by remember { mutableStateOf(baseInvoice?.dueDate ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(System.currentTimeMillis() + 15L * 24 * 3600 * 1000))) }

    // Selected party
    var selectedParty by remember {
        mutableStateOf(
            baseInvoice?.party
                ?: if (!initialPartyId.isNullOrBlank()) parties.find { it.id == initialPartyId }
                else parties.firstOrNull { it.type == "customer" } ?: parties.firstOrNull()
        )
    }

    var gstinInput by remember { mutableStateOf(selectedParty?.gstin ?: "") }
    var customerNameInput by remember { mutableStateOf(selectedParty?.name ?: "") }
    var customerStateCode by remember { mutableStateOf(selectedParty?.stateCode ?: profile.stateCode) }

    // Place of Supply state
    var placeOfSupplyCode by remember { mutableStateOf(baseInvoice?.placeOfSupplyStateCode ?: customerStateCode) }
    val isInterState = profile.stateCode != placeOfSupplyCode
    val isGst = invoiceType == "gst_tax_invoice"

    // Lines state
    var lines by remember {
        mutableStateOf(
            baseInvoice?.lines?.ifEmpty { null } ?: listOf(
                InvoiceLine(
                    id = "line_${UUID.randomUUID().toString().take(6)}",
                    description = "Electrical Material",
                    hsnSac = "8544",
                    quantity = 1.0,
                    unit = "pcs",
                    unitPricePaise = 100000L,
                    taxRate = 18,
                    isTaxInclusive = false
                )
            )
        )
    }

    // Active HSN Finder modal target index
    var hsnModalLineIndex by remember { mutableStateOf<Int?>(null) }

    // Recalculate totals automatically whenever lines or tax states change
    val calculatedLines = remember(lines, isInterState, isGst) {
        lines.map { TaxEngine.calculateLineItem(it, isInterState = isInterState, isGstInvoice = isGst) }
    }
    val totals = remember(calculatedLines) {
        TaxEngine.calculateInvoiceTotals(calculatedLines)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (baseInvoice != null) "Edit Invoice" else "New Invoice", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onCancelClick) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy900),
                actions = {
                    Button(
                        onClick = {
                            val party = selectedParty?.copy(
                                name = customerNameInput,
                                gstin = gstinInput.ifBlank { null },
                                stateCode = customerStateCode,
                                state = IndianStates.getByCode(customerStateCode).name
                            ) ?: Party(
                                id = "p_${UUID.randomUUID().toString().take(6)}",
                                name = customerNameInput.ifBlank { "Customer" },
                                gstin = gstinInput.ifBlank { null },
                                state = IndianStates.getByCode(customerStateCode).name,
                                stateCode = customerStateCode,
                                address = "Direct Customer",
                                city = profile.city
                            )

                            val newInvoice = Invoice(
                                id = baseInvoice?.id ?: "",
                                businessId = profile.id,
                                invoiceNumber = invoiceNumber,
                                invoiceDate = invoiceDate,
                                dueDate = dueDate,
                                type = invoiceType,
                                status = "issued",
                                party = party,
                                placeOfSupplyState = IndianStates.getByCode(placeOfSupplyCode).name,
                                placeOfSupplyStateCode = placeOfSupplyCode,
                                lines = calculatedLines,
                                subtotalPaise = totals.subtotalPaise,
                                totalDiscountPaise = totals.totalDiscountPaise,
                                taxableValuePaise = totals.taxableValuePaise,
                                cgstPaise = totals.cgstPaise,
                                sgstPaise = totals.sgstPaise,
                                igstPaise = totals.igstPaise,
                                roundOffPaise = totals.roundOffPaise,
                                grandTotalPaise = totals.grandTotalPaise,
                                amountPaidPaise = 0L,
                                balanceDuePaise = totals.grandTotalPaise,
                                issuedAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault()).format(Date())
                            )

                            val saved = viewModel.saveInvoice(newInvoice)
                            onSaveSuccess(saved.id)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Teal600),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text("Issue Bill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate50)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Document Meta Section
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { invoiceType = "gst_tax_invoice" },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (invoiceType == "gst_tax_invoice") Teal50 else Color.White
                                )
                            ) {
                                Text("GST Tax Invoice", fontSize = 11.sp, color = if (invoiceType == "gst_tax_invoice") Teal700 else Slate600)
                            }

                            OutlinedButton(
                                onClick = { invoiceType = "non_gst_bill" },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (invoiceType == "non_gst_bill") Teal50 else Color.White
                                )
                            ) {
                                Text("Bill of Supply", fontSize = 11.sp, color = if (invoiceType == "non_gst_bill") Teal700 else Slate600)
                            }
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedTextField(
                                value = invoiceNumber,
                                onValueChange = { invoiceNumber = it },
                                label = { Text("Invoice #", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )

                            OutlinedTextField(
                                value = invoiceDate,
                                onValueChange = { invoiceDate = it },
                                label = { Text("Date (YYYY-MM-DD)", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )
                        }
                    }
                }
            }

            // Customer Details Section
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Customer Details",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )

                        // GSTIN Input with live lookup
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = gstinInput,
                                onValueChange = {
                                    val upper = it.uppercase()
                                    gstinInput = upper
                                    if (upper.length == 15 && GstinService.isValidFormat(upper)) {
                                        val match = GstinService.lookupGstin(upper)
                                        if (match != null) {
                                            customerNameInput = match.tradeName.ifBlank { match.legalName }
                                            customerStateCode = match.stateCode
                                            placeOfSupplyCode = match.stateCode
                                        }
                                    }
                                },
                                label = { Text("Customer GSTIN (Optional)", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                singleLine = true
                            )

                            if (gstinInput.length == 15 && GstinService.isValidFormat(gstinInput)) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Emerald50)
                                        .border(1.dp, Emerald600, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 6.dp)
                                ) {
                                    Text("VERIFIED", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Emerald700)
                                }
                            }
                        }

                        OutlinedTextField(
                            value = customerNameInput,
                            onValueChange = { customerNameInput = it },
                            label = { Text("Customer / Business Name", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        // Place of Supply indicator
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Slate100)
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Place of Supply: ${IndianStates.getByCode(placeOfSupplyCode).name} ($placeOfSupplyCode)",
                                fontSize = 11.sp,
                                color = Slate700
                            )
                            Text(
                                text = if (isInterState) "IGST (Inter-state)" else "CGST + SGST (Intra-state)",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isInterState) Navy900 else Teal700
                            )
                        }
                    }
                }
            }

            // Line Items Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Line Items (${lines.size})",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )

                    Button(
                        onClick = {
                            val newLine = InvoiceLine(
                                id = "line_${UUID.randomUUID().toString().take(6)}",
                                description = "",
                                hsnSac = "8544",
                                quantity = 1.0,
                                unit = "pcs",
                                unitPricePaise = 0L,
                                taxRate = if (isGst) 18 else 0,
                                isTaxInclusive = false
                            )
                            lines = lines + newLine
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Slate100, contentColor = Teal700),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Item", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Line Item Cards
            itemsIndexed(lines) { idx, line ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Item #${idx + 1}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate600)
                            if (lines.size > 1) {
                                IconButton(
                                    onClick = { lines = lines.filterIndexed { i, _ -> i != idx } },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = Rose600, modifier = Modifier.size(16.dp))
                                }
                            }
                        }

                        OutlinedTextField(
                            value = line.description,
                            onValueChange = { desc ->
                                lines = lines.mapIndexed { i, itm -> if (i == idx) itm.copy(description = desc) else itm }
                            },
                            label = { Text("Item Description", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // HSN / SAC with Finder Button
                            OutlinedTextField(
                                value = line.hsnSac,
                                onValueChange = { hsn ->
                                    lines = lines.mapIndexed { i, itm -> if (i == idx) itm.copy(hsnSac = hsn) else itm }
                                },
                                label = { Text("HSN/SAC", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                trailingIcon = {
                                    IconButton(onClick = { hsnModalLineIndex = idx }) {
                                        Icon(imageVector = Icons.Default.Search, contentDescription = "Find HSN", tint = Teal600)
                                    }
                                }
                            )

                            // Quantity
                            OutlinedTextField(
                                value = if (line.quantity == 0.0) "" else line.quantity.toString(),
                                onValueChange = { q ->
                                    val d = q.toDoubleOrNull() ?: 0.0
                                    lines = lines.mapIndexed { i, itm -> if (i == idx) itm.copy(quantity = d) else itm }
                                },
                                label = { Text("Qty", fontSize = 11.sp) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.weight(0.7f),
                                singleLine = true
                            )

                            // Unit Price (INR)
                            OutlinedTextField(
                                value = if (line.unitPricePaise == 0L) "" else (line.unitPricePaise / 100.0).toString(),
                                onValueChange = { p ->
                                    val d = p.toDoubleOrNull() ?: 0.0
                                    val paise = (d * 100).toLong()
                                    lines = lines.mapIndexed { i, itm -> if (i == idx) itm.copy(unitPricePaise = paise) else itm }
                                },
                                label = { Text("Price (₹)", fontSize = 11.sp) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                modifier = Modifier.weight(1.1f),
                                singleLine = true
                            )
                        }

                        // Tax Rate Selector (0%, 5%, 12%, 18%, 28%)
                        if (isGst) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("GST %:", fontSize = 10.sp, color = Slate500)
                                listOf(0, 5, 12, 18, 28).forEach { rate ->
                                    val isSelected = line.taxRate == rate
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSelected) Navy900 else Slate100)
                                            .clickable {
                                                lines = lines.mapIndexed { i, itm -> if (i == idx) itm.copy(taxRate = rate) else itm }
                                            }
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = "$rate%",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isSelected) Color.White else Slate700
                                        )
                                    }
                                }
                            }
                        }

                        // Line Total Summary
                        val calcLine = calculatedLines.getOrNull(idx) ?: line
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Slate50)
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Taxable: ${TaxEngine.formatPaiseToRupees(calcLine.taxableValuePaise)}",
                                fontSize = 10.sp,
                                color = Slate500
                            )
                            Text(
                                text = "Total: ${TaxEngine.formatPaiseToRupees(calcLine.totalPaise)}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                        }
                    }
                }
            }

            // Totals Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Navy900)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Taxable Value", fontSize = 12.sp, color = Slate400)
                            Text(TaxEngine.formatPaiseToRupees(totals.taxableValuePaise), fontSize = 12.sp, color = Color.White)
                        }

                        if (isGst) {
                            if (!isInterState) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Central GST (CGST)", fontSize = 11.sp, color = Slate400)
                                    Text(TaxEngine.formatPaiseToRupees(totals.cgstPaise), fontSize = 11.sp, color = Color.White)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("State GST (SGST)", fontSize = 11.sp, color = Slate400)
                                    Text(TaxEngine.formatPaiseToRupees(totals.sgstPaise), fontSize = 11.sp, color = Color.White)
                                }
                            } else {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Integrated GST (IGST)", fontSize = 11.sp, color = Slate400)
                                    Text(TaxEngine.formatPaiseToRupees(totals.igstPaise), fontSize = 11.sp, color = Color.White)
                                }
                            }
                        }

                        if (totals.roundOffPaise != 0L) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Round Off", fontSize = 11.sp, color = Slate400)
                                Text("${if (totals.roundOffPaise > 0) "+" else ""}${TaxEngine.formatPaiseToRupees(totals.roundOffPaise)}", fontSize = 11.sp, color = Color.White)
                            }
                        }

                        Divider(color = Slate700, modifier = Modifier.padding(vertical = 4.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Grand Total", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(TaxEngine.formatPaiseToRupees(totals.grandTotalPaise), fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color(0xFF5EEAD4))
                        }

                        Text(
                            text = TaxEngine.paiseToWords(totals.grandTotalPaise),
                            fontSize = 10.sp,
                            color = Slate400,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }
            }
        }
    }

    // HSN Finder Dialog
    if (hsnModalLineIndex != null) {
        val targetIdx = hsnModalLineIndex!!
        HsnFinderDialog(
            onDismiss = { hsnModalLineIndex = null },
            onSelect = { selectedHsn ->
                lines = lines.mapIndexed { idx, itm ->
                    if (idx == targetIdx) {
                        itm.copy(
                            hsnSac = selectedHsn.code,
                            taxRate = if (isGst) selectedHsn.defaultTaxRate else 0,
                            unit = selectedHsn.unit.lowercase(),
                            description = itm.description.ifBlank { selectedHsn.description }
                        )
                    } else itm
                }
                hsnModalLineIndex = null
            }
        )
    }
}
