package `in`.billsetu.app.data.model

data class Item(
    val id: String,
    val name: String,
    val hsnSac: String,
    val unit: String = "pcs",
    val defaultPricePaise: Long,
    val defaultTaxRate: Int = 18,
    val isTaxInclusive: Boolean = false,
    val description: String? = null
)
