const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), '.data');
const dbFile = path.join(dataDir, 'db.json');

const MASTER_GROUPS = [
  {
    id: "GRP-TATA",
    name: "The Tata Enterprise Group",
    promoterName: "Natarajan Chandrasekaran",
    promoterPhone: "+91 98200 11220",
    promoterEmail: "chairman.office@tata.com",
    totalEntities: 2,
    totalTurnoverCr: 14780.0,
    unbilledWipTotal: 450000,
    overdueFeesTotal: 0,
    entityIds: ["CLI-TATA-01", "CLI-TATA-02"]
  },
  {
    id: "GRP-APEX",
    name: "The Apex Industrial Group",
    promoterName: "Rajesh Sharma",
    promoterPhone: "+91 98200 11223",
    promoterEmail: "rajesh.sharma@apexautotech.com",
    totalEntities: 1,
    totalTurnoverCr: 48.5,
    unbilledWipTotal: 145000,
    overdueFeesTotal: 118000,
    entityIds: ["CLI-APEX-01"]
  },
  {
    id: "GRP-OMNI",
    name: "OmniRetail Group",
    promoterName: "Aditya Singhal",
    promoterPhone: "+91 98110 44211",
    promoterEmail: "aditya@omniretail.in",
    totalEntities: 1,
    totalTurnoverCr: 24.0,
    unbilledWipTotal: 85000,
    overdueFeesTotal: 65000,
    entityIds: ["CLI-OMNI-01"]
  },
  {
    id: "GRP-ZENITH",
    name: "Zenith Global Innovations",
    promoterName: "Vikramaditya Singh",
    promoterPhone: "+91 97110 88231",
    promoterEmail: "vikram@zenithsaas.io",
    totalEntities: 1,
    totalTurnoverCr: 12.5,
    unbilledWipTotal: 55000,
    overdueFeesTotal: 0,
    entityIds: ["CLI-ZENITH-01"]
  },
  {
    id: "GRP-DIRECT",
    name: "Direct Practice Clients",
    promoterName: "Chetan Pratap Singh",
    promoterPhone: "8077170715",
    promoterEmail: "chetanpratap1996@gmail.com",
    totalEntities: 1,
    totalTurnoverCr: 10.0,
    unbilledWipTotal: 40000,
    overdueFeesTotal: 90000,
    entityIds: ["CLI-PRATWI-01"]
  },
  {
    id: "GRP-LT",
    name: "L&T Corporate Infrastructure",
    promoterName: "S. N. Subrahmanyan",
    promoterPhone: "+91 98200 44101",
    promoterEmail: "corporate@larsentoubro.com",
    totalEntities: 1,
    totalTurnoverCr: 185.0,
    unbilledWipTotal: 320000,
    overdueFeesTotal: 0,
    entityIds: ["CLI-LT-01"]
  },
  {
    id: "GRP-SCHNEIDER",
    name: "Schneider Electric Global",
    promoterName: "Deepak Sharma",
    promoterPhone: "+91 98110 88920",
    promoterEmail: "tax.desk@se.com",
    totalEntities: 1,
    totalTurnoverCr: 95.0,
    unbilledWipTotal: 180000,
    overdueFeesTotal: 45000,
    entityIds: ["CLI-SCHNEIDER-01"]
  },
  {
    id: "GRP-MARUTI",
    name: "Maruti Suzuki Auto Group",
    promoterName: "Hisashi Takeuchi",
    promoterPhone: "+91 98100 22311",
    promoterEmail: "commercial.tax@maruti.co.in",
    totalEntities: 1,
    totalTurnoverCr: 320.0,
    unbilledWipTotal: 250000,
    overdueFeesTotal: 0,
    entityIds: ["CLI-MARUTI-01"]
  },
  {
    id: "GRP-HOTELS",
    name: "Central India Luxury Hotels Group",
    promoterName: "Sanjay Agrawal",
    promoterPhone: "+91 98930 11928",
    promoterEmail: "accounts@radissonindore.com",
    totalEntities: 1,
    totalTurnoverCr: 38.0,
    unbilledWipTotal: 65000,
    overdueFeesTotal: 35000,
    entityIds: ["CLI-RADISSON-01"]
  },
  {
    id: "GRP-MAHINDRA",
    name: "Mahindra Financial Group",
    promoterName: "Raul Rebello",
    promoterPhone: "+91 98200 99120",
    promoterEmail: "taxation@mahindrafinance.com",
    totalEntities: 1,
    totalTurnoverCr: 850.0,
    unbilledWipTotal: 520000,
    overdueFeesTotal: 0,
    entityIds: ["CLI-MMFSL-01"]
  },
  {
    id: "GRP-JINDAL",
    name: "Jindal Industrial Infrastructure",
    promoterName: "Naveen Jindal",
    promoterPhone: "+91 98110 55091",
    promoterEmail: "infra.tax@jindalsteel.com",
    totalEntities: 1,
    totalTurnoverCr: 65.0,
    unbilledWipTotal: 95000,
    overdueFeesTotal: 50000,
    entityIds: ["CLI-JINDAL-01"]
  }
];

