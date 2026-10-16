package `in`.billsetu.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import `in`.billsetu.app.ui.components.BillSetuBottomNav
import `in`.billsetu.app.ui.components.BillSetuTopBar
import `in`.billsetu.app.ui.dashboard.DashboardScreen
import `in`.billsetu.app.ui.invoice.CreateInvoiceScreen
import `in`.billsetu.app.ui.invoice.InvoiceDetailScreen
import `in`.billsetu.app.ui.invoice.ThermalReceiptScreen
import `in`.billsetu.app.ui.navigation.Screen
import `in`.billsetu.app.ui.parties.PartiesScreen
import `in`.billsetu.app.ui.records.RecordsScreen
import `in`.billsetu.app.ui.reports.ReportsScreen
import `in`.billsetu.app.ui.scan.ScanScreen
import `in`.billsetu.app.ui.subscription.SubscriptionScreen
import `in`.billsetu.app.ui.theme.BillSetuTheme
import `in`.billsetu.app.viewmodel.BillSetuViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: BillSetuViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BillSetuTheme {
                MainAppNavigation(viewModel)
            }
        }
    }
}

@Composable
fun MainAppNavigation(viewModel: BillSetuViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val profile by viewModel.profile.collectAsState()
    val subscription by viewModel.subscription.collectAsState()

    val hideBottomBarRoutes = listOf(
        "create_invoice",
        "invoice_detail",
        "thermal_receipt"
    )
    val shouldShowBottomBar = hideBottomBarRoutes.none { currentRoute?.contains(it) == true }

    Scaffold(
        topBar = {
            if (shouldShowBottomBar) {
                BillSetuTopBar(
                    title = "BillSetu",
                    subtitle = profile.tradeName.ifBlank { profile.legalName },
                    isPro = subscription.isPro,
                    onUpgradeClick = { navController.navigate(Screen.Subscription.route) }
                )
            }
        },
        bottomBar = {
            if (shouldShowBottomBar) {
                BillSetuBottomNav(
                    currentRoute = currentRoute,
                    onNavigate = { screen ->
                        navController.navigate(screen.route) {
                            popUpTo(Screen.Dashboard.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            NavHost(
                navController = navController,
                startDestination = Screen.Dashboard.route
            ) {
                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        viewModel = viewModel,
                        onCreateInvoiceClick = { navController.navigate(Screen.CreateInvoice.createRoute()) },
                        onScanBillClick = { navController.navigate(Screen.Scan.route) },
                        onFindRecordClick = { navController.navigate(Screen.Records.route) },
                        onInvoiceClick = { invoiceId -> navController.navigate(Screen.InvoiceDetail.createRoute(invoiceId)) },
                        onScanClick = { navController.navigate(Screen.Scan.route) },
                        onUpgradeClick = { navController.navigate(Screen.Subscription.route) }
                    )
                }

                composable(
                    route = Screen.CreateInvoice.route,
                    arguments = listOf(
                        navArgument("invoiceId") {
                            type = NavType.StringType
                            nullable = true
                            defaultValue = null
                        },
                        navArgument("partyId") {
                            type = NavType.StringType
                            nullable = true
                            defaultValue = null
                        }
                    )
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getString("invoiceId")?.ifBlank { null }
                    val partyId = backStackEntry.arguments?.getString("partyId")?.ifBlank { null }

                    CreateInvoiceScreen(
                        viewModel = viewModel,
                        initialInvoiceId = invoiceId,
                        initialPartyId = partyId,
                        onSaveSuccess = { newId ->
                            navController.navigate(Screen.InvoiceDetail.createRoute(newId)) {
                                popUpTo(Screen.Dashboard.route)
                            }
                        },
                        onCancelClick = { navController.popBackStack() }
                    )
                }

                composable(
                    route = Screen.InvoiceDetail.route,
                    arguments = listOf(navArgument("invoiceId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getString("invoiceId") ?: ""
                    InvoiceDetailScreen(
                        viewModel = viewModel,
                        invoiceId = invoiceId,
                        onBackClick = { navController.popBackStack() },
                        onThermalReceiptClick = { id -> navController.navigate(Screen.ThermalReceipt.createRoute(id)) },
                        onDuplicateClick = { sourceInv ->
                            val cloned = viewModel.cloneInvoice(sourceInv)
                            val saved = viewModel.saveInvoice(cloned)
                            navController.navigate(Screen.CreateInvoice.createRoute(invoiceId = saved.id))
                        }
                    )
                }

                composable(
                    route = Screen.ThermalReceipt.route,
                    arguments = listOf(navArgument("invoiceId") { type = NavType.StringType })
                ) { backStackEntry ->
                    val invoiceId = backStackEntry.arguments?.getString("invoiceId") ?: ""
                    ThermalReceiptScreen(
                        viewModel = viewModel,
                        invoiceId = invoiceId,
                        onBackClick = { navController.popBackStack() }
                    )
                }

                composable(Screen.Scan.route) {
                    ScanScreen(
                        viewModel = viewModel,
                        onBackClick = { navController.popBackStack() }
                    )
                }

                composable(Screen.Records.route) {
                    RecordsScreen(
                        viewModel = viewModel,
                        onInvoiceClick = { invoiceId -> navController.navigate(Screen.InvoiceDetail.createRoute(invoiceId)) },
                        onDuplicateClick = { sourceInv ->
                            val cloned = viewModel.cloneInvoice(sourceInv)
                            val saved = viewModel.saveInvoice(cloned)
                            navController.navigate(Screen.CreateInvoice.createRoute(invoiceId = saved.id))
                        },
                        onBackClick = { navController.popBackStack() }
                    )
                }

                composable(Screen.Parties.route) {
                    PartiesScreen(
                        viewModel = viewModel,
                        onCreateInvoiceForParty = { partyId ->
                            navController.navigate(Screen.CreateInvoice.createRoute(partyId = partyId))
                        },
                        onBackClick = { navController.popBackStack() }
                    )
                }

                composable(Screen.Subscription.route) {
                    SubscriptionScreen(
                        viewModel = viewModel,
                        onBackClick = { navController.popBackStack() }
                    )
                }

                composable(Screen.Reports.route) {
                    ReportsScreen(
                        viewModel = viewModel,
                        onBackClick = { navController.popBackStack() }
                    )
                }
            }
        }
    }
}
