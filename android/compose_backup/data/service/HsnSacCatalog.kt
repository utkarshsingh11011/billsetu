package `in`.billsetu.app.data.service

data class HsnSacCode(
    val code: String,
    val type: String, // "HSN" | "SAC"
    val description: String,
    val category: String,
    val defaultTaxRate: Int,
    val unit: String
)

object HsnSacCatalog {

    val ALL = listOf(
        // Services (SAC)
        HsnSacCode("998311", "SAC", "IT design and development services / Software", "Information Technology", 18, "HOURS"),
        HsnSacCode("998313", "SAC", "IT infrastructure support & maintenance services", "Information Technology", 18, "MONTHS"),
        HsnSacCode("998314", "SAC", "Web hosting and domain services", "Information Technology", 18, "YEARS"),
        HsnSacCode("998221", "SAC", "Financial, accounting and auditing services", "Professional Services", 18, "HOURS"),
        HsnSacCode("998231", "SAC", "Legal advice and representation services", "Professional Services", 18, "HOURS"),
        HsnSacCode("998361", "SAC", "Advertising, digital marketing and PR services", "Marketing", 18, "CAMPAIGN"),
        HsnSacCode("995411", "SAC", "Construction and interior renovation works", "Construction", 18, "SQ_FT"),
        HsnSacCode("996511", "SAC", "Road freight transport services (GTA)", "Logistics", 5, "TRIP"),
        HsnSacCode("996331", "SAC", "Restaurant and catering food services", "Hospitality", 5, "MEALS"),
        HsnSacCode("998711", "SAC", "Appliance & electronics repair services", "Repairs & Maintenance", 18, "JOBS"),

        // Goods (HSN)
        HsnSacCode("8471", "HSN", "Automatic data processing machines (Laptops, PCs)", "Electronics & Computers", 18, "PCS"),
        HsnSacCode("8517", "HSN", "Smartphones, cellular handsets & network routers", "Electronics & Telecom", 18, "PCS"),
        HsnSacCode("8443", "HSN", "Printers, photocopiers, laser toner cartridges", "Office Equipment", 18, "PCS"),
        HsnSacCode("8528", "HSN", "Monitors, projectors, CCTV display screens", "Electronics & Computers", 18, "PCS"),
        HsnSacCode("8504", "HSN", "Power adapters, UPS units, inverters", "Electricals", 18, "PCS"),
        HsnSacCode("4820", "HSN", "Paper registers, notebooks, account books", "Stationery", 12, "PCS"),
        HsnSacCode("4802", "HSN", "A4 copier printing and writing paper", "Stationery", 12, "REAMS"),
        HsnSacCode("8205", "HSN", "Hand tools (Hammers, screwdrivers, pliers)", "Hardware & Tools", 18, "SETS"),
        HsnSacCode("7318", "HSN", "Screws, bolts, nuts, washers of iron/steel", "Hardware & Fasteners", 18, "KG"),
        HsnSacCode("3208", "HSN", "Paints, primers, synthetic enamels", "Paints & Chemicals", 18, "LITRES"),
        HsnSacCode("2523", "HSN", "Portland cement, masonry cement", "Building Materials", 28, "BAGS"),
        HsnSacCode("6203", "HSN", "Men's shirts, trousers, suits & readymade garments", "Textiles & Apparel", 12, "PCS"),
        HsnSacCode("6204", "HSN", "Women's suits, kurtis, dresses", "Textiles & Apparel", 12, "PCS"),
        HsnSacCode("6403", "HSN", "Footwear with leather uppers", "Footwear", 12, "PAIRS"),
        HsnSacCode("3004", "HSN", "Medicaments and pharmaceutical formulations", "Healthcare & Pharma", 12, "BOX"),
        HsnSacCode("1006", "HSN", "Rice (pre-packaged, branded)", "Groceries & Grains", 5, "KG"),
        HsnSacCode("1001", "HSN", "Wheat, packaged atta", "Groceries & Grains", 5, "KG"),
        HsnSacCode("0902", "HSN", "Tea, black tea, green tea", "Groceries & Beverages", 5, "KG"),
        HsnSacCode("9403", "HSN", "Wooden office and commercial furniture", "Furniture", 18, "PCS")
    )

    fun search(query: String): List<HsnSacCode> {
        if (query.isBlank()) return ALL.take(10)
        val q = query.trim().lowercase()
        return ALL.filter {
            it.code.lowercase().contains(q) ||
            it.description.lowercase().contains(q) ||
            it.category.lowercase().contains(q)
        }
    }
}
