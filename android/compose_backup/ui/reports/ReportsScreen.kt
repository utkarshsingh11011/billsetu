package `in`.billsetu.app.ui.reports

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.KPICard
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    viewModel: BillSetuViewModel,
    onBackClick: () -> Unit
) {
    val invoices by viewModel.invoices.collectAsState()
    val expenses by viewModel.expenses.collectAsState()

    val validInvoices = invoices.filter { it.status != "cancelled" && it.status != "draft" }

    val outwardTaxablePaise = validInvoices.sumOf { it.taxableValuePaise }
    val outwardCgstPaise = validInvoices.sumOf { it.cgstPaise }
    val outwardSgstPaise = validInvoices.sumOf { it.sgstPaise }
    val outwardIgstPaise = validInvoices.sumOf { it.igstPaise }
    val totalOutwardTaxPaise = outwardCgstPaise + outwardSgstPaise + outwardIgstPaise

    val inwardTaxablePaise = expenses.sumOf { it.taxableAmountPaise }
    val inwardItcPaise = expenses.sumOf { it.taxPaise }

    val netGstPayablePaise = totalOutwardTaxPaise - inwardItcPaise

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("GST & Financial Reports", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy900)
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
            // Net GST Payable Banner
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = if (netGstPayablePaise > 0) Navy900 else Emerald700)
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Net GST Liability (GSTR-3B)", fontSize = 12.sp, color = Slate300)
                        Text(
                            text = TaxEngine.formatPaiseToRupees(maxOf(0L, netGstPayablePaise)),
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF5EEAD4)
                        )
                        Text(
                            text = "Outward Tax (${TaxEngine.formatPaiseToRupees(totalOutwardTaxPaise)}) - Eligible ITC (${TaxEngine.formatPaiseToRupees(inwardItcPaise)})",
                            fontSize = 11.sp,
                            color = Slate400
                        )
                    }
                }
            }

            // GSTR-1 Outward Supplies Breakdown
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("GSTR-1 Outward Supplies (Sales)", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Slate900)
                        Divider(color = Slate100)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Taxable Turnover", fontSize = 12.sp, color = Slate600)
                            Text(TaxEngine.formatPaiseToRupees(outwardTaxablePaise), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate900)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Central GST (CGST)", fontSize = 12.sp, color = Slate600)
                            Text(TaxEngine.formatPaiseToRupees(outwardCgstPaise), fontSize = 12.sp, color = Slate900)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("State GST (SGST)", fontSize = 12.sp, color = Slate600)
                            Text(TaxEngine.formatPaiseToRupees(outwardSgstPaise), fontSize = 12.sp, color = Slate900)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Integrated GST (IGST)", fontSize = 12.sp, color = Slate600)
                            Text(TaxEngine.formatPaiseToRupees(outwardIgstPaise), fontSize = 12.sp, color = Slate900)
                        }

                        Divider(color = Slate200)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Outward Tax Liability", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                            Text(TaxEngine.formatPaiseToRupees(totalOutwardTaxPaise), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Teal700)
                        }
                    }
                }
            }

            // Inward Supplies & ITC Breakdown
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Eligible Input Tax Credit (ITC)", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Slate900)
                        Divider(color = Slate100)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Taxable Purchases & Expenses", fontSize = 12.sp, color = Slate600)
                            Text(TaxEngine.formatPaiseToRupees(inwardTaxablePaise), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate900)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Claimable ITC (Tax Paid)", fontSize = 12.sp, color = Emerald700, fontWeight = FontWeight.Bold)
                            Text(TaxEngine.formatPaiseToRupees(inwardItcPaise), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Emerald700)
                        }
                    }
                }
            }
        }
    }
}
