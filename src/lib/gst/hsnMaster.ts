/**
 * CBIC / GST COUNCIL STATUTORY HSN & SAC MASTER REGISTRY
 * Offline Reference Database with ZERO API Dependency
 * 
 * Slabs: 0% (Exempt), 3% (Precious Metals), 5%, 12%, 18%, 28% (+ Compensation Cess)
 */

export interface HsnSacItem {
  code: string;
  type: "GOODS" | "SERVICES";
  chapter: string;
  description: string;
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
  unit?: string;
  notes?: string;
}

export const HSN_SAC_REGISTRY: HsnSacItem[] = [
  // ==========================================
  // SERVICES ACCOUNTING CODES (SAC CHAPTER 99)
  // ==========================================
  {
    code: "9982",
    type: "SERVICES",
    chapter: "99",
    description: "Legal and accounting services, statutory auditing, bookkeeping, tax consultancy and corporate advisory",
    cgst: 9,
    sgst: 9,
    igst: 18,
    notes: "Standard CA Firm Services (Tax Audit, Scrutiny Representation, Bookkeeping)"
  },
  {
    code: "9983",
    type: "SERVICES",
    chapter: "99",
    description: "Other professional, technical and business services (Management consulting, software architecture, IT consultancy)",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9954",
    type: "SERVICES",
    chapter: "99",
    description: "Construction services, works contracts, real estate development, civil engineering",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9965",
    type: "SERVICES",
    chapter: "99",
    description: "Goods transport agency (GTA) services by road, freight forwarding",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    notes: "Under RCM (5%) or Forward Charge (12% with ITC)"
  },
  {
    code: "9967",
    type: "SERVICES",
    chapter: "99",
    description: "Supporting services in transport, cargo handling, storage and warehousing services",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9971",
    type: "SERVICES",
    chapter: "99",
    description: "Financial and related services, banking processing fees, loan syndication, securities brokerage",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9972",
    type: "SERVICES",
    chapter: "99",
    description: "Real estate services involving own or leased property, commercial leasing, property management",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9984",
    type: "SERVICES",
    chapter: "99",
    description: "Telecommunications, internet broadband services, broadcasting and information supply services",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9985",
    type: "SERVICES",
    chapter: "99",
    description: "Support services, employment placement, security services, cleaning services, travel agency services",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9987",
    type: "SERVICES",
    chapter: "99",
    description: "Maintenance, repair and installation services (machinery, vehicles, computers and office equipment)",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "9992",
    type: "SERVICES",
    chapter: "99",
    description: "Education services, commercial coaching, training institutions and skill development courses",
    cgst: 9,
    sgst: 9,
    igst: 18,
    notes: "Formal schools/universities exempt; private coaching institutes taxable at 18%"
  },
  {
    code: "9993",
    type: "SERVICES",
    chapter: "99",
    description: "Human health and social care services, healthcare by authorized clinical establishments",
    cgst: 0,
    sgst: 0,
    igst: 0,
    notes: "Clinical healthcare exempt; hospital rooms > ₹5000/day taxable at 5%"
  },
  {
    code: "9995",
    type: "SERVICES",
    chapter: "99",
    description: "Services of membership organizations, business and professional associations, trade unions",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },

  // ==========================================
  // GOODS HSN CODES (COMMERCIAL MASTER CHAPTERS)
  // ==========================================
  // Chapter 04: Dairy produce
  {
    code: "0401",
    type: "GOODS",
    chapter: "04",
    description: "Fresh milk and pasteurized milk (unbranded / without registered trademark)",
    cgst: 0,
    sgst: 0,
    igst: 0,
  },
  {
    code: "0402",
    type: "GOODS",
    chapter: "04",
    description: "Milk powder, condensed milk, packaged paneer and butter in unit containers",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  // Chapter 09: Coffee, Tea, Spices
  {
    code: "0901",
    type: "GOODS",
    chapter: "09",
    description: "Coffee beans, roasted coffee, decaffeinated coffee, coffee husks",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  {
    code: "0902",
    type: "GOODS",
    chapter: "09",
    description: "Tea leaves, black tea, green tea packaged in containers",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  {
    code: "0910",
    type: "GOODS",
    chapter: "09",
    description: "Ginger, saffron, turmeric (curcuma), thyme, bay leaves, curry and other spices",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  // Chapter 10: Cereals & Grains
  {
    code: "1006",
    type: "GOODS",
    chapter: "10",
    description: "Rice, Basmati rice, pre-packaged and labelled in retail units",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    notes: "Unpackaged/loose rice is 0% exempt"
  },
  // Chapter 15: Edible Oils
  {
    code: "1512",
    type: "GOODS",
    chapter: "15",
    description: "Sunflower-seed, safflower or cotton-seed oil and fractions thereof, edible grade",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  {
    code: "1514",
    type: "GOODS",
    chapter: "15",
    description: "Rape, colza or mustard oil, refined edible oil",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  // Chapter 22: Beverages
  {
    code: "2201",
    type: "GOODS",
    chapter: "22",
    description: "Packaged mineral water and aerated water without added sugar",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "2202",
    type: "GOODS",
    chapter: "22",
    description: "Waters with added sugar or sweetening matter, carbonated beverages, soft drinks",
    cgst: 14,
    sgst: 14,
    igst: 28,
    cess: 12,
    notes: "28% GST + 12% Compensation Cess"
  },
  // Chapter 25: Salt, Cement
  {
    code: "2523",
    type: "GOODS",
    chapter: "25",
    description: "Portland cement, aluminous cement, slag cement, hydraulic cement (all kinds)",
    cgst: 14,
    sgst: 14,
    igst: 28,
  },
  // Chapter 30: Pharmaceutical products
  {
    code: "3004",
    type: "GOODS",
    chapter: "30",
    description: "Medicaments consisting of mixed or unmixed products for therapeutic or prophylactic uses",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  {
    code: "3006",
    type: "GOODS",
    chapter: "30",
    description: "Pharmaceutical goods, sterile surgical catgut, diagnostic reagents, first-aid boxes",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  // Chapter 39: Plastics
  {
    code: "3926",
    type: "GOODS",
    chapter: "39",
    description: "Articles of plastics, packaging materials, polymer sheets, industrial plastic goods",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  // Chapter 48: Paper & Paperboard
  {
    code: "4802",
    type: "GOODS",
    chapter: "48",
    description: "Uncoated paper and paperboard, printing paper, photocopy paper",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  {
    code: "4819",
    type: "GOODS",
    chapter: "48",
    description: "Cartons, boxes, cases, bags and other packing containers of paper or paperboard",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  // Chapter 49: Books & Printed Matter
  {
    code: "4901",
    type: "GOODS",
    chapter: "49",
    description: "Printed books, brochures, leaflets, educational textbooks, children's picture books",
    cgst: 0,
    sgst: 0,
    igst: 0,
    notes: "Completely Exempt (0%)"
  },
  // Chapter 52: Cotton Textiles
  {
    code: "5208",
    type: "GOODS",
    chapter: "52",
    description: "Woven fabrics of cotton, containing 85% or more by weight of cotton",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  // Chapter 61 & 62: Garments & Apparel
  {
    code: "6109",
    type: "GOODS",
    chapter: "61",
    description: "T-shirts, singlets and other vests, knitted or crocheted (Sale value <= ₹1,000 per piece: 5%, > ₹1,000: 12%)",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
  },
  // Chapter 64: Footwear
  {
    code: "6403",
    type: "GOODS",
    chapter: "64",
    description: "Footwear with outer soles of rubber, plastics, leather or composition leather (Retail sale price <= ₹1,000: 12%, > ₹1,000: 18%)",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  // Chapter 71: Precious Metals & Jewellery
  {
    code: "7113",
    type: "GOODS",
    chapter: "71",
    description: "Articles of jewellery and parts thereof, of precious metal (Gold, Silver, Platinum)",
    cgst: 1.5,
    sgst: 1.5,
    igst: 3,
    notes: "Special 3% GST slab for Gold/Jewellery"
  },
  {
    code: "7102",
    type: "GOODS",
    chapter: "71",
    description: "Diamonds, cut and polished, whether or not worked, but not mounted or set",
    cgst: 0.75,
    sgst: 0.75,
    igst: 1.5,
    notes: "Special 1.5% GST slab for polished diamonds"
  },
  // Chapter 72: Iron & Steel
  {
    code: "7208",
    type: "GOODS",
    chapter: "72",
    description: "Flat-rolled products of iron or non-alloy steel, hot-rolled, coils, plates, sheets",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "7308",
    type: "GOODS",
    chapter: "73",
    description: "Structures and parts of structures of iron or steel, scaffolding, pillars, roofing",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  // Chapter 84: Machinery & Computers
  {
    code: "8471",
    type: "GOODS",
    chapter: "84",
    description: "Automatic data processing machines, desktop computers, laptops, microcomputers, servers, magnetic/optical readers",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "8415",
    type: "GOODS",
    chapter: "84",
    description: "Air conditioning machines, comprising a motor-driven fan and elements for changing temperature and humidity",
    cgst: 14,
    sgst: 14,
    igst: 28,
  },
  {
    code: "8418",
    type: "GOODS",
    chapter: "84",
    description: "Refrigerators, freezers and other refrigerating or freezing equipment, heat pumps",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  // Chapter 85: Electronics & Mobile Phones
  {
    code: "8517",
    type: "GOODS",
    chapter: "85",
    description: "Telephone sets, smartphones, cellular networks, routers, modems and transmission apparatus",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  {
    code: "8528",
    type: "GOODS",
    chapter: "85",
    description: "Monitors, projectors, television receivers with screens > 32 inches",
    cgst: 14,
    sgst: 14,
    igst: 28,
  },
  {
    code: "8541",
    type: "GOODS",
    chapter: "85",
    description: "Solar cells, photovoltaic modules, solar panels (whether or not assembled in modules)",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  // Chapter 87: Motor Vehicles
  {
    code: "8701",
    type: "GOODS",
    chapter: "87",
    description: "Road tractors for semi-trailers, agricultural tractors (other than pedestrian controlled)",
    cgst: 6,
    sgst: 6,
    igst: 12,
  },
  {
    code: "8703",
    type: "GOODS",
    chapter: "87",
    description: "Motor cars and other motor vehicles principally designed for the transport of persons",
    cgst: 14,
    sgst: 14,
    igst: 28,
    cess: 15,
    notes: "28% GST + Compensation Cess (1% to 22% depending on engine/length)"
  },
  {
    code: "8711",
    type: "GOODS",
    chapter: "87",
    description: "Motorcycles (including mopeds) and cycles fitted with an auxiliary motor",
    cgst: 14,
    sgst: 14,
    igst: 28,
  },
  {
    code: "8702",
    type: "GOODS",
    chapter: "87",
    description: "Electric vehicles (EVs), whether two-wheelers, four-wheelers or electric buses",
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    notes: "Concessional 5% rate for Electric Mobility"
  },
  // Chapter 94: Furniture
  {
    code: "9403",
    type: "GOODS",
    chapter: "94",
    description: "Other furniture and parts thereof (metal furniture, wooden furniture, office workstations)",
    cgst: 9,
    sgst: 9,
    igst: 18,
  },
  // Chapter 95: Toys
  {
    code: "9503",
    type: "GOODS",
    chapter: "95",
    description: "Tricycles, scooters, pedal cars and similar wheeled toys, puzzles, electronic toys",
    cgst: 6,
    sgst: 6,
    igst: 12,
  }
];

/**
 * Instant Offline Search across HSN/SAC Codes & Descriptions
 * 0ms latency, zero API calls
 */
export function searchHsnSac(query: string, limit = 15): HsnSacItem[] {
  if (!query || !query.trim()) return HSN_SAC_REGISTRY.slice(0, limit);
  const q = query.trim().toLowerCase();

  return HSN_SAC_REGISTRY.filter(item => 
    item.code.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.chapter.toLowerCase().includes(q) ||
    (item.notes && item.notes.toLowerCase().includes(q))
  ).slice(0, limit);
}

/**
 * Exact code lookup
 */
export function getHsnItem(code: string): HsnSacItem | undefined {
  if (!code) return undefined;
  const clean = code.trim();
  return HSN_SAC_REGISTRY.find(item => item.code === clean || item.code.startsWith(clean));
}

/**
 * Computes GST Tax Breakdown based on HSN and Inter-State / Intra-State classification
 */
export function computeGstForHsn(
  taxableAmount: number,
  hsnCode: string,
  isInterState: boolean
): {
  hsnCode: string;
  taxableAmount: number;
  ratePercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
  totalInvoiceAmount: number;
} {
  const item = getHsnItem(hsnCode) || {
    code: hsnCode,
    type: "SERVICES" as const,
    chapter: "99",
    description: "Default Professional Services",
    cgst: 9,
    sgst: 9,
    igst: 18
  };

  const ratePercent = item.igst;
  const cessPercent = item.cess || 0;
  const cess = (taxableAmount * cessPercent) / 100;

  if (isInterState) {
    const igst = (taxableAmount * item.igst) / 100;
    return {
      hsnCode: item.code,
      taxableAmount,
      ratePercent,
      cgst: 0,
      sgst: 0,
      igst: Math.round(igst * 100) / 100,
      cess: Math.round(cess * 100) / 100,
      totalTax: Math.round((igst + cess) * 100) / 100,
      totalInvoiceAmount: Math.round((taxableAmount + igst + cess) * 100) / 100
    };
  } else {
    const cgst = (taxableAmount * item.cgst) / 100;
    const sgst = (taxableAmount * item.sgst) / 100;
    return {
      hsnCode: item.code,
      taxableAmount,
      ratePercent,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: 0,
      cess: Math.round(cess * 100) / 100,
      totalTax: Math.round((cgst + sgst + cess) * 100) / 100,
      totalInvoiceAmount: Math.round((taxableAmount + cgst + sgst + cess) * 100) / 100
    };
  }
}
