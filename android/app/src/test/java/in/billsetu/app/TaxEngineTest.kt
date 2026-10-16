package `in`.billsetu.app

import `in`.billsetu.app.data.model.InvoiceLine
import `in`.billsetu.app.data.service.TaxEngine
import org.junit.Assert.assertEquals
import org.junit.Test

class TaxEngineTest {

    @Test
    fun testIntraStateTaxCalculation() {
        val line = InvoiceLine(
            id = "test_1",
            description = "Intra State Goods",
            hsnSac = "8471",
            quantity = 1.0,
            unit = "pcs",
            unitPricePaise = 100000L, // ₹1,000.00
            taxRate = 18,
            isTaxInclusive = false
        )
        val calculated = TaxEngine.calculateLineItem(line, isInterState = false, isGstInvoice = true)

        assertEquals("Taxable value must be ₹1,000", 100000L, calculated.taxableValuePaise)
        assertEquals("CGST at 9% must be ₹90", 9000L, calculated.cgstPaise)
        assertEquals("SGST at 9% must be ₹90", 9000L, calculated.sgstPaise)
        assertEquals("IGST must be 0", 0L, calculated.igstPaise)
        assertEquals("Line total must be ₹1,180", 118000L, calculated.totalPaise)
    }

    @Test
    fun testInterStateTaxCalculation() {
        val line = InvoiceLine(
            id = "test_2",
            description = "Inter State Goods",
            hsnSac = "8471",
            quantity = 1.0,
            unit = "pcs",
            unitPricePaise = 100000L, // ₹1,000.00
            taxRate = 18,
            isTaxInclusive = false
        )
        val calculated = TaxEngine.calculateLineItem(line, isInterState = true, isGstInvoice = true)

        assertEquals("Taxable value must be ₹1,000", 100000L, calculated.taxableValuePaise)
        assertEquals("IGST at 18% must be ₹180", 18000L, calculated.igstPaise)
        assertEquals("CGST must be 0", 0L, calculated.cgstPaise)
        assertEquals("SGST must be 0", 0L, calculated.sgstPaise)
        assertEquals("Line total must be ₹1,180", 118000L, calculated.totalPaise)
    }

    @Test
    fun testTaxInclusiveMrpCalculation() {
        val line = InvoiceLine(
            id = "test_3",
            description = "MRP Inclusive Item",
            hsnSac = "8536",
            quantity = 1.0,
            unit = "pcs",
            unitPricePaise = 118000L, // ₹1,180 MRP
            taxRate = 18,
            isTaxInclusive = true
        )
        val calculated = TaxEngine.calculateLineItem(line, isInterState = false, isGstInvoice = true)

        assertEquals("Taxable value must be ₹1,000", 100000L, calculated.taxableValuePaise)
        assertEquals("Total tax must be ₹180", 18000L, calculated.cgstPaise + calculated.sgstPaise)
        assertEquals("Line total must match ₹1,180 MRP exactly", 118000L, calculated.totalPaise)
    }

    @Test
    fun testLineDiscountCalculation() {
        val line = InvoiceLine(
            id = "test_4",
            description = "Discounted Goods",
            hsnSac = "8544",
            quantity = 2.0,
            unit = "pcs",
            unitPricePaise = 100000L, // 2 x ₹1,000 = ₹2,000 gross
            discountPercent = 10.0,    // 10% discount = ₹200
            taxRate = 12,
            isTaxInclusive = false
        )
        val calculated = TaxEngine.calculateLineItem(line, isInterState = false, isGstInvoice = true)

        assertEquals("Discount must be ₹200", 20000L, calculated.discountPaise)
        assertEquals("Taxable value must be ₹1,800", 180000L, calculated.taxableValuePaise)
        assertEquals("Total 12% tax must be ₹216", 21600L, calculated.cgstPaise + calculated.sgstPaise)
    }

    @Test
    fun testRoundingToWholeRupee() {
        val line = InvoiceLine(
            id = "test_5",
            description = "Odd Paise Item",
            hsnSac = "8544",
            quantity = 1.0,
            unit = "pcs",
            unitPricePaise = 104627L, // ₹1,046.27
            taxRate = 18,
            isTaxInclusive = false
        )
        val calculated = TaxEngine.calculateLineItem(line, isInterState = false, isGstInvoice = true)
        val totals = TaxEngine.calculateInvoiceTotals(listOf(calculated))

        assertEquals("Grand total must be integer whole rupees", 0L, totals.grandTotalPaise % 100)
    }

    @Test
    fun testPaiseToWords() {
        val words = TaxEngine.paiseToWords(125000L)
        assertEquals("One Thousand Two Hundred Fifty Rupees Only", words)
    }
}
