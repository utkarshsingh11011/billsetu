package `in`.billsetu.app.ui.records

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.data.model.Invoice
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.StatusBadge
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordsScreen(
    viewModel: BillSetuViewModel,
    onInvoiceClick: (String) -> Unit,
    onDuplicateClick: (Invoice) -> Unit,
    onBackClick: () -> Unit
) {
    val invoices by viewModel.invoices.collectAsState()
    val expenses by viewModel.expenses.collectAsState()
    val scans by viewModel.scans.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var activeTab by remember { mutableStateOf("sales") } // "sales" | "expenses" | "scans"

    val filteredInvoices = remember(invoices, searchQuery) {
        if (searchQuery.isBlank()) invoices
        else {
            val q = searchQuery.trim().lowercase()
            invoices.filter {
                it.invoiceNumber.lowercase().contains(q) ||
                it.party.name.lowercase().contains(q) ||
                (it.party.gstin ?: "").lowercase().contains(q)
            }
        }
    }

    val filteredExpenses = remember(expenses, searchQuery) {
        if (searchQuery.isBlank()) expenses
        else {
            val q = searchQuery.trim().lowercase()
            expenses.filter {
                it.invoiceNumber.lowercase().contains(q) ||
                it.vendorName.lowercase().contains(q) ||
                it.category.lowercase().contains(q)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Records & Ledgers", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy900)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate50)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by name, invoice #, GSTIN...", fontSize = 12.sp) },
                leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = Slate400) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(10.dp)
            )

            // Segmented Tabs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                listOf(
                    "sales" to "Sales (${invoices.size})",
                    "expenses" to "Expenses (${expenses.size})",
                    "scans" to "Scans (${scans.size})"
                ).forEach { (tabKey, label) ->
                    val isSelected = activeTab == tabKey
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) Navy900 else Slate100)
                            .clickable { activeTab = tabKey }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else Slate700
                        )
                    }
                }
            }

            // Results List
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (activeTab == "sales") {
                    items(filteredInvoices) { inv ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onInvoiceClick(inv.id) },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(text = inv.party.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                        StatusBadge(status = inv.status)
                                    }
                                    Text(
                                        text = "${inv.invoiceNumber} • ${inv.invoiceDate}",
                                        fontSize = 11.sp,
                                        color = Slate500,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = TaxEngine.formatPaiseToRupees(inv.grandTotalPaise),
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate900
                                        )
                                        Text(
                                            text = if (inv.balanceDuePaise > 0) "Due: ${TaxEngine.formatPaiseToRupees(inv.balanceDuePaise)}" else "Paid",
                                            fontSize = 10.sp,
                                            color = if (inv.balanceDuePaise > 0) Rose600 else Emerald700
                                        )
                                    }

                                    IconButton(
                                        onClick = { onDuplicateClick(inv) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = "Duplicate", tint = Slate500, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                } else if (activeTab == "expenses") {
                    items(filteredExpenses) { exp ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = exp.vendorName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                    Text(
                                        text = "${exp.category} • ${exp.invoiceDate}",
                                        fontSize = 11.sp,
                                        color = Slate500
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = TaxEngine.formatPaiseToRupees(exp.totalAmountPaise),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate900
                                    )
                                    Text(text = "Tax: ${TaxEngine.formatPaiseToRupees(exp.taxPaise)}", fontSize = 10.sp, color = Slate500)
                                }
                            }
                        }
                    }
                } else {
                    items(scans) { scan ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = scan.vendorName.value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                    Text(text = scan.fileName, fontSize = 11.sp, color = Slate500)
                                }
                                StatusBadge(status = scan.status)
                            }
                        }
                    }
                }
            }
        }
    }
}
