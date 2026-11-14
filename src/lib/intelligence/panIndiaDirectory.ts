/**
 * Brains & Taxes — Pan-India Jurisdictional Master Directory
 * Contains all 28 States, 8 UTs, 25 ROC Jurisdictions, GST State Codes,
 * and Major Industrial/Commercial Clusters for accurate geospatial filtering.
 */

export interface StateMetadata {
  name: string;
  code: string; // 2-letter state code (e.g., MP, MH, DL, KA)
  gstCode: string; // 2-digit GST state code (e.g., 23, 27, 07, 29)
  rocJurisdictions: string[];
  keyIndustrialClusters: {
    name: string;
    city: string;
    pinPrefixes: string[];
    dominantSectors: string[];
  }[];
}

export const PAN_INDIA_STATES: Record<string, StateMetadata> = {
  MP: {
    name: "Madhya Pradesh",
    code: "MP",
    gstCode: "23",
    rocJurisdictions: ["ROC Gwalior"],
    keyIndustrialClusters: [
      {
        name: "Pithampur Auto & Pharma SEZ",
        city: "Indore / Dhar",
        pinPrefixes: ["454774", "454775", "4520"],
        dominantSectors: ["Automobile", "Pharma", "Heavy Engineering", "Logistics"],
      },
      {
        name: "Sanwer Road Industrial Area",
        city: "Indore",
        pinPrefixes: ["452015", "452003"],
        dominantSectors: ["Steel", "Plastics", "Food Processing", "Foundry"],
      },
      {
        name: "Dewas Naka & Electronic Complex",
        city: "Indore",
        pinPrefixes: ["452010", "452001"],
        dominantSectors: ["IT/SaaS", "Electronics", "Logistics & Warehousing"],
      },
      {
        name: "Mandi Deep Industrial Belt",
        city: "Bhopal",
        pinPrefixes: ["462046"],
        dominantSectors: ["Engineering", "Pharma", "Consumer Goods"],
      },
      {
        name: "Malanpur Industrial Area",
        city: "Gwalior / Bhind",
        pinPrefixes: ["477117"],
        dominantSectors: ["Dairy", "Textiles", "Electronics"],
      },
    ],
  },
  MH: {
    name: "Maharashtra",
    code: "MH",
    gstCode: "27",
    rocJurisdictions: ["ROC Mumbai", "ROC Pune"],
    keyIndustrialClusters: [
      {
        name: "Bhosari & Chakan Auto Hub (MIDC)",
        city: "Pune",
        pinPrefixes: ["411026", "410501"],
        dominantSectors: ["Automotive", "Precision Engineering", "Robotics"],
      },
      {
        name: "Hinjawadi IT Park",
        city: "Pune",
        pinPrefixes: ["411057"],
        dominantSectors: ["SaaS", "Software", "Fintech"],
      },
      {
        name: "Andheri East & MIDC Marol",
        city: "Mumbai",
        pinPrefixes: ["400093", "400069"],
        dominantSectors: ["Corporate Offices", "Media", "Export/Import"],
      },
      {
        name: "Thane-Belapur Industrial Corridor",
        city: "Navi Mumbai",
        pinPrefixes: ["400705", "400708"],
        dominantSectors: ["Chemicals", "Data Centers", "Manufacturing"],
      },
    ],
  },
  DL: {
    name: "Delhi",
    code: "DL",
    gstCode: "07",
    rocJurisdictions: ["ROC Delhi"],
    keyIndustrialClusters: [
      {
        name: "Okhla Industrial Area (Phases I, II, III)",
        city: "New Delhi",
        pinPrefixes: ["110020"],
        dominantSectors: ["Garments", "Software", "Printing", "E-commerce"],
      },
      {
        name: "Mayapuri Industrial Area",
        city: "New Delhi",
        pinPrefixes: ["110064"],
        dominantSectors: ["Automobile Scrap", "Metal Fabrication"],
      },
      {
        name: "Naraina Industrial Area",
        city: "New Delhi",
        pinPrefixes: ["110028"],
        dominantSectors: ["Electronics", "Packaging", "Apparel"],
      },
    ],
  },
  KA: {
    name: "Karnataka",
    code: "KA",
    gstCode: "29",
    rocJurisdictions: ["ROC Bengaluru"],
    keyIndustrialClusters: [
      {
        name: "Peenya Industrial Area",
        city: "Bengaluru",
        pinPrefixes: ["560058"],
        dominantSectors: ["Machine Tools", "Aerospace", "Plastics", "Textiles"],
      },
      {
        name: "Electronic City & Whitefield Tech Corridor",
        city: "Bengaluru",
        pinPrefixes: ["560100", "560066"],
        dominantSectors: ["DeepTech", "SaaS", "Hardware R&D"],
      },
      {
        name: "Bommasandra Industrial Area",
        city: "Bengaluru",
        pinPrefixes: ["560099"],
        dominantSectors: ["Biotech", "Pharma", "Precision Engineering"],
      },
    ],
  },
  GJ: {
    name: "Gujarat",
    code: "GJ",
    gstCode: "24",
    rocJurisdictions: ["ROC Ahmedabad"],
    keyIndustrialClusters: [
      {
        name: "Sanand Industrial GIDC",
        city: "Ahmedabad",
        pinPrefixes: ["382110"],
        dominantSectors: ["Automobiles", "Semiconductors", "FMCG"],
      },
      {
        name: "Ankleshwar & Dahej PCPIR",
        city: "Bharuch",
        pinPrefixes: ["393002", "392130"],
        dominantSectors: ["Petrochemicals", "Bulk Drugs", "Specialty Chemicals"],
      },
      {
        name: "Sachin & Pandesara GIDC",
        city: "Surat",
        pinPrefixes: ["394230", "394221"],
        dominantSectors: ["Textiles", "Diamonds", "Synthetics"],
      },
    ],
  },
  HR: {
    name: "Haryana",
    code: "HR",
    gstCode: "06",
    rocJurisdictions: ["ROC Delhi"],
    keyIndustrialClusters: [
      {
        name: "Udyog Vihar & Cyber City",
        city: "Gurugram",
        pinPrefixes: ["122016", "122002"],
        dominantSectors: ["Tech", "Fintech", "Consulting", "Garment Export"],
      },
      {
        name: "Manesar IMT",
        city: "Gurugram",
        pinPrefixes: ["122051"],
        dominantSectors: ["Automotive Components", "Electronics"],
      },
      {
        name: "Faridabad Industrial Cluster",
        city: "Faridabad",
        pinPrefixes: ["121001", "121004"],
        dominantSectors: ["Tractors", "Heavy Machinery", "White Goods"],
      },
    ],
  },
  UP: {
    name: "Uttar Pradesh",
    code: "UP",
    gstCode: "09",
    rocJurisdictions: ["ROC Kanpur"],
    keyIndustrialClusters: [
      {
        name: "Noida Sector 62 & 63 Industrial Hub",
        city: "Noida",
        pinPrefixes: ["201301", "201307"],
        dominantSectors: ["IT/ITES", "BPO", "Apparel", "Electronics"],
      },
      {
        name: "Greater Noida Ecotech",
        city: "Greater Noida",
        pinPrefixes: ["201306"],
        dominantSectors: ["Mobile Manufacturing", "Data Centers"],
      },
      {
        name: "Rania & Fazalganj Industrial Belt",
        city: "Kanpur",
        pinPrefixes: ["208012"],
        dominantSectors: ["Leather", "Chemicals", "Defense Ordnance"],
      },
    ],
  },
  TN: {
    name: "Tamil Nadu",
    code: "TN",
    gstCode: "33",
    rocJurisdictions: ["ROC Chennai", "ROC Coimbatore"],
    keyIndustrialClusters: [
      {
        name: "Sriperumbudur & Oragadam Auto Corridor",
        city: "Chennai / Kanchipuram",
        pinPrefixes: ["602105", "602106"],
        dominantSectors: ["Automobile", "Electronics EMS", "Heavy Machinery"],
      },
      {
        name: "Guindy Industrial Estate",
        city: "Chennai",
        pinPrefixes: ["600032"],
        dominantSectors: ["MSME Machining", "Packaging", "Plastics"],
      },
      {
        name: "Tirupur Apparel Cluster",
        city: "Tirupur",
        pinPrefixes: ["641601"],
        dominantSectors: ["Knitwear", "Textiles Export"],
      },
    ],
  },
  TS: {
    name: "Telangana",
    code: "TS",
    gstCode: "36",
    rocJurisdictions: ["ROC Hyderabad"],
    keyIndustrialClusters: [
      {
        name: "HITEC City & Gachibowli",
        city: "Hyderabad",
        pinPrefixes: ["500081", "500032"],
        dominantSectors: ["SaaS", "Fintech", "HealthTech"],
      },
      {
        name: "Genome Valley & Genome City",
        city: "Hyderabad",
        pinPrefixes: ["500078"],
        dominantSectors: ["Biopharma", "Vaccines", "Clinical Research"],
      },
      {
        name: "Cherlapally & Jeedimetla IDA",
        city: "Hyderabad",
        pinPrefixes: ["500051", "500055"],
        dominantSectors: ["Plastics", "Packaging", "Machinery"],
      },
    ],
  },
  WB: {
    name: "West Bengal",
    code: "WB",
    gstCode: "19",
    rocJurisdictions: ["ROC Kolkata"],
    keyIndustrialClusters: [
      {
        name: "Sector V, Salt Lake & New Town",
        city: "Kolkata",
        pinPrefixes: ["700091", "700156"],
        dominantSectors: ["IT/ITES", "Fintech", "Shared Services"],
      },
      {
        name: "Howrah & Jalan Industrial Complex",
        city: "Howrah",
        pinPrefixes: ["711411"],
        dominantSectors: ["Iron & Steel", "Foundry", "Fasteners"],
      },
    ],
  },
};

