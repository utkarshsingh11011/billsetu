package `in`.billsetu.app.ui.invoice

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.data.model.Invoice
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.StatusBadge
import `in`.billsetu.app.ui.components.UpiQrCodeCanvas
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceDetailScreen(
    viewModel: BillSetuViewModel,
    invoiceId: String,
    onBackClick: () -> Unit,
    onThermalReceiptClick: (String) -> Unit,
    onDuplicateClick: (Invoice) -> Unit
) {
    val context = LocalContext.current
    val invoice = viewModel.getInvoice(invoiceId)
    val profile by viewModel.profile.collectAsState()
    val subscription by viewModel.subscription.collectAsState()

    var showPaymentDialog by remember { mutableStateOf(false) }
    var showCancelDialog by remember { mutableStateOf(false) }

    if (invoice == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Invoice not found")
        }
        return
    }

    val isPro = subscription.isPro

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(invoice.invoiceNumber, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy900),
                actions = {
                    // WhatsApp Share
                    IconButton(onClick = {
                        val sendIntent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(
                                Intent.EXTRA_TEXT,
                                "Hello ${invoice.party.name},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${TaxEngine.formatPaiseToRupees(invoice.grandTotalPaise)}.\nBalance Due: ${TaxEngine.formatPaiseToRupees(invoice.balanceDuePaise)}\n\nThank you,\n${profile.tradeName.ifBlank { profile.legalName }}"
                            )
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Share Invoice")
                        context.startActivity(shareIntent)
                    }) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = "Share", tint = Color(0xFF5EEAD4))
                    }

                    // Duplicate Action
                    IconButton(onClick = { onDuplicateClick(invoice) }) {
                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Duplicate", tint = Color.White)
                    }

                    // Thermal Slip Toggle
                    IconButton(onClick = { onThermalReceiptClick(invoice.id) }) {
                        Icon(imageVector = Icons.Default.Receipt, contentDescription = "Thermal POS", tint = Color.White)
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate100)
                .padding(padding)
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Actions Row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (invoice.balanceDuePaise > 0 && invoice.status != "cancelled") {
                        Button(
                            onClick = { showPaymentDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Payment, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Record Pay", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    if (invoice.status != "cancelled" && invoice.status != "draft") {
                        OutlinedButton(
                            onClick = { showCancelDialog = true },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose600),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Block, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Void Bill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Printable Invoice Paper Container
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(0.dp, Color.Transparent)
                                .padding(bottom = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = profile.tradeName.ifBlank { profile.legalName }.uppercase(),
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Slate900
                                )
                                Text(
                                    text = "${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}",
                                    fontSize = 10.sp,
                                    color = Slate500
                                )
                                Text(
                                    text = "GSTIN: ${profile.gstin ?: "Unregistered"}",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate700
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Navy900)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = if (invoice.type == "gst_tax_invoice") "TAX INVOICE" else "BILL OF SUPPLY",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(text = "#${invoice.invoiceNumber}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                Text(text = "Date: ${invoice.invoiceDate}", fontSize = 10.sp, color = Slate500)
                                StatusBadge(status = invoice.status, modifier = Modifier.padding(top = 2.dp))
                            }
                        }

                        Divider(color = Slate200)

                        // Billed To
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Slate50)
                                .padding(10.dp)
                        ) {
                            Text("BILLED TO:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Slate400)
                            Text(invoice.party.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                            Text(invoice.party.address, fontSize = 10.sp, color = Slate600)
                            Text("GSTIN: ${invoice.party.gstin ?: "Unregistered / Consumer"}", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                            Text("Place of Supply: ${invoice.placeOfSupplyState} (${invoice.placeOfSupplyStateCode})", fontSize = 10.sp, color = Slate500)
                        }

                        // Line Items Table
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Slate100)
                                    .padding(horizontal = 6.dp, vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Item", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate700, modifier = Modifier.weight(2f))
                                Text("Qty", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate700, modifier = Modifier.weight(0.7f))
                                Text("Rate", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate700, modifier = Modifier.weight(1.2f))
                                Text("Total", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate700, modifier = Modifier.weight(1.2f))
                            }

                            invoice.lines.forEach { line ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 6.dp, vertical = 2.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(2f)) {
                                        Text(line.description, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Slate900)
                                        Text("HSN: ${line.hsnSac} • ${line.taxRate}% GST", fontSize = 9.sp, color = Slate400)
                                    }
                                    Text("${line.quantity} ${line.unit}", fontSize = 10.sp, color = Slate700, modifier = Modifier.weight(0.7f))
                                    Text(TaxEngine.formatPaiseToRupees(line.unitPricePaise), fontSize = 10.sp, color = Slate700, modifier = Modifier.weight(1.2f))
                                    Text(TaxEngine.formatPaiseToRupees(line.totalPaise), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate900, modifier = Modifier.weight(1.2f))
                                }
                            }
                        }

                        Divider(color = Slate200)

                        // Payment & UPI QR Code + Totals
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            // Left: Bank details & UPI QR Code
                            Column(modifier = Modifier.weight(1f)) {
                                if (profile.bankDetails.upiId != null && invoice.balanceDuePaise > 0) {
                                    UpiQrCodeCanvas(
                                        upiId = profile.bankDetails.upiId!!,
                                        payeeName = profile.tradeName.ifBlank { profile.legalName },
                                        amountRupees = invoice.balanceDuePaise / 100.0,
                                        invoiceNumber = invoice.invoiceNumber,
                                        sizeDp = 100.dp
                                    )
                                } else {
                                    Text("Bank Details:", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Slate700)
                                    Text("A/C: ${profile.bankDetails.accountNo}", fontSize = 9.sp, color = Slate600)
                                    Text("IFSC: ${profile.bankDetails.ifsc}", fontSize = 9.sp, color = Slate600)
                                    Text("Bank: ${profile.bankDetails.bankName}", fontSize = 9.sp, color = Slate600)
                                }
                            }

                            // Right: Tax Breakdown
                            Column(
                                modifier = Modifier.weight(1.2f),
                                verticalArrangement = Arrangement.spacedBy(3.dp),
                                horizontalAlignment = Alignment.End
                            ) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Taxable Value", fontSize = 10.sp, color = Slate500)
                                    Text(TaxEngine.formatPaiseToRupees(invoice.taxableValuePaise), fontSize = 10.sp, color = Slate900)
                                }

                                if (invoice.type == "gst_tax_invoice") {
                                    if (!invoice.isInterState) {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("CGST", fontSize = 10.sp, color = Slate500)
                                            Text(TaxEngine.formatPaiseToRupees(invoice.cgstPaise), fontSize = 10.sp, color = Slate900)
                                        }
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("SGST", fontSize = 10.sp, color = Slate500)
                                            Text(TaxEngine.formatPaiseToRupees(invoice.sgstPaise), fontSize = 10.sp, color = Slate900)
                                        }
                                    } else {
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("IGST", fontSize = 10.sp, color = Slate500)
                                            Text(TaxEngine.formatPaiseToRupees(invoice.igstPaise), fontSize = 10.sp, color = Slate900)
                                        }
                                    }
                                }

                                Divider(color = Slate200, modifier = Modifier.padding(vertical = 2.dp))

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Grand Total", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                    Text(TaxEngine.formatPaiseToRupees(invoice.grandTotalPaise), fontSize = 14.sp, fontWeight = FontWeight.Black, color = Slate900)
                                }

                                if (invoice.amountPaidPaise > 0) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Paid", fontSize = 11.sp, color = Emerald700, fontWeight = FontWeight.Bold)
                                        Text(TaxEngine.formatPaiseToRupees(invoice.amountPaidPaise), fontSize = 11.sp, color = Emerald700, fontWeight = FontWeight.Bold)
                                    }
                                }

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Balance Due", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (invoice.balanceDuePaise > 0) Rose600 else Emerald700)
                                    Text(TaxEngine.formatPaiseToRupees(invoice.balanceDuePaise), fontSize = 13.sp, fontWeight = FontWeight.Black, color = if (invoice.balanceDuePaise > 0) Rose600 else Emerald700)
                                }
                            }
                        }

                        // BillSetu Free Watermark
                        if (!isPro) {
                            Divider(color = Slate200, modifier = Modifier.padding(top = 8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Created with BillSetu • Reliable billing for Indian businesses",
                                    fontSize = 9.sp,
                                    color = Slate400
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Payment Dialog
    if (showPaymentDialog) {
        var paymentMethod by remember { mutableStateOf("upi") }
        var refNumber by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showPaymentDialog = false },
            title = { Text("Record Payment") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Amount Due: ${TaxEngine.formatPaiseToRupees(invoice.balanceDuePaise)}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Rose600)
                    OutlinedTextField(
                        value = refNumber,
                        onValueChange = { refNumber = it },
                        label = { Text("UPI Ref / Cheque #", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.recordPayment(invoice.id, invoice.balanceDuePaise, paymentMethod, refNumber)
                        showPaymentDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                ) {
                    Text("Confirm Payment")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPaymentDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Void / Cancel Dialog
    if (showCancelDialog) {
        var reason by remember { mutableStateOf("Customer returned goods") }

        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            title = { Text("Void / Cancel Invoice") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Per Indian GST compliance, issued bills are immutable. Voiding will record audit notes and zero the tax liability.", fontSize = 11.sp, color = Slate600)
                    OutlinedTextField(
                        value = reason,
                        onValueChange = { reason = it },
                        label = { Text("Reason for cancellation", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.cancelInvoice(invoice.id, reason)
                        showCancelDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Rose600)
                ) {
                    Text("Confirm Void")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) { Text("Keep Bill") }
            }
        )
    }
}
