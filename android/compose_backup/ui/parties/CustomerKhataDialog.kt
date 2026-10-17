package `in`.billsetu.app.ui.parties

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import `in`.billsetu.app.data.model.Invoice
import `in`.billsetu.app.data.model.Party
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.StatusBadge
import `in`.billsetu.app.ui.theme.*

@Composable
fun CustomerKhataDialog(
    party: Party,
    invoices: List<Invoice>,
    businessName: String,
    onDismiss: () -> Unit,
    onCreateInvoiceClick: () -> Unit
) {
    val context = LocalContext.current

    val customerInvoices = remember(party, invoices) {
        invoices.filter { it.party.id == party.id || (it.party.gstin != null && it.party.gstin == party.gstin) }
    }

    val totalBilledPaise = customerInvoices.sumOf { it.grandTotalPaise }
    val totalPaidPaise = customerInvoices.sumOf { it.amountPaidPaise }
    val currentBalancePaise = totalBilledPaise - totalPaidPaise

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Navy900)
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = party.name,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Customer Account Ledger (Khata)",
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                    }
                }

                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Summary KPI
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Slate50)
                        ) {
                            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Total Invoiced", fontSize = 11.sp, color = Slate500)
                                    Text(TaxEngine.formatPaiseToRupees(totalBilledPaise), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                }
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Total Payments Received", fontSize = 11.sp, color = Emerald700)
                                    Text(TaxEngine.formatPaiseToRupees(totalPaidPaise), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Emerald700)
                                }
                                Divider(color = Slate200)
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Outstanding Balance", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (currentBalancePaise > 0) Rose600 else Slate900)
                                    Text(TaxEngine.formatPaiseToRupees(currentBalancePaise), fontSize = 14.sp, fontWeight = FontWeight.Black, color = if (currentBalancePaise > 0) Rose600 else Emerald700)
                                }
                            }
                        }
                    }

                    // WhatsApp Reminder Button
                    item {
                        Button(
                            onClick = {
                                val text = "*Statement of Account*\nCustomer: ${party.name}\nSupplier: $businessName\n\nTotal Invoiced: ${TaxEngine.formatPaiseToRupees(totalBilledPaise)}\nTotal Paid: ${TaxEngine.formatPaiseToRupees(totalPaidPaise)}\n*Outstanding Balance Due: ${TaxEngine.formatPaiseToRupees(currentBalancePaise)}*\n\nPlease arrange payment at your earliest convenience. Thank you!"
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, text)
                                    type = "text/plain"
                                }
                                context.startActivity(Intent.createChooser(sendIntent, "Share Khata Statement"))
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Share Statement on WhatsApp", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Invoices History
                    item {
                        Text("Transaction History (${customerInvoices.size})", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                    }

                    items(customerInvoices) { inv ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(inv.invoiceNumber, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                        StatusBadge(status = inv.status)
                                    }
                                    Text(inv.invoiceDate, fontSize = 10.sp, color = Slate400)
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(TaxEngine.formatPaiseToRupees(inv.grandTotalPaise), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                    if (inv.balanceDuePaise > 0) {
                                        Text("Due: ${TaxEngine.formatPaiseToRupees(inv.balanceDuePaise)}", fontSize = 10.sp, color = Rose600)
                                    }
                                }
                            }
                        }
                    }
                }

                // Footer
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate100)
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextButton(onClick = onDismiss) { Text("Close", color = Slate600) }
                    Button(
                        onClick = {
                            onDismiss()
                            onCreateInvoiceClick()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Teal600)
                    ) {
                        Text("New Bill for Customer")
                    }
                }
            }
        }
    }
}