const MASTER_CLIENTS = [
  {
    id: "CLI-TATA-01",
    groupId: "GRP-TATA",
    groupName: "The Tata Enterprise Group",
    name: "Tata Steel Limited",
    tradeName: "Tata Steel",
    type: "PUBLIC_LTD",
    pan: "AAACT2727Q",
    gstin: "27AAACT2727Q1ZW",
    cin: "L27100MH1907PLC000260",
    turnoverCr: 14500.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 1907,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "T. V. Narendran",
      phone: "+91 98200 11220",
      email: "md.office@tatasteel.com",
      designation: "CEO & Managing Director"
    },
    gstinRecords: [
      {
        gstin: "27AAACT2727Q1ZW",
        stateCode: "27",
        stateName: "Maharashtra",
        tradeName: "Tata Steel Corporate HQ",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Range I, Division III, Mumbai South",
        jurisdictionState: "Nodal Ward 5, Maharashtra",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "20AAACT2727Q1ZX",
        stateCode: "20",
        stateName: "Jharkhand",
        tradeName: "Tata Steel Jamshedpur Works",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Range IV, Jamshedpur East",
        jurisdictionState: "Jamshedpur Circle",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "21AAACT2727Q1ZY",
        stateCode: "21",
        stateName: "Odisha",
        tradeName: "Tata Steel Kalinganagar Plant",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Jajpur Division",
        jurisdictionState: "Jajpur Circle",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "19AAACT2727Q1Z3",
        stateCode: "19",
        stateName: "West Bengal",
        tradeName: "Tata Steel Kolkata Regional Hub",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Kolkata North Division",
        jurisdictionState: "Park Street Charge",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-TATA-02",
    groupId: "GRP-TATA",
    groupName: "The Tata Enterprise Group",
    name: "Tata Steel Processing & Distribution Ltd",
    tradeName: "TSPDL",
    type: "PUBLIC_LTD",
    pan: "AABCT1234D",
    gstin: "27AABCT1234D1Z8",
    cin: "U27109WB1997PLC084005",
    turnoverCr: 280.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 1997,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Abraham Stephanos",
      phone: "+91 98300 22345",
      email: "stephanos@tspdl.com",
      designation: "Managing Director"
    },
    gstinRecords: [
      {
        gstin: "27AABCT1234D1Z8",
        stateCode: "27",
        stateName: "Maharashtra",
        tradeName: "TSPDL Pune Steel Service Center",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Pune Division IV",
        jurisdictionState: "Chakan Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "19AABCT1234D1Z5",
        stateCode: "19",
        stateName: "West Bengal",
        tradeName: "TSPDL Kolkata HQ",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Kolkata South",
        jurisdictionState: "Taratala Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-APEX-01",
    groupId: "GRP-APEX",
    groupName: "The Apex Industrial Group",
    name: "Apex AutoTech Private Limited",
    tradeName: "Apex AutoTech",
    type: "PVT_LTD",
    pan: "AABCA8891D",
    gstin: "23AABCA8891D1Z2",
    cin: "U29100MP2015PTC034120",
    turnoverCr: 48.5,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2015,
    penaltyRiskAccrued: 4500,
    primaryContact: {
      name: "Rajesh Sharma",
      phone: "+91 98200 11223",
      email: "rajesh.sharma@apexautotech.com",
      designation: "Managing Director"
    },
    gstinRecords: [
      {
        gstin: "23AABCA8891D1Z2",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "Apex AutoTech Pithampur Plant",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division I",
        jurisdictionState: "Sector 3 Pithampur",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "27AABCA8891D1Z5",
        stateCode: "27",
        stateName: "Maharashtra",
        tradeName: "Apex AutoTech Bhosari Warehouse",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Pune Division II",
        jurisdictionState: "Pimpri Chinchwad Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "24AABCA8891D1Z9",
        stateCode: "24",
        stateName: "Gujarat",
        tradeName: "Apex AutoTech Sanand Assembly",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Ahmedabad South",
        jurisdictionState: "Sanand GIDC Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-OMNI-01",
    groupId: "GRP-OMNI",
    groupName: "OmniRetail Group",
    name: "OmniRetail Hypermarkets Private Limited",
    tradeName: "OmniRetail",
    type: "PVT_LTD",
    pan: "AAFCO4492K",
    gstin: "23AAFCO4492K1Z8",
    cin: "U52100MP2019PTC048991",
    turnoverCr: 24.0,
    partnerInCharge: "CA Sahil Jain",
    assignedArticle: "Aman Verma (Article)",
    incorporationYear: 2019,
    penaltyRiskAccrued: 8500,
    primaryContact: {
      name: "Aditya Singhal",
      phone: "+91 98110 44211",
      email: "aditya@omniretail.in",
      designation: "Managing Director"
    },
    gstinRecords: [
      {
        gstin: "23AAFCO4492K1Z8",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "OmniRetail Indore Hub",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division II",
        jurisdictionState: "Vijay Nagar Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "07AAFCO4492K1Z0",
        stateCode: "07",
        stateName: "Delhi",
        tradeName: "OmniRetail Okhla Distribution",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Delhi South Division",
        jurisdictionState: "Okhla Ward 84",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "29AAFCO4492K1Z4",
        stateCode: "29",
        stateName: "Karnataka",
        tradeName: "OmniRetail Bengaluru Superstore",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Bengaluru East Division",
        jurisdictionState: "Whitefield Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-ZENITH-01",
    groupId: "GRP-ZENITH",
    groupName: "Zenith Global Innovations",
    name: "Zenith SaaS Technologies Private Limited",
    tradeName: "Zenith Cloud",
    type: "PVT_LTD",
    pan: "AAACZ5512L",
    gstin: "23AAACZ5512L1Z4",
    cin: "U72200MP2021PTC056214",
    turnoverCr: 12.5,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2021,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Vikramaditya Singh",
      phone: "+91 97110 88231",
      email: "vikram@zenithsaas.io",
      designation: "Founder & CTO"
    },
    gstinRecords: [
      {
        gstin: "23AAACZ5512L1Z4",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "Zenith SaaS Crystal IT Park",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division III",
        jurisdictionState: "Bhawarkua Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "29AAACZ5512L1Z2",
        stateCode: "29",
        stateName: "Karnataka",
        tradeName: "Zenith Tech Electronic City",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Bengaluru South Division",
        jurisdictionState: "Electronic City Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-PRATWI-01",
    groupId: "GRP-DIRECT",
    groupName: "Direct Practice Clients",
    name: "Pratwi Solutions Private Limited",
    tradeName: "Pratwi Solutions",
    type: "PVT_LTD",
    pan: "AANCP9915B",
    gstin: "09AANCP9915B1Z4",
    turnoverCr: 10.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2024,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Chetan Pratap Singh",
      phone: "8077170715",
      email: "chetanpratap1996@gmail.com",
      designation: "Director / Authorized Signatory"
    },
    gstinRecords: [
      {
        gstin: "09AANCP9915B1Z4",
        stateCode: "09",
        stateName: "Uttar Pradesh",
        tradeName: "Pratwi Solutions Noida Hub",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Noida CGST Division II",
        jurisdictionState: "Sector 62 Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "23AANCP9915B1Z9",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "Pratwi Solutions Indore Branch",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division I",
        jurisdictionState: "YN Road Central Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-LT-01",
    groupId: "GRP-LT",
    groupName: "L&T Corporate Infrastructure",
    name: "Larsen & Toubro Electrical Solutions Limited",
    tradeName: "L&T Electrical",
    type: "PUBLIC_LTD",
    pan: "AAACL8892K",
    gstin: "23AAACL8892K1Z3",
    turnoverCr: 185.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Aman Verma (Article)",
    incorporationYear: 2008,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "S. N. Subrahmanyan",
      phone: "+91 98200 44101",
      email: "corporate@larsentoubro.com",
      designation: "Chairman & MD"
    },
    gstinRecords: [
      {
        gstin: "23AAACL8892K1Z3",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "L&T Mandideep Works",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Bhopal CGST Division",
        jurisdictionState: "Mandideep Industrial Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "27AAACL8892K1Z6",
        stateCode: "27",
        stateName: "Maharashtra",
        tradeName: "L&T Powai Campus",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Mumbai North CGST",
        jurisdictionState: "Powai Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-SCHNEIDER-01",
    groupId: "GRP-SCHNEIDER",
    groupName: "Schneider Electric Global",
    name: "Schneider Electric IT Business India Private Limited",
    tradeName: "Schneider Electric",
    type: "PVT_LTD",
    pan: "AABCS9912M",
    gstin: "29AABCS9912M1Z0",
    turnoverCr: 95.0,
    partnerInCharge: "CA Sahil Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2012,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Deepak Sharma",
      phone: "+91 98110 88920",
      email: "tax.desk@se.com",
      designation: "Zone President - Greater India"
    },
    gstinRecords: [
      {
        gstin: "29AABCS9912M1Z0",
        stateCode: "29",
        stateName: "Karnataka",
        tradeName: "Schneider Electric Jigani Factory",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Bengaluru South CGST",
        jurisdictionState: "Anekal Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "33AABCS9912M1Z8",
        stateCode: "33",
        stateName: "Tamil Nadu",
        tradeName: "Schneider Electric Sriperumbudur Plant",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Chennai Outer CGST",
        jurisdictionState: "Sriperumbudur Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-MARUTI-01",
    groupId: "GRP-MARUTI",
    groupName: "Maruti Suzuki Auto Group",
    name: "Maruti Suzuki Commercial Vehicles Limited",
    tradeName: "Maruti Commercial",
    type: "PUBLIC_LTD",
    pan: "AABCM4512J",
    gstin: "23AABCM4512J1Z6",
    turnoverCr: 320.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Aman Verma (Article)",
    incorporationYear: 2016,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Hisashi Takeuchi",
      phone: "+91 98100 22311",
      email: "commercial.tax@maruti.co.in",
      designation: "Managing Director & CEO"
    },
    gstinRecords: [
      {
        gstin: "23AABCM4512J1Z6",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "Maruti Commercial Central Logistics",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division I",
        jurisdictionState: "Dewas Naka Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "06AABCM4512J1Z2",
        stateCode: "06",
        stateName: "Haryana",
        tradeName: "Maruti Manesar Assembly",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Gurugram CGST Division",
        jurisdictionState: "Manesar Ward 12",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-RADISSON-01",
    groupId: "GRP-HOTELS",
    groupName: "Central India Luxury Hotels Group",
    name: "Radisson Blu Hospitality LLP",
    tradeName: "Radisson Blu Indore",
    type: "LLP",
    pan: "AAGCR4421L",
    gstin: "23AAGCR4421L1ZB",
    turnoverCr: 38.0,
    partnerInCharge: "CA Sahil Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2017,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Sanjay Agrawal",
      phone: "+91 98930 11928",
      email: "accounts@radissonindore.com",
      designation: "Designated Partner"
    },
    gstinRecords: [
      {
        gstin: "23AAGCR4421L1ZB",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "Radisson Blu Ring Road Hotel",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division II",
        jurisdictionState: "Ring Road Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-MMFSL-01",
    groupId: "GRP-MAHINDRA",
    groupName: "Mahindra Financial Group",
    name: "Mahindra & Mahindra Financial Services Limited",
    tradeName: "Mahindra Finance",
    type: "PUBLIC_LTD",
    pan: "AABCM1888S",
    gstin: "27AABCM1888S1ZQ",
    turnoverCr: 850.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Aman Verma (Article)",
    incorporationYear: 1991,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Raul Rebello",
      phone: "+91 98200 99120",
      email: "taxation@mahindrafinance.com",
      designation: "Managing Director"
    },
    gstinRecords: [
      {
        gstin: "27AABCM1888S1ZQ",
        stateCode: "27",
        stateName: "Maharashtra",
        tradeName: "Mahindra Finance Towers Worli",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Mumbai Central CGST",
        jurisdictionState: "Worli Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "23AABCM1888S1Z3",
        stateCode: "23",
        stateName: "Madhya Pradesh",
        tradeName: "Mahindra Finance Indore Zonal Hub",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Indore CGST Division I",
        jurisdictionState: "South Tukoganj Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  },
  {
    id: "CLI-JINDAL-01",
    groupId: "GRP-JINDAL",
    groupName: "Jindal Industrial Infrastructure",
    name: "Jindal Infra Projects Private Limited",
    tradeName: "Jindal Infra",
    type: "PVT_LTD",
    pan: "AAACJ5512E",
    gstin: "06AAACJ5512E1ZZ",
    turnoverCr: 65.0,
    partnerInCharge: "CA Gunjan Jain",
    assignedArticle: "Kriti Jain (Article)",
    incorporationYear: 2014,
    penaltyRiskAccrued: 0,
    primaryContact: {
      name: "Naveen Jindal",
      phone: "+91 98110 55091",
      email: "infra.tax@jindalsteel.com",
      designation: "Managing Director"
    },
    gstinRecords: [
      {
        gstin: "06AAACJ5512E1ZZ",
        stateCode: "06",
        stateName: "Haryana",
        tradeName: "Jindal Infra Hisar Complex",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Hisar CGST Division",
        jurisdictionState: "Model Town Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      },
      {
        gstin: "24AAACJ5512E1Z5",
        stateCode: "24",
        stateName: "Gujarat",
        tradeName: "Jindal Mundra Logistics Center",
        registrationType: "REGULAR",
        filingFrequency: "MONTHLY",
        status: "ACTIVE",
        jurisdictionCenter: "Kutch CGST Division",
        jurisdictionState: "Mundra SEZ Ward",
        eWayBillEnabled: true,
        eInvoiceApplicable: true
      }
    ]
  }
];

function generateTasksForClient(client) {
  const tasks = [];
  const now = new Date();
  const currentMonth = "September 2026";
  const nextMonthDate = "2026-10-20";
  const gst1DueDate = "2026-10-11";
  const gst3bDueDate = "2026-10-20";

  // GST Tasks (GSTR-1 & GSTR-3B) for each active GSTIN
  const gstins = client.gstinRecords || (client.gstin ? [{ gstin: client.gstin, stateName: "HQ" }] : []);
  gstins.forEach((g, idx) => {
    tasks.push({
      id: `TSK-GST1-${client.id}-${idx}`,
      entityId: client.id,
      entityName: client.name,
      groupId: client.groupId,
      category: "GST",
      title: `GSTR-1 Monthly Outward Supplies (${g.stateName || g.gstin.substring(0, 2)})`,
      period: currentMonth,
      dueDate: gst1DueDate,
      status: idx === 0 ? "FILED_AND_COMPLETED" : "IN_PREPARATION",
      assignedTo: client.assignedArticle,
      reviewedBy: client.partnerInCharge,
      priority: "CRITICAL",
      penaltyRisk: 2500,
      accruingDailyPenalty: 50,
      missingDocumentsCount: 0,
      chaseCount: 1,
      gstin: g.gstin,
      pan: client.pan,
      arnNumber: idx === 0 ? `AA270926${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      filingDate: idx === 0 ? "2026-10-09" : undefined
    });

    tasks.push({
      id: `TSK-GST3B-${client.id}-${idx}`,
      entityId: client.id,
      entityName: client.name,
      groupId: client.groupId,
      category: "GST",
      title: `GSTR-3B Monthly Return & ITC Reconciliation (${g.stateName || g.gstin.substring(0, 2)})`,
      period: currentMonth,
      dueDate: gst3bDueDate,
      status: "MANAGER_REVIEW",
      assignedTo: client.assignedArticle,
      reviewedBy: client.partnerInCharge,
      priority: "CRITICAL",
      penaltyRisk: 5000,
      accruingDailyPenalty: 50,
      missingDocumentsCount: 0,
      chaseCount: 2,
      gstin: g.gstin,
      pan: client.pan,
      taxPayableAmount: Math.floor(client.turnoverCr * 18000)
    });
  });

  // Income Tax & Advance Tax
  tasks.push({
    id: `TSK-ITR-${client.id}`,
    entityId: client.id,
    entityName: client.name,
    groupId: client.groupId,
    category: "INCOME_TAX",
    title: `Corporate Income Tax Return (ITR-6) FY 2025-26`,
    period: "AY 2026-27",
    dueDate: "2026-10-31",
    status: "IN_PREPARATION",
    assignedTo: client.assignedArticle,
    reviewedBy: client.partnerInCharge,
    priority: "HIGH",
    penaltyRisk: 10000,
    accruingDailyPenalty: 0,
    missingDocumentsCount: 1,
    missingDocumentsList: ["Final Signed Balance Sheet & Notes"],
    chaseCount: 1,
    pan: client.pan
  });

  // Form 3CD Tax Audit (for turnover > 10 Cr)
  if (client.turnoverCr >= 10) {
    tasks.push({
      id: `TSK-3CD-${client.id}`,
      entityId: client.id,
      entityName: client.name,
      groupId: client.groupId,
      category: "TAX_AUDIT",
      title: `Tax Audit Report u/s 44AB (Form 3CA/3CD) Cl. 22 & 31`,
      period: "FY 2025-26",
      dueDate: "2026-09-30",
      status: "FILED_AND_COMPLETED",
      assignedTo: client.assignedArticle,
      reviewedBy: client.partnerInCharge,
      priority: "CRITICAL",
      penaltyRisk: 150000,
      accruingDailyPenalty: 0,
      missingDocumentsCount: 0,
      chaseCount: 0,
      pan: client.pan,
      officialUdin: `26022998BGPA${Math.floor(1000 + Math.random() * 9000)}`
    });
  }

  return tasks;
}

function runSeed() {
  console.log("Seeding master enterprise dataset into .data/db.json...");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const allTasks = [];
  MASTER_CLIENTS.forEach(client => {
    const clientTasks = generateTasksForClient(client);
    allTasks.push(...clientTasks);
  });

  const invoices = MASTER_CLIENTS.slice(0, 6).map((client, idx) => ({
    id: `INV-2026-${1001 + idx}`,
    invoiceNumber: `GPA/26-27/${(100 + idx).toString()}`,
    entityId: client.id,
    entityName: client.name,
    groupId: client.groupId,
    invoiceDate: "2026-09-15",
    dueDate: "2026-10-15",
    amount: idx % 2 === 0 ? 88500 : 147500,
    gstin: client.gstin,
    pan: client.pan,
    status: idx === 0 ? "PAID" : idx === 1 ? "PENDING_VERIFICATION" : "UNPAID",
    reconciledBy: idx === 0 ? "CA Gunjan Jain (Partner)" : undefined,
    reconciledAt: idx === 0 ? "2026-09-20T10:30:00Z" : undefined,
    clientUtrNumber: idx === 1 ? "HDFC99812401829" : undefined,
    lineItems: [
      { description: "Statutory Tax Audit u/s 44AB & Form 3CD Certification", amount: 75000 },
      { description: "GSTR-9 & 9C Annual Reconciliation and DRC-03 Advisory", amount: 25000 }
    ]
  }));

  const notices = [
    {
      id: "NTC-001",
      entityId: "CLI-TATA-01",
      entityName: "Tata Steel Limited",
      pan: "AAACT2727Q",
      noticeType: "SCRUTINY_143_2",
      issuingAuthority: "National Faceless Assessment Centre (NFAC)",
      noticeDate: "2026-08-14",
      hearingDeadline: "2026-10-31",
      assessmentYear: "AY 2024-25",
      financialYear: "FY 2023-24",
      dinNoticeNumber: "ITBA/AST/S/143(2)/2026-27/1068991201(1)",
      demandAmountInr: 4500000,
      riskLevel: "HIGH",
      status: "DRAFT_IN_PROGRESS",
      keyIssues: ["Section 14A Disallowance vs Exempt Dividend", "Clause 44 Breakup Variance with GSTR-9C"]
    },
    {
      id: "NTC-002",
      entityId: "CLI-APEX-01",
      entityName: "Apex AutoTech Private Limited",
      pan: "AABCA8891D",
      noticeType: "GST_DRC_01C",
      issuingAuthority: "State Tax Officer, Circle 3, Indore (MP)",
      noticeDate: "2026-09-20",
      hearingDeadline: "2026-10-10",
      assessmentYear: "FY 2024-25",
      financialYear: "FY 2024-25",
      dinNoticeNumber: "GST/DRC01C/23/2026/08912",
      demandAmountInr: 43200,
      riskLevel: "CRITICAL",
      status: "REPLY_SUBMITTED",
      keyIssues: ["Rule 88D ITC Variance (GSTR-2B vs GSTR-3B Table 4A5 excess)"]
    }
  ];

  const dscTokens = MASTER_CLIENTS.slice(0, 5).map((client, idx) => ({
    id: `DSC-${101 + idx}`,
    entityId: client.id,
    entityName: client.name,
    directorName: client.primaryContact.name,
    pan: client.pan,
    serialNumber: `EP2026${889910 + idx}`,
    vaultSlot: `LOCKER-A-${idx + 1}`,
    expiryDate: "2027-11-30",
    currentCustodian: "Kriti Jain (Article)",
    status: "IN_VAULT",
    tokenProvider: "eMudhra Class 3 Combo"
  }));

  const dbData = {
    firmMetrics: {
      name: "GPA & Co., Chartered Accountants",
      companyName: "Brains & Taxes Private Limited",
      frn: "022998C",
      peerReviewStatus: "Compliant (ICAI Certified Validity till 2028)",
      totalClients: MASTER_CLIENTS.length,
      activeEntities: MASTER_CLIENTS.length,
      partnersCount: 6,
      articleTrainees: 28,
      criticalDeadlinesNext72h: 4,
      openScrutinyNotices: notices.length,
      totalDemandRiskINR: 4543200,
      unbilledWipAmount: 1850000,
      pendingCollections: 785000,
      complianceHealthScore: 96,
      dailyAccruingPenaltyRisk: 250,
      firmUpiVpa: "BRAINSANDTAXES@icici",
      firmBankDetails: {
        bankName: "ICICI Bank",
        branch: "New Palasia, Indore",
        accountType: "Current Account",
        accountNumber: "657005601799",
        accountName: "Brains & Taxes Private Limited",
        ifsc: "ICIC0006570"
      }
    },
    groups: MASTER_GROUPS,
    clients: MASTER_CLIENTS,
    tasks: allTasks,
    notices: notices,
    invoices: invoices,
    dscTokens: dscTokens,
    portalCredentials: [],
    documents: [],
    auditTrail: [
      {
        id: "AUD-001",
        timestamp: new Date().toISOString(),
        actorName: "CA Gunjan Jain (Managing Partner)",
        actorRole: "PARTNER",
        entityName: "GPA & Co.",
        action: "Client Master Verified",
        details: `Loaded ${MASTER_CLIENTS.length} verified multi-state corporate assessees across 28 GSTINs.`,
        category: "SYSTEM"
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf-8');
  console.log(`Success! Written ${MASTER_CLIENTS.length} corporate clients and ${allTasks.length} statutory tasks to ${dbFile}`);
}

runSeed();
