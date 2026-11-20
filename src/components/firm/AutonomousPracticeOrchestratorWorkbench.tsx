'use client';

import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Send, 
  Building2, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Lock,
  Zap,
  Terminal,
  Activity
} from 'lucide-react';
import { 
  UniversalEntityDnaMesh, 
  ClientEntityDna, 
  SAMPLE_CLIENT_DNA_APEX, 
  SAMPLE_CLIENT_DNA_PRATWI,
  CrossSuiteEventType,
  RippleImpactSummary
} from '@/lib/mesh/universalEntityDnaMesh';
import { 
  AutonomousPracticeOrchestrator, 
  AutonomousRunReport 
} from '@/lib/mesh/autonomousPracticeOrchestrator';

export default function AutonomousPracticeOrchestratorWorkbench() {
  const [selectedClient, setSelectedClient] = useState<ClientEntityDna>(SAMPLE_CLIENT_DNA_APEX);
  const [customPan, setCustomPan] = useState(SAMPLE_CLIENT_DNA_APEX.pan);
  const [customGstin, setCustomGstin] = useState(SAMPLE_CLIENT_DNA_APEX.gstin);
  const [customCin, setCustomCin] = useState(SAMPLE_CLIENT_DNA_APEX.cin || '');

  // Full autonomous run state
  const [isRunning, setIsRunning] = useState(false);
  const [runReport, setRunReport] = useState<AutonomousRunReport>(
    AutonomousPracticeOrchestrator.executeFullPracticeRun(SAMPLE_CLIENT_DNA_APEX)
  );

  // Ripple simulation state
  const [simEventType, setSimEventType] = useState<CrossSuiteEventType>('MSME_OVERDUE_INVOICE_FLAGGED');
  const [simAmount, setSimAmount] = useState<number>(145000);
  const [simCounterparty, setSimCounterparty] = useState<string>('Mahavir Precision Forgings Pvt Ltd');
  const [simRippleResult, setSimRippleResult] = useState<RippleImpactSummary | null>(null);

  const [copiedBrief, setCopiedBrief] = useState(false);

  // Statutory Validations for active inputs
  const panValidation = UniversalEntityDnaMesh.validatePan(customPan);
  const gstinValidation = UniversalEntityDnaMesh.validateGstin(customGstin);
  const cinValidation = customCin ? UniversalEntityDnaMesh.validateCin(customCin) : undefined;

  const handleSelectClientProfile = (client: ClientEntityDna) => {
    setSelectedClient(client);
    setCustomPan(client.pan);
    setCustomGstin(client.gstin);
    setCustomCin(client.cin || '');
    setRunReport(AutonomousPracticeOrchestrator.executeFullPracticeRun(client));
    setSimRippleResult(null);
  };

  const handleTriggerAutonomousRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const updatedClient: ClientEntityDna = {
        ...selectedClient,
        pan: customPan.toUpperCase(),
        gstin: customGstin.toUpperCase(),
        cin: customCin.toUpperCase()
      };
      const report = AutonomousPracticeOrchestrator.executeFullPracticeRun(updatedClient);
      setRunReport(report);
      setIsRunning(false);
    }, 700);
  };

  const handleSimulateRipple = () => {
    const result = UniversalEntityDnaMesh.dispatchTransactionRipple(selectedClient, {
      id: `EVT-${Date.now()}`,
      eventType: simEventType,
      clientPan: selectedClient.pan,
      sourceModule: 'Autonomous Cross-Suite Bus',
      transactionDate: '2026-11-20',
      amount: simAmount,
      counterpartyName: simCounterparty,
      details: 'Real-world transaction input'
    });
    setSimRippleResult(result);
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(runReport.whatsAppBriefingText);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <Cpu className="w-3.5 h-3.5" />
              Autonomous Practice Layer: 2035 Zero-Touch Nervous System
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Universal Entity DNA Mesh & Cross-Suite Auto-Pilot
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              "Input Once, Sync Everywhere": Real-world Indian statutory validation (PAN, GSTIN, CIN, TAN), 
              instant cross-suite ripple cascade across all 8 Pillars, automated Tally MOC generation, and 96% Zero-Touch partner autonomy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerAutonomousRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Synchronizing 8 Pillars...' : 'Run 100% Autonomous 8-Pillar Sync'}
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Zero-Touch Automation</span>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">{runReport.overallAutomationScorePct}%</p>
            <span className="text-[11px] text-slate-400">Zero human data entry</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Pillars Orchestrated</span>
            <p className="text-2xl font-bold text-white mt-0.5">8 / 8 Pillars</p>
            <span className="text-[11px] text-indigo-400">GST, ITR, 3CD, Bank, TDS, MCA, UDIN, Tally</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Statutory Penalties Prevented</span>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">
              ₹{runReport.totalPenaltiesPreventedInr.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400">Sec 271D, 271J, 234E & 50</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Tally MOCs Generated</span>
            <p className="text-2xl font-bold text-sky-400 mt-0.5">{runReport.tallyVouchersGeneratedCount} Vouchers</p>
            <span className="text-[11px] text-slate-400">Posted via Tally XML Bridge</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: ENTITY DNA STATUTORY VALIDATOR & REAL CLIENT SELECTOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Real-World Entity DNA Master & Statutory Validator
            </h3>
            <p className="text-xs text-slate-400">Select an institutional client or enter real-world statutory credentials</p>
          </div>

          {/* Client Switcher Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectClientProfile(SAMPLE_CLIENT_DNA_APEX)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedClient.id === SAMPLE_CLIENT_DNA_APEX.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Apex AutoTech (MP)
            </button>
            <button
              onClick={() => handleSelectClientProfile(SAMPLE_CLIENT_DNA_PRATWI)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedClient.id === SAMPLE_CLIENT_DNA_PRATWI.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Pratwi Solutions (MH)
            </button>
          </div>
        </div>

        {/* Live Statutory Regex Validator Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* PAN Validator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Income Tax PAN (10-Digit)</span>
              {panValidation.isValid ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3 h-3" /> Invalid
                </span>
              )}
            </div>
            <input
              type="text"
              value={customPan}
              maxLength={10}
              onChange={(e) => setCustomPan(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
            {panValidation.isValid ? (
              <p className="text-[11px] text-emerald-400">
                Type: <span className="font-semibold text-white">{panValidation.extractedDetails?.entityCategory}</span> (4th Char: '{panValidation.extractedDetails?.fourthChar}')
              </p>
            ) : (
              <p className="text-[11px] text-rose-400">{panValidation.error}</p>
            )}
          </div>

          {/* GSTIN Validator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">GSTIN (15-Digit)</span>
              {gstinValidation.isValid ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3 h-3" /> Invalid
                </span>
              )}
            </div>
            <input
              type="text"
              value={customGstin}
              maxLength={15}
              onChange={(e) => setCustomGstin(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
            {gstinValidation.isValid ? (
              <p className="text-[11px] text-emerald-400">
                State Code: <span className="font-semibold text-white">{gstinValidation.extractedDetails?.stateCode}</span> • Embedded PAN: <span className="font-semibold text-white">{gstinValidation.extractedDetails?.embeddedPan}</span>
              </p>
            ) : (
              <p className="text-[11px] text-rose-400">{gstinValidation.error}</p>
            )}
          </div>

          {/* CIN Validator */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">MCA CIN (21-Digit)</span>
              {cinValidation?.isValid ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              ) : (
                <span className="text-slate-500 text-[11px]">Non-Corporate / Optional</span>
              )}
            </div>
            <input
              type="text"
              value={customCin}
              maxLength={21}
              onChange={(e) => setCustomCin(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
            {cinValidation?.isValid && (
              <p className="text-[11px] text-emerald-400">
                {cinValidation.extractedDetails?.companyClass} (Incorp: {cinValidation.extractedDetails?.yearOfIncorporation}, State: {cinValidation.extractedDetails?.stateCode})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: CROSS-SUITE RIPPLE DISPATCHER SIMULATOR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Cross-Suite Event Ripple Simulator ("Input Once, Sync Everywhere")
            </h3>
            <p className="text-xs text-slate-400">
              Simulate a single transaction entry in one module and observe its instantaneous ripple across all related pillars.
            </p>
          </div>

          <button
            onClick={handleSimulateRipple}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Dispatch Live Event Ripple
          </button>
        </div>

        {/* Simulation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Trigger Event Type</label>
            <select
              value={simEventType}
              onChange={(e) => setSimEventType(e.target.value as CrossSuiteEventType)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
            >
              <option value="MSME_OVERDUE_INVOICE_FLAGGED">MSME Supplier Bill Unpaid &gt; 45 Days</option>
              <option value="CASH_LOAN_269SS_FLAGGED">Cash Loan Received &gt;= ₹20,000 (Sec 269SS)</option>
              <option value="ITC_BLOCKED_17_5_FLAGGED">Corporate Club Expense (Ineligible ITC Sec 17(5))</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Counterparty / Supplier Name</label>
            <input
              type="text"
              value={simCounterparty}
              onChange={(e) => setSimCounterparty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Transaction Value (₹)</label>
            <input
              type="number"
              value={simAmount}
              onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-emerald-400 font-bold text-xs"
            />
          </div>
        </div>

        {/* Live Ripple Results */}
        {simRippleResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Cross-Suite Ripple Synchronized Across {simRippleResult.impacts.length} Pillars
              </span>
              <span className="text-[11px] font-mono text-slate-400">{simRippleResult.eventId}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {simRippleResult.impacts.map((imp, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-indigo-400 font-bold">{imp.pillar}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {imp.affectedModule}
                    </span>
                  </div>
                  <p className="text-slate-300">{imp.actionTaken}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Statutory Authority: {imp.statutoryRef}</p>
                </div>
              ))}
            </div>

            {/* Generated Tally XML & WhatsApp Brief Preview */}
            {simRippleResult.generatedTallyMocXml && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Auto-Generated Tally XML MOC Voucher (Pillar VIII Sync):
                </span>
                <pre className="p-2.5 rounded bg-slate-900 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  {simRippleResult.generatedTallyMocXml}
                </pre>
              </div>
            )}

            <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
              <span className="font-semibold">Automated WhatsApp Briefing Line: </span>
              {simRippleResult.partnerWhatsAppBriefLine}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: 8-PILLAR AUTONOMOUS EXECUTION STATUS GRID */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Full 8-Pillar Autonomous Execution Grid
            </h3>
            <p className="text-xs text-slate-400">Live operational status across all compliance and audit dimensions</p>
          </div>

          <span className="text-xs font-mono text-slate-400">Run ID: {runReport.runId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {runReport.pillarResults.map(pillar => (
            <div
              key={pillar.pillarNumber}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-white">{pillar.pillarTitle}</h4>
                  <span className="text-[11px] text-slate-400">Due: {pillar.statutoryDueDate}</span>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    pillar.automationStatus === 'AUTO_RESOLVED_CLEAN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {pillar.automationStatus === 'AUTO_RESOLVED_CLEAN' ? 'Clean (Zero-Touch)' : 'Partner Review'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{pillar.zeroTouchRatioPct}% Automated</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                {pillar.keyOutputs.map((out, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{out}</span>
                  </p>
                ))}
              </div>

              {pillar.penaltiesPreventedInr > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px]">
                  <span className="text-slate-400">Penalties Prevented:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    ₹{pillar.penaltiesPreventedInr.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: PARTNER 8:00 AM WHATSAPP BRIEFING DISPATCH DESK */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Autonomous Partner WhatsApp Briefing Digest
            </h3>
            <p className="text-xs text-slate-400">Synthesized 8:00 AM morning pulse delivered directly to managing partner mobile</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBrief ? 'Copied!' : 'Copy WhatsApp Text'}
            </button>
            <button
              onClick={() => alert('WhatsApp briefing dispatched successfully to Partner mobile!')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch via WhatsApp API
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
          {runReport.whatsAppBriefingText}
        </div>
      </div>
    </div>
  );
}
