import React, { useState, useEffect, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { MetricsStrip } from './components/MetricsStrip';
import { CommandPanel } from './components/CommandPanel';
import { LiveDagView } from './components/LiveDagView';
import { TraceAndApprovalsPanel } from './components/TraceAndApprovalsPanel';
import { WorkspaceTabs } from './components/WorkspaceTabs';
import { SettingsModal } from './components/SettingsModal';
import { UnitTestsModal } from './components/UnitTestsModal';
import { VoucherDetailModal } from './components/VoucherDetailModal';
import { supervisor } from './orchestrator/supervisor';
import { planBusinessRequest } from './agents/plannerAgent';
import { db } from './store/db';
import {
  Customer,
  InventoryItem,
  PriceListItem,
  Voucher,
  LedgerEntry,
  OutboxItem,
} from './types/entities';
import { Task, TaskPlan, ApprovalRequest, AgentMessage, AuditLogEntry, RunMetrics } from './types/agent';

export default function App() {
  // DB entities state
  const [vouchers, setVouchers] = useState<Voucher[]>(() => db.getVouchers());
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => db.getLedgerEntries());
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => db.getInventory());
  const [priceList, setPriceList] = useState<PriceListItem[]>(() => db.getPriceList());
  const [outbox, setOutbox] = useState<OutboxItem[]>(() => db.getOutbox());
  const [messages, setMessages] = useState<AgentMessage[]>(() => db.getMessages());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => db.getAuditLog());

  // Supervisor state
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(() => supervisor.getCurrentPlan());
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => supervisor.getPendingApprovals());
  const [metrics, setMetrics] = useState<RunMetrics>(() => supervisor.getMetrics());
  const [isExecuting, setIsExecuting] = useState<boolean>(() => supervisor.isBusy());

  // Modals & UI Selection
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUnitTestsOpen, setIsUnitTestsOpen] = useState(false);
  const [inspectedVoucher, setInspectedVoucher] = useState<Voucher | null>(null);

  // Judge Mode Automation State
  const [isJudgeModeActive, setIsJudgeModeActive] = useState(false);
  const [judgeStep, setJudgeStep] = useState(0);

  // Sync state from DB & Supervisor
  const refreshState = useCallback(() => {
    setVouchers(db.getVouchers());
    setLedgerEntries(db.getLedgerEntries());
    setCustomers(db.getCustomers());
    setInventory(db.getInventory());
    setPriceList(db.getPriceList());
    setOutbox(db.getOutbox());
    setMessages(db.getMessages());
    setAuditLogs(db.getAuditLog());

    setCurrentPlan(supervisor.getCurrentPlan());
    setApprovals(supervisor.getPendingApprovals());
    setMetrics(supervisor.getMetrics());
    setIsExecuting(supervisor.isBusy());
  }, []);

  // Subscribe to supervisor state changes
  useEffect(() => {
    const unsubscribe = supervisor.subscribe(() => {
      refreshState();
    });
    return unsubscribe;
  }, [refreshState]);

  // Execute business request via Planner -> Supervisor
  const handleExecuteRequest = async (
    text: string,
    imageBase64?: string,
    audioBase64?: string
  ) => {
    try {
      // 1. Planner Agent builds DAG
      const plan = await planBusinessRequest(text, imageBase64, audioBase64);
      setCurrentPlan(plan);

      // 2. Supervisor initiates topological execution
      await supervisor.startPlan(plan, {
        rawInput: text,
        imageBase64,
        audioBase64,
      });

      refreshState();

      // Automatically inspect newly generated voucher if created
      const allVouchers = db.getVouchers();
      if (allVouchers.length > 0) {
        setInspectedVoucher(allVouchers[0]);
      }
    } catch (err: any) {
      console.error('Request execution error:', err);
      refreshState();
    }
  };

  // Run Demo Scenarios
  const handleRunDemoScenario = async (scenarioIndex: number) => {
    switch (scenarioIndex) {
      case 1: {
        // Happy Path: Patel Hardware (Clean sale)
        const text =
          'Patel Hardware pe 50 box drill bits diye, 15000 ka bill bana, 12000 mila, baaki 3000 kal subah denge.';
        await handleExecuteRequest(text);
        break;
      }
      case 2: {
        // Math Mismatch Caught: Sharma Kirana
        const text =
          'Sharma Kirana pe 20 peti oil utaara, 42000 bill, 15000 mila, baaki 29000 agle somwar ko denge.';
        await handleExecuteRequest(text);
        break;
      }
      case 3: {
        // Failure Injection + Automatic Retry Recovery
        db.updateSettings({ injectToolFailure: true });
        const text =
          'Gupta Medical pe 30 box paracetamol utaara, 8000 bill, 3000 paid, baaki 5000.';
        await handleExecuteRequest(text);
        break;
      }
    }
  };

  // Judge Mode sequential runner
  const handleStartJudgeMode = async () => {
    if (isJudgeModeActive) return;
    setIsJudgeModeActive(true);
    setJudgeStep(1);

    // Scenario 1: Happy Path
    await handleRunDemoScenario(1);

    // Poll until idle or wait
    const checkInterval = setInterval(async () => {
      if (!supervisor.isBusy() && supervisor.getPendingApprovals().length === 0) {
        if (judgeStep === 1) {
          setJudgeStep(2);
          clearInterval(checkInterval);
          setTimeout(async () => {
            // Scenario 2: Math Mismatch (will pause at approval gate!)
            await handleRunDemoScenario(2);
          }, 1500);
        }
      }
    }, 1000);
  };

  // Continue Judge Mode after approval if active
  useEffect(() => {
    if (isJudgeModeActive && judgeStep === 2) {
      // If user resolved the math approval and supervisor finished
      if (!isExecuting && approvals.length === 0 && currentPlan?.intent === 'record_sale') {
        setJudgeStep(3);
        const timer = setTimeout(async () => {
          // Scenario 3: Failure & auto-retry
          await handleRunDemoScenario(3);
          setIsJudgeModeActive(false);
          setJudgeStep(0);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isJudgeModeActive, judgeStep, isExecuting, approvals.length, currentPlan]);

  const handleResolveApproval = async (
    approvalId: string,
    decision: 'APPROVE' | 'REJECT',
    chosenValue?: any
  ) => {
    await supervisor.resolveApproval(approvalId, decision, chosenValue);
    refreshState();
    const allVouchers = db.getVouchers();
    if (allVouchers.length > 0) {
      setInspectedVoucher(allVouchers[0]);
    }
  };

  const activeTaskCount = currentPlan?.tasks.filter((t) => t.status === 'running').length || 0;
  const totalTaskCount = currentPlan?.tasks.length || 0;
  const pendingApprovalCount = approvals.filter((a) => a.status === 'PENDING').length;
  const hasFailedTasks = currentPlan?.tasks.some((t) => t.status === 'failed') || false;

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#1F2328] flex flex-col font-sans antialiased selection:bg-[#234E7D] selection:text-white">
      {/* 1. Top bar (56px, white, 1px bottom border) */}
      <HeaderBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDeveloperTrace={() => setIsUnitTestsOpen(true)}
        onStartJudgeMode={handleStartJudgeMode}
        isJudgeModeActive={isJudgeModeActive}
        judgeStep={judgeStep}
        onGlobalCommand={handleExecuteRequest}
        isExecuting={isExecuting}
      />

      {/* 2. Summary row (subtle fill #FBFAF7, 1px bottom border) with Recharts revenue trend */}
      <MetricsStrip
        metrics={metrics}
        isExecuting={isExecuting}
        activeTaskCount={activeTaskCount}
        totalTaskCount={totalTaskCount}
        pendingApprovalCount={pendingApprovalCount}
        hasFailedTasks={hasFailedTasks}
        vouchers={vouchers}
        ledgerEntries={ledgerEntries}
      />

      {/* 3. Main content area (max-width 1440px, padding 24px) */}
      <main className="flex-1 px-6 py-6 max-w-[1440px] w-full mx-auto flex flex-col gap-6">
        {/* 3-column Grid (360px / flexible / 360px) */}
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr_360px] lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: New request */}
          <div className="xl:col-span-1 lg:col-span-4 w-full">
            <CommandPanel
              onSubmitRequest={handleExecuteRequest}
              isBusy={isExecuting}
              onRunDemoScenario={handleRunDemoScenario}
            />
          </div>

          {/* Center panel: Task plan */}
          <div className="xl:col-span-1 lg:col-span-4 w-full">
            <LiveDagView
              plan={currentPlan}
              onSelectTask={(task: Task) => {
                if (task.result?.voucher) {
                  setInspectedVoucher(task.result.voucher);
                } else if (task.agent === 'intake' && task.result?.items) {
                  const draftVoucher: Voucher = {
                    id: `v-draft-${Date.now()}`,
                    voucherNumber: 'EXTRACTED-BILL',
                    date: new Date().toISOString().split('T')[0],
                    partyName: task.result.customer?.name || 'Customer Bill Note',
                    partyBeat: task.result.customer?.beat || 'Indore Mandi Hub',
                    partyGstin: task.result.customer?.gstin || '23AABCS1429B1Z5',
                    totalAmount: task.result.totalBill || 0,
                    paidAmount: task.result.paidAmount || 0,
                    paymentMode: task.result.paymentMode || 'CASH',
                    statedUdhaar: task.result.statedPending || 0,
                    computedUdhaar: Math.max(0, (task.result.totalBill || 0) - (task.result.paidAmount || 0)),
                    hasMathAnomaly: false,
                    mathDiscrepancy: 0,
                    anomalyDetails: {
                      statedBalance: task.result.statedPending || 0,
                      actualBalance: Math.max(0, (task.result.totalBill || 0) - (task.result.paidAmount || 0)),
                      discrepancyCaught: 0,
                      explanation: 'Extracted directly from multimodal bill intake.',
                      riskClassification: 'CLEAN_SETTLEMENT',
                    },
                    dueDate: task.result.dueDate || '2026-11-05',
                    items: task.result.items || [],
                    creditRisk: {
                      exposurePercent: 0,
                      riskRating: 'LOW',
                      badgeText: 'EXTRACTED INVOICE',
                      cfoDirective: 'Extracted from bill image for forensic review.',
                    },
                    hinglishSummary: `${task.result.customer?.name || 'Customer'}: बिल से आइटम और गणना निकाली गई।`,
                    whatsappParchiText: '',
                  };
                  setInspectedVoucher(draftVoucher);
                } else {
                  const allV = db.getVouchers();
                  if (allV.length > 0) setInspectedVoucher(allV[0]);
                }
              }}
            />
          </div>

          {/* Right panel: Activity & Approvals */}
          <div className="xl:col-span-1 lg:col-span-4 w-full">
            <TraceAndApprovalsPanel
              approvals={approvals}
              messages={messages}
              auditLogs={auditLogs}
              onResolveApproval={handleResolveApproval}
            />
          </div>
        </div>

        {/* 4. Bottom Row: Master ledger, Customers and risk, Inventory and rates, Outbox */}
        <div className="w-full">
          <WorkspaceTabs
            vouchers={vouchers}
            ledgerEntries={ledgerEntries}
            customers={customers}
            inventory={inventory}
            priceList={priceList}
            outbox={outbox}
            onSelectVoucher={(v) => setInspectedVoucher(v)}
          />
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={refreshState}
      />

      <UnitTestsModal
        isOpen={isUnitTestsOpen}
        onClose={() => setIsUnitTestsOpen(false)}
      />

      <VoucherDetailModal
        voucher={inspectedVoucher}
        onClose={() => setInspectedVoucher(null)}
        onUpdateVoucher={(updated) => {
          db.saveVoucher(updated);
          refreshState();
          setInspectedVoucher(updated);
        }}
      />
    </div>
  );
}
