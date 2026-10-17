package `in`.billsetu.app.ui.parties

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
import androidx.compose.ui.window.Dialog
import `in`.billsetu.app.data.model.Party
import `in`.billsetu.app.data.service.GstinService
import `in`.billsetu.app.data.service.TaxEngine
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PartiesScreen(
    viewModel: BillSetuViewModel,
    onCreateInvoiceForParty: (String) -> Unit,
    onBackClick: () -> Unit
) {
    val parties by viewModel.parties.collectAsState()
    val invoices by viewModel.invoices.collectAsState()
    val profile by viewModel.profile.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var selectedPartyForKhata by remember { mutableStateOf<Party?>(null) }
    var showAddPartyDialog by remember { mutableStateOf(false) }

    val filteredParties = remember(parties, searchQuery) {
        if (searchQuery.isBlank()) parties
        else {
            val q = searchQuery.trim().lowercase()
            parties.filter {
                it.name.lowercase().contains(q) ||
                (it.gstin ?: "").lowercase().contains(q) ||
                it.city.lowercase().contains(q)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Customers & Parties", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy900),
                actions = {
                    IconButton(onClick = { showAddPartyDialog = true }) {
                        Icon(imageVector = Icons.Default.PersonAdd, contentDescription = "Add Customer", tint = Color(0xFF5EEAD4))
                    }
                }
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
                placeholder = { Text("Search customer by name, GSTIN, city...", fontSize = 12.sp) },
                leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = Slate400) },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(10.dp)
            )

            // Parties List
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredParties) { p ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        Text(text = p.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(if (p.type == "customer") Teal50 else Slate100)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = p.type.uppercase(),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (p.type == "customer") Teal700 else Slate600
                                            )
                                        }
                                    }

                                    Text(
                                        text = "${p.address}, ${p.city}, ${p.state} (${p.stateCode})",
                                        fontSize = 11.sp,
                                        color = Slate500,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )

                                    Text(
                                        text = "GSTIN: ${p.gstin ?: "Unregistered"}",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Slate700
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = TaxEngine.formatPaiseToRupees(p.balancePaise),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (p.balancePaise > 0) Rose600 else Slate900
                                    )
                                    Text(
                                        text = if (p.balancePaise > 0) "Pending" else "Settled",
                                        fontSize = 10.sp,
                                        color = if (p.balancePaise > 0) Rose600 else Emerald700
                                    )
                                }
                            }

                            Divider(color = Slate100)

                            // Card Actions
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(onClick = { selectedPartyForKhata = p }) {
                                    Icon(imageVector = Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Khata Statement", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Teal700)
                                }

                                Spacer(modifier = Modifier.width(6.dp))

                                Button(
                                    onClick = { onCreateInvoiceForParty(p.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Navy900),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(12.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Bill", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Customer Khata Statement Dialog
    if (selectedPartyForKhata != null) {
        CustomerKhataDialog(
            party = selectedPartyForKhata!!,
            invoices = invoices,
            businessName = profile.tradeName.ifBlank { profile.legalName },
            onDismiss = { selectedPartyForKhata = null },
            onCreateInvoiceClick = {
                val partyId = selectedPartyForKhata!!.id
                selectedPartyForKhata = null
                onCreateInvoiceForParty(partyId)
            }
        )
    }

    // Add Customer Dialog
    if (showAddPartyDialog) {
        var gstin by remember { mutableStateOf("") }
        var name by remember { mutableStateOf("") }
        var city by remember { mutableStateOf("Mumbai") }
        var phone by remember { mutableStateOf("") }

        Dialog(onDismissRequest = { showAddPartyDialog = false }) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("Add New Customer", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Slate900)

                    OutlinedTextField(
                        value = gstin,
                        onValueChange = {
                            val upper = it.uppercase()
                            gstin = upper
                            if (upper.length == 15 && GstinService.isValidFormat(upper)) {
                                val match = GstinService.lookupGstin(upper)
                                if (match != null) {
                                    name = match.tradeName.ifBlank { match.legalName }
                                    city = match.city
                                }
                            }
                        },
                        label = { Text("GSTIN (Optional)", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Customer / Business Name", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = city,
                        onValueChange = { city = it },
                        label = { Text("City", fontSize = 11.sp) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = { showAddPartyDialog = false }) { Text("Cancel") }
                        Spacer(modifier = Modifier.width(6.dp))
                        Button(
                            onClick = {
                                if (name.isNotBlank()) {
                                    val stateCode = GstinService.extractStateCode(gstin) ?: "27"
                                    viewModel.saveParty(
                                        Party(
                                            id = "p_${UUID.randomUUID().toString().take(6)}",
                                            name = name,
                                            gstin = gstin.ifBlank { null },
                                            city = city,
                                            state = "Maharashtra",
                                            stateCode = stateCode,
                                            address = city,
                                            phone = phone.ifBlank { null }
                                        )
                                    )
                                    showAddPartyDialog = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Teal600)
                        ) {
                            Text("Save Customer")
                        }
                    }
                }
            }
        }
    }
}
