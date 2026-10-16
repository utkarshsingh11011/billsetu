package `in`.billsetu.app.ui.scan

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.window.Dialog
import `in`.billsetu.app.data.model.PurchaseExpense
import `in`.billsetu.app.data.model.ScannedDocument
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.components.StatusBadge
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanScreen(
    viewModel: BillSetuViewModel,
    onBackClick: () -> Unit
) {
    val scans by viewModel.scans.collectAsState()
    var selectedScanForReview by remember { mutableStateOf<ScannedDocument?>(null) }
    var isSimulatingCapture by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scan-to-Books", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
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
            // Viewfinder Camera Simulation Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Navy900)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(130.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .border(1.5.dp, Color(0xFF5EEAD4), RoundedCornerShape(10.dp))
                                .background(Navy800),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.DocumentScanner,
                                    contentDescription = null,
                                    tint = Color(0xFF5EEAD4),
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Align bill edges inside viewfinder",
                                    fontSize = 11.sp,
                                    color = Slate300
                                )
                            }
                        }

                        Button(
                            onClick = {
                                isSimulatingCapture = true
                                // Select first pending scan for review
                                selectedScanForReview = scans.firstOrNull { it.status == "needs_review" } ?: scans.firstOrNull()
                                isSimulatingCapture = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Teal600),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(imageVector = Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Capture or Upload Bill", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Pending Scans Review Header
            item {
                Text(
                    text = "Documents for Review (${scans.size})",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
            }

            // Scans List
            items(scans) { scan ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selectedScanForReview = scan },
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
                                    text = scan.vendorName.value,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900
                                )
                                StatusBadge(status = scan.status)
                            }
                            Text(
                                text = "Inv: ${scan.invoiceNumber.value} • ${scan.invoiceDate.value}",
                                fontSize = 11.sp,
                                color = Slate500,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                            if (scan.hasArithmeticMismatch) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(top = 4.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Amber800, modifier = Modifier.size(12.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Arithmetic discrepancy detected", fontSize = 10.sp, color = Amber800, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = TaxEngine.formatPaiseToRupees(scan.totalAmountPaise.value),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Box(
                                modifier = Modifier
                                    .padding(top = 4.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (scan.totalAmountPaise.isUncertain) Amber50 else Emerald50)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "${(scan.totalAmountPaise.confidence * 100).toInt()}% Conf",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (scan.totalAmountPaise.isUncertain) Amber800 else Emerald700
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Side-by-Side Review Dialog
    if (selectedScanForReview != null) {
        val scan = selectedScanForReview!!
        var vendorName by remember(scan) { mutableStateOf(scan.vendorName.value) }
        var invoiceNum by remember(scan) { mutableStateOf(scan.invoiceNumber.value) }
        var invoiceDate by remember(scan) { mutableStateOf(scan.invoiceDate.value) }
        var totalAmountPaise by remember(scan) { mutableStateOf(scan.totalAmountPaise.value) }
        var destination by remember(scan) { mutableStateOf(scan.destination) }

        Dialog(onDismissRequest = { selectedScanForReview = null }) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.9f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.fillMaxSize()) {
                    // Dialog Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Navy900)
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Verify Extracted Data", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { selectedScanForReview = null }, modifier = Modifier.size(24.dp)) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                        }
                    }

                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (scan.hasArithmeticMismatch && scan.arithmeticNote != null) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = Amber50)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = Amber800)
                                        Text(text = scan.arithmeticNote, fontSize = 11.sp, color = Amber800)
                                    }
                                }
                            }
                        }

                        item {
                            OutlinedTextField(
                                value = vendorName,
                                onValueChange = { vendorName = it },
                                label = { Text("Vendor Name", fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        item {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = invoiceNum,
                                    onValueChange = { invoiceNum = it },
                                    label = { Text("Invoice #", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = invoiceDate,
                                    onValueChange = { invoiceDate = it },
                                    label = { Text("Date", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        item {
                            OutlinedTextField(
                                value = (totalAmountPaise / 100.0).toString(),
                                onValueChange = {
                                    val d = it.toDoubleOrNull() ?: 0.0
                                    totalAmountPaise = (d * 100).toLong()
                                },
                                label = { Text("Total Amount (₹)", fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        item {
                            Text("Save to Destination in Books:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate800)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                listOf("expense" to "Purchase Expense", "archive" to "Archive Only").forEach { (destKey, label) ->
                                    val isSelected = destination == destKey
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSelected) Navy900 else Slate100)
                                            .clickable { destination = destKey }
                                            .padding(horizontal = 10.dp, vertical = 6.dp)
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
                        }
                    }

                    // Dialog Actions
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Slate100)
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TextButton(onClick = { selectedScanForReview = null }) {
                            Text("Cancel", color = Slate600)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                // Save reviewed scan
                                val reviewed = scan.copy(
                                    status = "reviewed",
                                    destination = destination
                                )
                                viewModel.saveScan(reviewed)

                                if (destination == "expense") {
                                    viewModel.saveExpense(
                                        PurchaseExpense(
                                            id = "exp_${UUID.randomUUID().toString().take(6)}",
                                            invoiceNumber = invoiceNum,
                                            invoiceDate = invoiceDate,
                                            vendorName = vendorName,
                                            vendorGstin = scan.vendorGstin?.value,
                                            category = "Inventory / Supplies",
                                            taxableAmountPaise = (totalAmountPaise * 0.85).toLong(),
                                            taxPaise = (totalAmountPaise * 0.15).toLong(),
                                            totalAmountPaise = totalAmountPaise,
                                            paymentStatus = "paid"
                                        )
                                    )
                                }
                                selectedScanForReview = null
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Teal600)
                        ) {
                            Text("Confirm & Save to Books")
                        }
                    }
                }
            }
        }
    }
}
