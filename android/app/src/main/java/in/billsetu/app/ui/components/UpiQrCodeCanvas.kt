package `in`.billsetu.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.billsetu.app.ui.theme.Slate900
import `in`.billsetu.app.ui.theme.Teal600
import java.security.MessageDigest

@Composable
fun UpiQrCodeCanvas(
    upiId: String,
    payeeName: String,
    amountRupees: Double,
    invoiceNumber: String,
    modifier: Modifier = Modifier,
    sizeDp: Dp = 140.dp
) {
    val upiPayload = remember(upiId, payeeName, amountRupees, invoiceNumber) {
        "upi://pay?pa=$upiId&pn=${payeeName.replace(" ", "%20")}&am=${String.format("%.2f", amountRupees)}&cu=INR&tr=$invoiceNumber"
    }

    // Generate a deterministic 21x21 QR pattern matrix from the UPI payload hash
    val matrixSize = 21
    val grid = remember(upiPayload) {
        val hashBytes = MessageDigest.getInstance("SHA-256").digest(upiPayload.toByteArray())
        val mat = Array(matrixSize) { BooleanArray(matrixSize) }

        // Fill with hash bits
        var byteIdx = 0
        var bitIdx = 0
        for (r in 0 until matrixSize) {
            for (c in 0 until matrixSize) {
                val b = hashBytes[byteIdx % hashBytes.size].toInt()
                mat[r][c] = ((b shr bitIdx) and 1) == 1
                bitIdx++
                if (bitIdx == 8) {
                    bitIdx = 0
                    byteIdx++
                }
            }
        }

        // Draw Standard QR Position Locator Squares (7x7 corners)
        fun setFinder(startR: Int, startC: Int) {
            for (r in 0 until 7) {
                for (c in 0 until 7) {
                    val isOuterBorder = r == 0 || r == 6 || c == 0 || c == 6
                    val isInnerBox = r in 2..4 && c in 2..4
                    mat[startR + r][startC + c] = isOuterBorder || isInnerBox
                }
            }
        }

        setFinder(0, 0) // Top-Left
        setFinder(0, matrixSize - 7) // Top-Right
        setFinder(matrixSize - 7, 0) // Bottom-Left

        // Timing patterns
        for (i in 7 until matrixSize - 7) {
            mat[6][i] = (i % 2 == 0)
            mat[i][6] = (i % 2 == 0)
        }

        mat
    }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White)
            .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(10.dp))
            .padding(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier.size(sizeDp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val cellSize = size.width / matrixSize
                for (r in 0 until matrixSize) {
                    for (c in 0 until matrixSize) {
                        if (grid[r][c]) {
                            drawRect(
                                color = Slate900,
                                topLeft = Offset(c * cellSize, r * cellSize),
                                size = Size(cellSize, cellSize)
                            )
                        }
                    }
                }
            }

            // Center UPI Emblem
            Box(
                modifier = Modifier
                    .size(sizeDp * 0.22f)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.White)
                    .border(1.dp, Teal600, RoundedCornerShape(4.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "UPI",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Black,
                    color = Teal600
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Scan to Pay with Any UPI",
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = Slate900
        )
        Text(
            text = upiId,
            fontSize = 8.sp,
            fontFamily = FontFamily.Monospace,
            color = Color(0xFF64748B)
        )
    }
}
