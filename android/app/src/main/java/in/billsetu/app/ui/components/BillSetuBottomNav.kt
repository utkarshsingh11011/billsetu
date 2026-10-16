package `in`.billsetu.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.ui.navigation.Screen
import `in`.billsetu.app.ui.theme.*

data class NavItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector
)

@Composable
fun BillSetuBottomNav(
    currentRoute: String?,
    onNavigate: (Screen) -> Unit
) {
    val items = listOf(
        NavItem(Screen.Dashboard, "Home", Icons.Default.Home),
        NavItem(Screen.CreateInvoice, "Create", Icons.Default.AddCircle),
        NavItem(Screen.Scan, "Scan", Icons.Default.DocumentScanner),
        NavItem(Screen.Records, "Records", Icons.Default.ReceiptLong),
        NavItem(Screen.Parties, "Parties", Icons.Default.People),
        NavItem(Screen.Reports, "GST", Icons.Default.BarChart)
    )

    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 6.dp
    ) {
        items.forEach { item ->
            val isSelected = currentRoute?.startsWith(item.screen.route.substringBefore("?")) == true

            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        fontSize = 10.sp
                    )
                },
                selected = isSelected,
                onClick = { onNavigate(item.screen) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Teal700,
                    selectedTextColor = Teal700,
                    indicatorColor = Teal50,
                    unselectedIconColor = Slate400,
                    unselectedTextColor = Slate500
                )
            )
        }
    }
}
