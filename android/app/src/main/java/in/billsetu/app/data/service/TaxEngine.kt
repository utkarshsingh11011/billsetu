package `in`.billsetu.app.data.service

import `in`.billsetu.app.data.model.InvoiceLine
import java.text.DecimalFormat
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.roundToLong

object TaxEngine {

    fun calculateLineItem(
        line: InvoiceLine,
        isInterState: Boolean,
        isGstInvoice: Boolean
    ): InvoiceLine {
        val qty = line.quantity
        val unitPrice = line.unitPricePaise
        val grossPaise = (qty * unitPrice).roundToLong()

        // Apply line discount
        val discountPaise = if (line.discountPercent > 0.0) {
            ((grossPaise * line.discountPercent) / 100.0).roundToLong()
        } else {
            line.discountPaise
        }
        val netPricePaise = maxOf(0L, grossPaise - discountPaise)

        val taxableValuePaise: Long
        val taxAmountPaise: Long

        if (!isGstInvoice || line.taxRate == 0) {
            taxableValuePaise = netPricePaise
            taxAmountPaise = 0L
        } else if (line.isTaxInclusive) {
            // MRP is inclusive: Taxable = NetPrice / (1 + Rate / 100)
            val factor = 1.0 + (line.taxRate / 100.0)
            taxableValuePaise = (netPricePaise / factor).roundToLong()
            taxAmountPaise = netPricePaise - taxableValuePaise
        } else {
            taxableValuePaise = netPricePaise
            taxAmountPaise = ((taxableValuePaise * line.taxRate) / 100.0).roundToLong()
        }

        val cgstPaise: Long
        val sgstPaise: Long
        val igstPaise: Long

        if (!isGstInvoice || line.taxRate == 0) {
            cgstPaise = 0L
            sgstPaise = 0L
            igstPaise = 0L
        } else if (isInterState) {
            igstPaise = taxAmountPaise
            cgstPaise = 0L
            sgstPaise = 0L
        } else {
            igstPaise = 0L
            cgstPaise = taxAmountPaise / 2
            sgstPaise = taxAmountPaise - cgstPaise // avoid fractional paise loss
        }

        val totalPaise = taxableValuePaise + cgstPaise + sgstPaise + igstPaise

        return line.copy(
            discountPaise = discountPaise,
            taxableValuePaise = taxableValuePaise,
            cgstPaise = cgstPaise,
            sgstPaise = sgstPaise,
            igstPaise = igstPaise,
            totalPaise = totalPaise
        )
    }

    data class InvoiceTotals(
        val subtotalPaise: Long,
        val totalDiscountPaise: Long,
        val taxableValuePaise: Long,
        val cgstPaise: Long,
        val sgstPaise: Long,
        val igstPaise: Long,
        val roundOffPaise: Long,
        val grandTotalPaise: Long,
        val balanceDuePaise: Long
    )

    fun calculateInvoiceTotals(
        lines: List<InvoiceLine>,
        amountPaidPaise: Long = 0L
    ): InvoiceTotals {
        var subtotal = 0L
        var totalDiscount = 0L
        var taxableValue = 0L
        var cgst = 0L
        var sgst = 0L
        var igst = 0L

        for (line in lines) {
            subtotal += (line.quantity * line.unitPricePaise).roundToLong()
            totalDiscount += line.discountPaise
            taxableValue += line.taxableValuePaise
            cgst += line.cgstPaise
            sgst += line.sgstPaise
            igst += line.igstPaise
        }

        val unroundedGrandTotalPaise = taxableValue + cgst + sgst + igst

        // Indian GST standard 50-paise rounding to nearest whole rupee
        val remainder = unroundedGrandTotalPaise % 100
        val roundOffPaise: Long = when {
            remainder == 0L -> 0L
            remainder >= 50L -> 100L - remainder // Round up
            else -> -remainder // Round down
        }

        val grandTotalPaise = unroundedGrandTotalPaise + roundOffPaise
        val balanceDuePaise = maxOf(0L, grandTotalPaise - amountPaidPaise)

        return InvoiceTotals(
            subtotalPaise = subtotal,
            totalDiscountPaise = totalDiscount,
            taxableValuePaise = taxableValue,
            cgstPaise = cgst,
            sgstPaise = sgst,
            igstPaise = igst,
            roundOffPaise = roundOffPaise,
            grandTotalPaise = grandTotalPaise,
            balanceDuePaise = balanceDuePaise
        )
    }

    fun formatPaiseToRupees(paise: Long): String {
        val rupees = paise / 100.0
        val format = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
        // Normalize symbol to standard ₹
        return format.format(rupees).replace("INR", "₹").trim()
    }

    fun paiseToWords(paise: Long): String {
        val wholeRupees = paise / 100
        if (wholeRupees == 0L) return "Zero Rupees Only"

        val units = arrayOf(
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
        )
        val tens = arrayOf(
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        )

        fun convertChunk(n: Int): String {
            return when {
                n < 20 -> units[n]
                n < 100 -> tens[n / 10] + if (n % 10 != 0) " " + units[n % 10] else ""
                else -> units[n / 100] + " Hundred" + if (n % 100 != 0) " " + convertChunk(n % 100) else ""
            }
        }

        var num = wholeRupees
        val crores = (num / 10000000).toInt()
        num %= 10000000
        val lakhs = (num / 100000).toInt()
        num %= 100000
        val thousands = (num / 1000).toInt()
        num %= 1000
        val remainder = num.toInt()

        val parts = mutableListOf<String>()
        if (crores > 0) parts.add("${convertChunk(crores)} Crore")
        if (lakhs > 0) parts.add("${convertChunk(lakhs)} Lakh")
        if (thousands > 0) parts.add("${convertChunk(thousands)} Thousand")
        if (remainder > 0) parts.add(convertChunk(remainder))

        return parts.joinToString(" ") + " Rupees Only"
    }
}
