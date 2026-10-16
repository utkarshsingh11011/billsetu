package `in`.billsetu.app.ui.subscription

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.ui.theme.*
import `in`.billsetu.app.viewmodel.BillSetuViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubscriptionScreen(
    viewModel: BillSetuViewModel,
    onBackClick: () -> Unit
) {
    val subscription by viewModel.subscription.collectAsState()
    val isPro = subscription.isPro

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Brand & Subscription", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
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
            // Active Tier Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = if (isPro) Teal700 else Navy900)
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isPro) "BillSetu Pro Active" else "Free Plan",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isPro) Color(0xFF5EEAD4) else Slate700)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = if (isPro) "PRO MEMBER" else "STANDARD",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = if (isPro) Navy900 else Color.White
                                )
                            }
                        }

                        Text(
                            text = if (isPro) "Renewing on ${subscription.renewalDate} • ₹999/yr" else "Free forever for Indian small businesses",
                            fontSize = 12.sp,
                            color = Slate300
                        )

                        Text(
                            text = "Scan Quota: ${subscription.scansUsed} / ${subscription.scansQuota} used",
                            fontSize = 11.sp,
                            color = Color(0xFF5EEAD4),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Pro Plan Offer Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Upgrade to Pro", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                Text("Elevate your business branding", fontSize = 11.sp, color = Slate500)
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text("₹999", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Teal700)
                                Text("/ year + GST", fontSize = 10.sp, color = Slate400)
                            }
                        }

                        Divider(color = Slate200)

                        val features = listOf(
                            "Remove BillSetu footer on all customer invoices",
                            "Upload your custom business logo & brand accent",
                            "500 Scan-to-Books OCR bills per year",
                            "WhatsApp statement dispatch with custom message",
                            "Priority phone & email support"
                        )

                        features.forEach { feat ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Emerald600, modifier = Modifier.size(16.dp))
                                Text(text = feat, fontSize = 12.sp, color = Slate700)
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        if (!isPro) {
                            Button(
                                onClick = { viewModel.upgradeToPro() },
                                colors = ButtonDefaults.buttonColors(containerColor = Teal600),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(imageVector = Icons.Default.Star, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Upgrade Now (₹999 / year)", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            OutlinedButton(
                                onClick = { viewModel.downgradeToFree() },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Switch to Free Tier", color = Slate600)
                            }
                        }
                    }
                }
            }
        }
    }
}