export const ALL_ROC_LIST: string[] = [
  "ROC Gwalior",
  "ROC Mumbai",
  "ROC Pune",
  "ROC Delhi",
  "ROC Bengaluru",
  "ROC Ahmedabad",
  "ROC Chennai",
  "ROC Coimbatore",
  "ROC Hyderabad",
  "ROC Kolkata",
  "ROC Jaipur",
  "ROC Kanpur",
  "ROC Ernakulam",
  "ROC Cuttack",
  "ROC Chandigarh",
  "ROC Patna",
  "ROC Goa",
  "ROC Jammu",
  "ROC Shillong",
  "ROC Bilaspur",
  "ROC Dehradun",
  "ROC Ranchi",
  "ROC Vijayawada",
];

export function getStateByGstCode(gstCode: string): StateMetadata | undefined {
  return Object.values(PAN_INDIA_STATES).find((s) => s.gstCode === gstCode);
}

export function getStateByCode(stateCode: string): StateMetadata | undefined {
  return PAN_INDIA_STATES[stateCode.toUpperCase()];
}

export function getRocForState(stateCode: string): string[] {
  const meta = getStateByCode(stateCode);
  return meta ? meta.rocJurisdictions : ["ROC Pan-India"];
}

export function identifyClusterByPincode(pincode: string): string | null {
  for (const state of Object.values(PAN_INDIA_STATES)) {
    for (const cluster of state.keyIndustrialClusters) {
      if (cluster.pinPrefixes.some((prefix) => pincode.startsWith(prefix))) {
        return cluster.name;
      }
    }
  }
  return null;
}
