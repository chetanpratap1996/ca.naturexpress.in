"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { ClientEntity, GstinRecordItem } from "@/lib/types";

export interface ClientContextType {
  selectedClient: ClientEntity | null;
  selectedGstin: string | null;
  selectedGstinRecord: GstinRecordItem | null;
  selectedFy: string;
  selectedAy: string;
  selectedPeriod: string;
  isFirmWideView: boolean;
  recentClients: ClientEntity[];
  selectClient: (client: ClientEntity | null, preferredGstin?: string) => void;
  selectGstin: (gstin: string) => void;
  selectFy: (fy: string) => void;
  selectPeriod: (period: string) => void;
  setFirmWideView: (isFirmWide: boolean) => void;
  clearClientContext: () => void;
  availableGstins: GstinRecordItem[];
}

const STORAGE_KEYS = {
  CLIENT_ID: "bt_selected_client_id_v2",
  GSTIN: "bt_selected_gstin_v2",
  FY: "bt_selected_fy_v2",
  PERIOD: "bt_selected_period_v2",
  RECENT: "bt_recent_clients_v2",
  FIRMWIDE: "bt_is_firmwide_v2",
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

function deriveAssessmentYear(fy: string): string {
  try {
    const parts = fy.split("-");
    if (parts.length === 2) {
      const startYear = parseInt(parts[0], 10);
      const endYearShort = parseInt(parts[1], 10);
      return `${startYear + 1}-${(endYearShort + 1).toString().padStart(2, "0")}`;
    }
  } catch {}
  return "2025-26";
}

export const ClientProvider: React.FC<{
  children: React.ReactNode;
  initialClients?: ClientEntity[];
}> = ({ children, initialClients = [] }) => {
  const [selectedClient, setSelectedClientState] = useState<ClientEntity | null>(null);
  const [selectedGstin, setSelectedGstinState] = useState<string | null>(null);
  const [selectedFy, setSelectedFyState] = useState<string>("2024-25");
  const [selectedPeriod, setSelectedPeriodState] = useState<string>("September 2026");
  const [isFirmWideView, setIsFirmWideViewState] = useState<boolean>(true);
  const [recentClients, setRecentClients] = useState<ClientEntity[]>([]);

  // Computed Assessment Year
  const selectedAy = useMemo(() => deriveAssessmentYear(selectedFy), [selectedFy]);

  // Derived available GSTINs for the selected client
  const availableGstins = useMemo((): GstinRecordItem[] => {
    if (!selectedClient) return [];
    if (selectedClient.gstinRecords && selectedClient.gstinRecords.length > 0) {
      return selectedClient.gstinRecords;
    }
    if (selectedClient.gstin) {
      const stateCode = selectedClient.gstin.substring(0, 2);
      return [
        {
          gstin: selectedClient.gstin,
          stateCode,
          stateName: getStateNameByCode(stateCode),
          tradeName: selectedClient.tradeName || selectedClient.name,
          registrationType: "REGULAR",
          filingFrequency: "MONTHLY",
          status: "ACTIVE",
          eWayBillEnabled: true,
          eInvoiceApplicable: (selectedClient.turnoverCr || 0) > 5,
        },
      ];
    }
    return [];
  }, [selectedClient]);

  // Derived active GSTIN record
  const selectedGstinRecord = useMemo(() => {
    if (!selectedGstin || availableGstins.length === 0) return null;
    return availableGstins.find((g) => g.gstin === selectedGstin) || availableGstins[0] || null;
  }, [selectedGstin, availableGstins]);

  // Load state from localStorage on initial render
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedFy = localStorage.getItem(STORAGE_KEYS.FY);
      if (savedFy) setSelectedFyState(savedFy);

      const savedPeriod = localStorage.getItem(STORAGE_KEYS.PERIOD);
      if (savedPeriod) setSelectedPeriodState(savedPeriod);

      const savedRecent = localStorage.getItem(STORAGE_KEYS.RECENT);
      if (savedRecent) {
        try {
          const parsed = JSON.parse(savedRecent);
          if (Array.isArray(parsed)) setRecentClients(parsed);
        } catch {}
      }

      const savedFirmwide = localStorage.getItem(STORAGE_KEYS.FIRMWIDE);
      if (savedFirmwide !== null) {
        setIsFirmWideViewState(savedFirmwide === "true");
      }

      // Restore client from query params or storage
      const urlParams = new URLSearchParams(window.location.search);
      const urlClientId = urlParams.get("clientId");
      const urlGstin = urlParams.get("gstin");
      const savedClientId = urlClientId || localStorage.getItem(STORAGE_KEYS.CLIENT_ID);

      if (savedClientId && initialClients.length > 0) {
        const matched = initialClients.find((c) => c.id === savedClientId);
        if (matched) {
          setSelectedClientState(matched);
          setIsFirmWideViewState(false);

          const gstinToSelect =
            urlGstin ||
            localStorage.getItem(STORAGE_KEYS.GSTIN) ||
            matched.gstinRecords?.[0]?.gstin ||
            matched.gstin ||
            null;
          setSelectedGstinState(gstinToSelect);
        }
      }
    } catch (e) {
      console.warn("ClientContext hydration warning:", e);
    }
  }, [initialClients]);

  // Fallback initial load from server-side search if no client selected yet
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromServer() {
      if (selectedClient) return;
      try {
        const res = await fetch("/api/clients/search?limit=15");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.clients && data.clients.length > 0 && isMounted) {
            const list: ClientEntity[] = data.clients;
            setRecentClients((prev) => (prev.length > 0 ? prev : list.slice(0, 5)));

            const savedClientId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.CLIENT_ID) : null;
            const savedFirmwide = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.FIRMWIDE) : null;
            const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
            const urlClientId = urlParams?.get("clientId");
            const urlGstin = urlParams?.get("gstin");

            const targetId = urlClientId || savedClientId;
            let targetClient = list.find((c) => c.id === targetId);

            if (!targetClient && savedFirmwide !== "true") {
              // Default to the first client in master (Tata Steel or Pratwi)
              targetClient = list[0];
            }

            if (targetClient && !selectedClient) {
              setSelectedClientState(targetClient);
              setIsFirmWideViewState(false);
              const gstin =
                urlGstin ||
                (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.GSTIN) : null) ||
                targetClient.gstinRecords?.[0]?.gstin ||
                targetClient.gstin ||
                null;
              setSelectedGstinState(gstin);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load initial clients in ClientContext:", err);
      }
    }
    hydrateFromServer();
    return () => {
      isMounted = false;
    };
  }, [selectedClient]);

  // Select Client
  const selectClient = useCallback(
    (client: ClientEntity | null, preferredGstin?: string) => {
      if (!client) {
        setSelectedClientState(null);
        setSelectedGstinState(null);
        setIsFirmWideViewState(true);
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
          localStorage.removeItem(STORAGE_KEYS.GSTIN);
          localStorage.setItem(STORAGE_KEYS.FIRMWIDE, "true");
        }
        return;
      }

      setSelectedClientState(client);
      setIsFirmWideViewState(false);

      // Determine active GSTIN
      let activeGstin: string | null = null;
      if (preferredGstin) {
        activeGstin = preferredGstin;
      } else if (client.gstinRecords && client.gstinRecords.length > 0) {
        activeGstin = client.gstinRecords[0].gstin;
      } else if (client.gstin) {
        activeGstin = client.gstin;
      }
      setSelectedGstinState(activeGstin);

      // Update Recent Clients (max 8)
      setRecentClients((prev) => {
        const filtered = prev.filter((c) => c.id !== client.id);
        const updated = [client, ...filtered].slice(0, 8);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEYS.CLIENT_ID, client.id);
          if (activeGstin) localStorage.setItem(STORAGE_KEYS.GSTIN, activeGstin);
          localStorage.setItem(STORAGE_KEYS.FIRMWIDE, "false");
        } catch {}
      }
    },
    []
  );

  // Select GSTIN
  const selectGstin = useCallback((gstin: string) => {
    setSelectedGstinState(gstin);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.GSTIN, gstin);
      } catch {}
    }
  }, []);

  // Select Financial Year
  const selectFy = useCallback((fy: string) => {
    setSelectedFyState(fy);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.FY, fy);
      } catch {}
    }
  }, []);

  // Select Period
  const selectPeriod = useCallback((period: string) => {
    setSelectedPeriodState(period);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.PERIOD, period);
      } catch {}
    }
  }, []);

  // Toggle Firm-wide view
  const setFirmWideView = useCallback((isFirmWide: boolean) => {
    setIsFirmWideViewState(isFirmWide);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.FIRMWIDE, isFirmWide ? "true" : "false");
      } catch {}
    }
  }, []);

  // Clear Context
  const clearClientContext = useCallback(() => {
    setSelectedClientState(null);
    setSelectedGstinState(null);
    setIsFirmWideViewState(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
        localStorage.removeItem(STORAGE_KEYS.GSTIN);
        localStorage.setItem(STORAGE_KEYS.FIRMWIDE, "true");
      } catch {}
    }
  }, []);

  const value = useMemo(
    () => ({
      selectedClient,
      selectedGstin,
      selectedGstinRecord,
      selectedFy,
      selectedAy,
      selectedPeriod,
      isFirmWideView,
      recentClients,
      selectClient,
      selectGstin,
      selectFy,
      selectPeriod,
      setFirmWideView,
      clearClientContext,
      availableGstins,
    }),
    [
      selectedClient,
      selectedGstin,
      selectedGstinRecord,
      selectedFy,
      selectedAy,
      selectedPeriod,
      isFirmWideView,
      recentClients,
      selectClient,
      selectGstin,
      selectFy,
      selectPeriod,
      setFirmWideView,
      clearClientContext,
      availableGstins,
    ]
  );

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};

export const useClientContext = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClientContext must be used within a ClientProvider");
  }
  return context;
};

// State code helper function
function getStateNameByCode(code: string): string {
  const stateMap: Record<string, string> = {
    "01": "Jammu & Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "26": "Dadra & Nagar Haveli and Daman & Diu",
    "27": "Maharashtra",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman & Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
  };
  return stateMap[code] || "India";
}
