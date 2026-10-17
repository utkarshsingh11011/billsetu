package `in`.billsetu.app.ui.dashboard

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.R
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.ActionCard
import `in`.billsetu.app.ui.components.KPICard
import `in`.billsetu.app.ui.components.StatusBadge
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel

@Composable
fun DashboardScreen(
    viewModel: BillSetuViewModel,
    onCreateInvoiceClick: () -> Unit,
    onScanBillClick: () -> Unit,
    onFindRecordClick: () -> Unit,
    onInvoiceClick: (String) -> Unit,
    onScanClick: () -> Unit,
    onUpgradeClick: () -> Unit
) {
    val profile by viewModel.profile.collectAsState()
    val subscription by viewModel.subscription.collectAsState()
    val invoices by viewModel.invoices.collectAsState()
    val scans by viewModel.scans.collectAsState()

    val totalReceivablesPaise = invoices
        .filter { it.status == "issued" }
        .sumOf { it.balanceDuePaise }

    val thisMonthInvoicesCount = invoices.size
    val pendingScansCount = scans.count { it.status == "needs_review" }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate50)
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Card with Official BillSetu Branding
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Navy900)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile.tradeName.ifBlank { profile.legalName },
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "GSTIN: ${profile.gstin ?: "Unregistered"} • ${profile.city}, ${profile.state}",
                            fontSize = 11.sp,
                            color = Slate400,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                    Image(
                        painter = painterResource(id = R.drawable.billsetu_logo_icon),
                        contentDescription = "BillSetu Brand",
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                    )
                }
            }
        }

        // 3 Primary Action Cards (PRD Section 4: Create invoice, Scan bill, Find a record)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                ActionCard(
                    title = "Create Invoice",
                    subtitle = "Draft GST/Non-GST tax invoice with instant tax math",
                    icon = Icons.Default.AddCircle,
                    isPrimary = true,
                    onClick = onCreateInvoiceClick
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    ActionCard(
                        title = "Scan Bill",
                        subtitle = "OCR with review",
                        icon = Icons.Default.DocumentScanner,
                        onClick = onScanBillClick,
                        modifier = Modifier.weight(1f)
                    )

                    ActionCard(
                        title = "Find Record",
                        subtitle = "Search ledgers",
                        icon = Icons.Default.Search,
                        onClick = onFindRecordClick,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // KPI Summaries
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KPICard(
                    title = "Due Receivables",
                    value = TaxEngine.formatPaiseToRupees(totalReceivablesPaise),
                    subtitle = "Payment pending",
                    valueColor = if (totalReceivablesPaise > 0) Rose600 else Slate900,
                    modifier = Modifier.weight(1f)
                )

                KPICard(
                    title = "Sales Invoices",
                    value = "$thisMonthInvoicesCount",
                    subtitle = "Issued to date",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Scans Needing Review Alert (if any)
        if (pendingScansCount > 0) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onScanClick() },
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Amber50)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Amber100),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = Amber800,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "$pendingScansCount bills need your review",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Amber800
                            )
                            Text(
                                text = "Verify extracted amounts and assign destination",
                                fontSize = 11.sp,
                                color = Slate600
                            )
                        }

                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = Amber800
                        )
                    }
                }
            }
        }

        // Recent Invoices Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Activity",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
                Text(
                    text = "See all (${invoices.size})",
                    fontSize = 12.sp,
                    color = Teal700,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { onFindRecordClick() }
                )
            }
        }

        // Recent Invoices List
        items(invoices.take(5)) { inv ->
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
                            Text(
                                text = inv.party.name,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            StatusBadge(status = inv.status)
                        }
                        Text(
                            text = "${inv.invoiceNumber} • ${inv.invoiceDate}",
                            fontSize = 11.sp,
                            color = Slate500,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = TaxEngine.formatPaiseToRupees(inv.grandTotalPaise),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                        Text(
                            text = if (inv.balanceDuePaise > 0) "Due: ${TaxEngine.formatPaiseToRupees(inv.balanceDuePaise)}" else "Settled",
                            fontSize = 11.sp,
                            color = if (inv.balanceDuePaise > 0) Rose600 else Emerald700,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
