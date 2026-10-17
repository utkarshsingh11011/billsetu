package `in`.billsetu.app.ui.invoice

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.UpiQrCodeCanvas
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ThermalReceiptScreen(
    viewModel: BillSetuViewModel,
    invoiceId: String,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val invoice = viewModel.getInvoice(invoiceId)
    val profile by viewModel.profile.collectAsState()

    if (invoice == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Invoice not found")
        }
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("80mm Thermal POS Receipt", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy900),
                actions = {
                    IconButton(onClick = {
                        val sendIntent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(
                                Intent.EXTRA_TEXT,
                                "=== ${profile.tradeName.ifBlank { profile.legalName }} ===\nReceipt: ${invoice.invoiceNumber}\nTotal: ${TaxEngine.formatPaiseToRupees(invoice.grandTotalPaise)}\nBalance Due: ${TaxEngine.formatPaiseToRupees(invoice.balanceDuePaise)}\nThank you for shopping with us!"
                            )
                            type = "text/plain"
                        }
                        context.startActivity(Intent.createChooser(sendIntent, "Share Receipt"))
                    }) {
                        Icon(imageVector = Icons.Default.Share, contentDescription = "Share", tint = Color(0xFF5EEAD4))
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
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                // Thermal Paper Roll Styling (Max 360dp width)
                Card(
                    modifier = Modifier
                        .widthIn(max = 360.dp)
                        .fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Header
                        Text(
                            text = profile.tradeName.ifBlank { profile.legalName }.uppercase(),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            color = Slate900
                        )
                        Text(
                            text = "${profile.city}, ${profile.state} - ${profile.pincode}",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Slate600
                        )
                        if (profile.gstin != null) {
                            Text(
                                text = "GSTIN: ${profile.gstin}",
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = Slate800
                            )
                        }

                        Text(
                            text = "--------------------------------",
                            fontFamily = FontFamily.Monospace,
                            color = Slate400
                        )

                        // Meta
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Bill: ${invoice.invoiceNumber}", fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                            Text(invoice.invoiceDate, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Customer: ${invoice.party.name}", fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }

                        Text(
                            text = "--------------------------------",
                            fontFamily = FontFamily.Monospace,
                            color = Slate400
                        )

                        // Items
                        invoice.lines.forEach { line ->
                            Column(modifier = Modifier.fillMaxWidth()) {
                                Text(line.description, fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("${line.quantity} ${line.unit} x ${TaxEngine.formatPaiseToRupees(line.unitPricePaise)}", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = Slate600)
                                    Text(TaxEngine.formatPaiseToRupees(line.totalPaise), fontSize = 11.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Text(
                            text = "--------------------------------",
                            fontFamily = FontFamily.Monospace,
                            color = Slate400
                        )

                        // Totals
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("TOTAL AMOUNT:", fontSize = 14.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Black)
                            Text(TaxEngine.formatPaiseToRupees(invoice.grandTotalPaise), fontSize = 15.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Black)
                        }
                        if (invoice.balanceDuePaise > 0) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("BALANCE DUE:", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = Rose600)
                                Text(TaxEngine.formatPaiseToRupees(invoice.balanceDuePaise), fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = Rose600)
                            }
                        } else {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("STATUS:", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = Emerald700)
                                Text("PAID IN FULL", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, color = Emerald700)
                            }
                        }

                        // UPI QR
                        if (profile.bankDetails.upiId != null && invoice.balanceDuePaise > 0) {
                            Spacer(modifier = Modifier.height(6.dp))
                            UpiQrCodeCanvas(
                                upiId = profile.bankDetails.upiId!!,
                                payeeName = profile.tradeName.ifBlank { profile.legalName },
                                amountRupees = invoice.balanceDuePaise / 100.0,
                                invoiceNumber = invoice.invoiceNumber,
                                sizeDp = 90.dp
                            )
                        }

                        Text(
                            text = "********************************",
                            fontFamily = FontFamily.Monospace,
                            color = Slate400
                        )
                        Text(
                            text = "Thank you for your visit!",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            color = Slate600
                        )
                    }
                }
            }
        }
    }
}
