// Common Indian GST HSN (Goods) and SAC (Services) Codes Directory
// Standard GST rates: 0%, 5%, 12%, 18%, 28%

export interface HsnSacItem {
  code: string;
  type: 'hsn' | 'sac';
  description: string;
  category: string;
  defaultTaxRate: number; // 0, 5, 12, 18, 28
  unit: string;
}

export const COMMON_HSN_SAC_CODES: HsnSacItem[] = [
  // Services (SAC - starts with 99)
  {
    code: '998311',
    type: 'sac',
    description: 'IT design and development services / Software development',
    category: 'Information Technology',
    defaultTaxRate: 18,
    unit: 'HOURS'
  },
  {
    code: '998313',
    type: 'sac',
    description: 'IT infrastructure support & maintenance services',
    category: 'Information Technology',
    defaultTaxRate: 18,
    unit: 'MONTHS'
  },
  {
    code: '998314',
    type: 'sac',
    description: 'Internet telecommunication, web hosting and domain services',
    category: 'Information Technology',
    defaultTaxRate: 18,
    unit: 'YEARS'
  },
  {
    code: '998221',
    type: 'sac',
    description: 'Financial, accounting and auditing services',
    category: 'Professional Services',
    defaultTaxRate: 18,
    unit: 'HOURS'
  },
  {
    code: '998231',
    type: 'sac',
    description: 'Legal advice and representation services',
    category: 'Professional Services',
    defaultTaxRate: 18,
    unit: 'HOURS'
  },
  {
    code: '998361',
    type: 'sac',
    description: 'Advertising, digital marketing and PR services',
    category: 'Marketing',
    defaultTaxRate: 18,
    unit: 'CAMPAIGN'
  },
  {
    code: '998399',
    type: 'sac',
    description: 'Other professional, technical and business services n.e.c.',
    category: 'Professional Services',
    defaultTaxRate: 18,
    unit: 'UNITS'
  },
  {
    code: '995411',
    type: 'sac',
    description: 'General construction and interior renovation works',
    category: 'Construction',
    defaultTaxRate: 18,
    unit: 'SQ_FT'
  },
  {
    code: '997212',
    type: 'sac',
    description: 'Real estate brokerage and property consultancy',
    category: 'Real Estate',
    defaultTaxRate: 18,
    unit: 'UNITS'
  },
  {
    code: '996511',
    type: 'sac',
    description: 'Road transport services of goods / Freight GTA',
    category: 'Logistics',
    defaultTaxRate: 5,
    unit: 'TRIP'
  },
  {
    code: '996331',
    type: 'sac',
    description: 'Restaurant and catering food services',
    category: 'Hospitality',
    defaultTaxRate: 5,
    unit: 'MEALS'
  },
  {
    code: '998711',
    type: 'sac',
    description: 'Maintenance and repair services of commercial & home appliances',
    category: 'Repairs & Maintenance',
    defaultTaxRate: 18,
    unit: 'JOBS'
  },

  // Goods (HSN)
  {
    code: '8471',
    type: 'hsn',
    description: 'Automatic data processing machines (Laptops, Desktops, Servers)',
    category: 'Electronics & Computers',
    defaultTaxRate: 18,
    unit: 'PCS'
  },
  {
    code: '8517',
    type: 'hsn',
    description: 'Smartphones, mobile handsets and wireless communication gear',
    category: 'Electronics & Telecom',
    defaultTaxRate: 18,
    unit: 'PCS'
  },
  {
    code: '8443',
    type: 'hsn',
    description: 'Printers, photocopiers, laser cartridges and toner units',
    category: 'Office Equipment',
    defaultTaxRate: 18,
    unit: 'PCS'
  },
  {
    code: '8528',
    type: 'hsn',
    description: 'Computer monitors, displays, projectors and CCTV screens',
    category: 'Electronics & Computers',
    defaultTaxRate: 18,
    unit: 'PCS'
  },
  {
    code: '8504',
    type: 'hsn',
    description: 'Power transformers, static converters, inverters and UPS power packs',
    category: 'Electricals',
    defaultTaxRate: 18,
    unit: 'PCS'
  },
  {
    code: '4820',
    type: 'hsn',
    description: 'Paper registers, notebooks, account books and office stationery',
    category: 'Stationery',
    defaultTaxRate: 12,
    unit: 'PCS'
  },
  {
    code: '4802',
    type: 'hsn',
    description: 'Uncoated writing and printing paper, A4 copier reams',
    category: 'Stationery',
    defaultTaxRate: 12,
    unit: 'REAMS'
  },
  {
    code: '8205',
    type: 'hsn',
    description: 'Hand tools (Hammers, screwdrivers, wrenches, pliers)',
    category: 'Hardware & Tools',
    defaultTaxRate: 18,
    unit: 'SETS'
  },
  {
    code: '7318',
    type: 'hsn',
    description: 'Screws, bolts, nuts, washers and rivets of iron or steel',
    category: 'Hardware & Fasteners',
    defaultTaxRate: 18,
    unit: 'KG'
  },
  {
    code: '3208',
    type: 'hsn',
    description: 'Paints, primers, synthetic enamels and varnishes',
    category: 'Paints & Chemicals',
    defaultTaxRate: 18,
    unit: 'LITRES'
  },
  {
    code: '2523',
    type: 'hsn',
    description: 'Portland cement, aluminous cement, slag cement',
    category: 'Building Materials',
    defaultTaxRate: 28,
    unit: 'BAGS'
  },
  {
    code: '6203',
    type: 'hsn',
    description: "Men's shirts, trousers, suits and readymade garments",
    category: 'Textiles & Apparel',
    defaultTaxRate: 12,
    unit: 'PCS'
  },
  {
    code: '6204',
    type: 'hsn',
    description: "Women's suits, kurtis, dresses, jackets and skirts",
    category: 'Textiles & Apparel',
    defaultTaxRate: 12,
    unit: 'PCS'
  },
  {
    code: '6403',
    type: 'hsn',
    description: 'Footwear with outer soles of rubber/plastic and leather uppers',
    category: 'Footwear',
    defaultTaxRate: 12,
    unit: 'PAIRS'
  },
  {
    code: '3004',
    type: 'hsn',
    description: 'Medicaments, pharmaceutical formulations and tablets',
    category: 'Healthcare & Pharma',
    defaultTaxRate: 12,
    unit: 'BOX'
  },
  {
    code: '1006',
    type: 'hsn',
    description: 'Rice (semi-milled or wholly milled, pre-packaged)',
    category: 'Groceries & Grains',
    defaultTaxRate: 5,
    unit: 'KG'
  },
  {
    code: '1001',
    type: 'hsn',
    description: 'Wheat, meslin, packaged atta',
    category: 'Groceries & Grains',
    defaultTaxRate: 5,
    unit: 'KG'
  },
  {
    code: '0902',
    type: 'hsn',
    description: 'Tea, black tea, green tea, herbal infusions',
    category: 'Groceries & Beverages',
    defaultTaxRate: 5,
    unit: 'KG'
  },
  {
    code: '9403',
    type: 'hsn',
    description: 'Wooden and metal furniture for offices and shops',
    category: 'Furniture',
    defaultTaxRate: 18,
    unit: 'PCS'
  }
];

export function searchHsnSac(query: string): HsnSacItem[] {
  if (!query || !query.trim()) return COMMON_HSN_SAC_CODES.slice(0, 10);
  const q = query.toLowerCase().trim();
  return COMMON_HSN_SAC_CODES.filter(item => 
    item.code.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  );
}
