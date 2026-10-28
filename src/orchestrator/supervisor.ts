import {
  Task,
  TaskPlan,
  TaskStatus,
  AgentMessage,
  AuditLogEntry,
  ApprovalRequest,
  RunMetrics,
} from '../types/agent';
import { Customer, Voucher, VoucherItem } from '../types/entities';
import { db } from '../store/db';
import { executeIntake, IntakeResult } from '../agents/intakeAgent';
import { executeAuditor, AuditorResult } from '../agents/auditorAgent';
import { executeRiskAgent, RiskAgentResult } from '../agents/riskAgent';
import { executeLedgerAgent, LedgerCommitResult } from '../agents/ledgerAgent';
import { executeCollectionsAgent, CollectionsResult } from '../agents/collectionsAgent';
import { executeDailySummary, executeCustomerStatement } from '../agents/reporterAgent';

export type SupervisorListener = () => void;

class SupervisorStateMachine {
  private currentPlan: TaskPlan | null = null;
  private pendingApprovals: ApprovalRequest[] = [];
  private listeners: SupervisorListener[] = [];
  private isExecuting = false;
  private executionContext: Record<string, any> = {};

  // Real measured metrics
  private metrics: RunMetrics = {
    totalTasksCompleted: 0,
    totalRetries: 0,
    totalApprovalsRequested: 0,
    lastRunDurationMs: 0,
  };

  private runStartTime = 0;

  public subscribe(listener: SupervisorListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getCurrentPlan(): TaskPlan | null {
    return this.currentPlan;
  }

  public getPendingApprovals(): ApprovalRequest[] {
    return [...this.pendingApprovals];
  }

  public getMetrics(): RunMetrics {
    return { ...this.metrics };
  }

  public isBusy(): boolean {
    return this.isExecuting;
  }

  // Broadcast typed agent message on bus
  private broadcastMessage(
    from: AgentMessage['from'],
    to: AgentMessage['to'],
    type: string,
    payload: any
  ) {
    const msg: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      from,
      to,
      type,
      payload,
    };
    db.broadcastMessage(msg);
  }

  // Record audit log entry
  private recordAuditLog(
    agent: AuditLogEntry['agent'],
    tool: string,
    inputs: any,
    outputs: any,
    durationMs: number,
    status: AuditLogEntry['status'],
    error?: string
  ) {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      agent,
      tool,
      inputs,
      outputs,
      durationMs,
      status,
      error,
    };
    db.logAction(entry);
  }

  // Load and start executing a plan
  public async startPlan(plan: TaskPlan, initialContext: Record<string, any> = {}): Promise<void> {
    this.currentPlan = plan;
    this.executionContext = { ...initialContext };
    this.runStartTime = performance.now();
    this.isExecuting = true;

    this.broadcastMessage('planner', 'supervisor', 'PLAN_INITIALIZED', {
      goal: plan.goal,
      taskCount: plan.tasks.length,
      intent: plan.intent,
      isFallbackPlan: plan.isFallbackPlan,
    });

    this.notify();
    await this.step();
  }

  // Core topological task scheduler
  public async step(): Promise<void> {
    if (!this.currentPlan || !this.isExecuting) return;

    // Check if any approval is currently pending resolution
    if (this.pendingApprovals.some((a) => a.status === 'PENDING')) {
      this.notify();
      return;
    }

    const tasks = this.currentPlan.tasks;

    // Find tasks whose dependencies are fulfilled
    const readyTasks = tasks.filter((t) => {
      if (t.status !== 'pending') return false;
      // All dependencies must have status 'succeeded'
      return t.depends_on.every((depId) => {
        const dep = tasks.find((item) => item.id === depId);
        return dep && dep.status === 'succeeded';
      });
    });

    if (readyTasks.length === 0) {
      // Check if all tasks are finished (succeeded, skipped, failed, or rejected)
      const allDone = tasks.every((t) =>
        ['succeeded', 'failed', 'rejected', 'skipped'].includes(t.status)
      );

      if (allDone) {
        this.isExecuting = false;
        this.metrics.lastRunDurationMs = Math.round(performance.now() - this.runStartTime);
        this.broadcastMessage('supervisor', 'user', 'RUN_COMPLETED', {
          durationMs: this.metrics.lastRunDurationMs,
          totalTasks: tasks.length,
          succeeded: tasks.filter((t) => t.status === 'succeeded').length,
          skipped: tasks.filter((t) => t.status === 'skipped').length,
          failed: tasks.filter((t) => t.status === 'failed').length,
        });
        this.notify();
      }
      return;
    }

    // Run independent ready tasks in parallel
    await Promise.all(readyTasks.map((t) => this.runSingleTask(t)));

    // Recursively step forward
    await this.step();
  }

  // Execute a single task with retries, backoff, and policy checks
  private async runSingleTask(task: Task): Promise<void> {
    task.status = 'running';
    task.startTime = performance.now();
    this.notify();

    this.broadcastMessage('supervisor', task.agent, 'EXECUTE_TASK', {
      taskId: task.id,
      action: task.action,
      inputs: task.inputs,
    });

    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
      try {
        const result = await this.dispatchAgentAction(task);
        task.result = result;

        // Human-in-the-loop Policy Evaluation
        const approvalNeeded = await this.evaluatePolicyGates(task, result);

        if (approvalNeeded) {
          task.status = 'awaiting_approval';
          task.durationMs = Math.round(performance.now() - (task.startTime || performance.now()));
          this.notify();
          return; // Await user decision
        }

        // Succeeded
        task.status = 'succeeded';
        task.durationMs = Math.round(performance.now() - (task.startTime || performance.now()));
        this.metrics.totalTasksCompleted++;

        this.broadcastMessage(task.agent, 'supervisor', 'TASK_SUCCEEDED', {
          taskId: task.id,
          durationMs: task.durationMs,
        });

        this.notify();
        return;
      } catch (err: any) {
        attempts++;
        task.retryCount = attempts;
        this.metrics.totalRetries++;

        const errorMsg = err?.message || String(err);
        this.recordAuditLog(
          task.agent,
          task.action,
          task.inputs,
          null,
          Math.round(performance.now() - (task.startTime || performance.now())),
          'RETRY',
          `Attempt ${attempts}/${maxRetries} failed: ${errorMsg}`
        );

        if (attempts <= maxRetries) {
          task.status = 'retrying';
          this.broadcastMessage(task.agent, 'supervisor', 'TASK_RETRYING', {
            taskId: task.id,
            attempt: attempts,
            error: errorMsg,
          });
          this.notify();
          // Exponential backoff: 300ms, 600ms
          await new Promise((resolve) => setTimeout(resolve, attempts * 300));
        } else {
          // Permanent failure - escalate to human
          task.status = 'failed';
          task.error = errorMsg;
          task.durationMs = Math.round(performance.now() - (task.startTime || performance.now()));

          this.recordAuditLog(
            task.agent,
            task.action,
            task.inputs,
            null,
            task.durationMs,
            'ESCALATED',
            `Exhausted retries: ${errorMsg}`
          );

          this.broadcastMessage(task.agent, 'supervisor', 'TASK_FAILED_ESCALATED', {
            taskId: task.id,
            error: errorMsg,
          });

          // Cascade: mark downstream tasks as skipped
          this.skipDownstreamTasks(task.id, `Dependency ${task.id} failed`);
          this.notify();
          return;
        }
      }
    }
  }

  // Dispatch to the proper worker agent based on task.agent
  private async dispatchAgentAction(task: Task): Promise<any> {
    const ctx = this.executionContext;
    const t0 = performance.now();

    switch (task.agent) {
      case 'intake': {
        const rawText = task.inputs.rawInput || ctx.rawInput || '';
        const res: IntakeResult = await executeIntake(
          rawText,
          ctx.imageBase64,
          ctx.audioBase64
        );
        ctx.intake = res;
        ctx.customer = res.customer;
        ctx.totalBill = res.totalBill;
        ctx.paidAmount = res.paidAmount;
        ctx.statedPending = res.statedPending;
        ctx.items = res.items;

        this.recordAuditLog(
          'intake',
          'executeIntake',
          { rawText },
          { customer: res.customer.name, total: res.totalBill, confidence: res.confidence },
          Math.round(performance.now() - t0),
          'SUCCESS'
        );
        return res;
      }

      case 'auditor': {
        const total = ctx.totalBill ?? (task.inputs.total || 42000);
        const paid = ctx.paidAmount ?? (task.inputs.paid || 15000);
        const stated = ctx.statedPending ?? task.inputs.stated;
        const partyName = ctx.customer?.name || 'Party';

        const res: AuditorResult = await executeAuditor(total, paid, stated, partyName);
        ctx.auditor = res;
        ctx.computedUdhaar = res.computedUdhaar;
        ctx.statedUdhaar = res.statedUdhaar;
        ctx.hasMathAnomaly = res.hasMathAnomaly;
        ctx.mathDiscrepancy = res.mathDiscrepancy;

        this.recordAuditLog(
          'auditor',
          'audit_math',
          { total, paid, stated },
          { computed: res.computedUdhaar, discrepancy: res.mathDiscrepancy, anomaly: res.hasMathAnomaly },
          Math.round(performance.now() - t0),
          'SUCCESS'
        );
        return res;
      }

      case 'risk': {
        if (task.action === 'filter_overdue_parties') {
          const customers = db.getCustomers();
          const threshold = task.inputs.minUdhaar || 10000;
          const overdue = customers.filter((c) => c.current_balance >= threshold);
          ctx.overdueParties = overdue;
          return { count: overdue.length, parties: overdue };
        }

        const customer = ctx.customer || db.getCustomers()[0];
        const total = ctx.totalBill || 42000;
        // Use approved pending or auditor computed pending
        const pending = ctx.approvedPending ?? (ctx.computedUdhaar || 27000);

        const res: RiskAgentResult = await executeRiskAgent(customer, total, pending);
        ctx.risk = res;

        this.recordAuditLog(
          'risk',
          'calc_credit_risk',
          { customer: customer.name, total, pending },
          { exposure: res.exposurePercent, rating: res.riskRating, limitExceeded: res.creditLimitExceeded },
          Math.round(performance.now() - t0),
          'SUCCESS'
        );
        return res;
      }

      case 'ledger': {
        const customer: Customer = ctx.customer || db.getCustomers()[0];
        const items: VoucherItem[] = ctx.items || [];
        const totalAmount = ctx.totalBill || 42000;
        const paidAmount = ctx.paidAmount || 15000;
        // Use approved pending if user picked stated in approval modal, else computed
        const finalPending = ctx.approvedPending ?? (ctx.computedUdhaar || 27000);

        const voucherData: Partial<Voucher> = {
          date: new Date().toISOString().split('T')[0],
          partyId: customer.id,
          partyName: customer.name,
          partyBeat: customer.beat,
          partyGstin: customer.gstin,
          totalAmount,
          paidAmount,
          paymentMode: ctx.intake?.paymentMode || 'CASH',
          statedUdhaar: ctx.statedUdhaar ?? 29000,
          computedUdhaar: finalPending,
          hasMathAnomaly: Boolean(ctx.hasMathAnomaly),
          mathDiscrepancy: ctx.mathDiscrepancy || 0,
          anomalyDetails: ctx.auditor?.anomalyDetails,
          items,
          creditRisk: ctx.risk,
          hinglishSummary: ctx.auditor?.hinglishExplanation || `${customer.name}: हिसाब दर्ज किया गया।`,
          rawNote: ctx.rawInput,
          evidenceQuotes: ctx.intake?.evidenceQuotes,
          matchedCustomerName: customer.matchedName,
        };

        const res: LedgerCommitResult = await executeLedgerAgent({
          voucher: voucherData,
          items,
        });

        ctx.voucher = res.voucher;
        ctx.ledger = res;

        this.recordAuditLog(
          'ledger',
          'write_voucher',
          { voucherNumber: res.voucher.voucherNumber, idempotencyKey: res.voucher.idempotencyKey },
          { isDuplicate: res.isDuplicate, balanceLogged: res.voucher.computedUdhaar },
          Math.round(performance.now() - t0),
          'SUCCESS'
        );
        return res;
      }

      case 'collections': {
        if (task.action === 'draft_bulk_reminders') {
          const parties: Customer[] = ctx.overdueParties || db.getCustomers().filter((c) => c.current_balance >= 10000);
          const drafted = [];
          for (const p of parties) {
            const mockVoucher: Voucher = {
              id: `v-rem-${p.id}`,
              voucherNumber: `REM-${p.id}`,
              date: new Date().toISOString().split('T')[0],
              partyName: p.name,
              partyBeat: p.beat,
              partyGstin: p.gstin,
              dueDate: 'Immediate',
              totalAmount: p.current_balance,
              paidAmount: 0,
              paymentMode: 'UPI',
              statedUdhaar: p.current_balance,
              computedUdhaar: p.current_balance,
              hasMathAnomaly: false,
              mathDiscrepancy: 0,
              anomalyDetails: {
                statedBalance: p.current_balance,
                actualBalance: p.current_balance,
                discrepancyCaught: 0,
                explanation: 'Overdue reminder',
                riskClassification: 'CLEAN_SETTLEMENT',
              },
              items: [],
              creditRisk: {
                exposurePercent: 100,
                riskRating: 'HIGH_CREDIT_RISK',
                badgeText: 'OVERDUE BALANCE',
                cfoDirective: 'Send immediate payment reminder link.',
              },
              hinglishSummary: `${p.name} का बकाया ₹${p.current_balance.toLocaleString('en-IN')}`,
              whatsappParchiText: '',
            };
            const col = await executeCollectionsAgent(p, mockVoucher);
            drafted.push(col);
          }
          return { count: drafted.length, reminders: drafted };
        }

        const customer: Customer = ctx.customer || db.getCustomers()[0];
        const voucher: Voucher = ctx.voucher || db.getVouchers()[0];

        const res: CollectionsResult = await executeCollectionsAgent(customer, voucher);
        ctx.collections = res;

        this.recordAuditLog(
          'collections',
          'generate_upi_qr',
          { amount: voucher.computedUdhaar, vpa: db.getSettings().upiId },
          { upiUrl: res.upiUrl, whatsappOutboxId: res.outboxItem.id },
          Math.round(performance.now() - t0),
          'SUCCESS'
        );
        return res;
      }

      case 'reporter': {
        if (task.action === 'fetch_customer_statement') {
          const custId = ctx.customer?.id || 'cust-sharma';
          return await executeCustomerStatement(custId);
        }
        return await executeDailySummary();
      }

      default:
        throw new Error(`Unknown agent role: ${task.agent}`);
    }
  }

  // Evaluate human approval policy gates
  private async evaluatePolicyGates(task: Task, result: any): Promise<boolean> {
    // 1. Math Mismatch Gate (Auditor)
    if (task.agent === 'auditor' && result.hasMathAnomaly) {
      this.metrics.totalApprovalsRequested++;
      const req: ApprovalRequest = {
        id: `appr-math-${Date.now()}`,
        taskId: task.id,
        agent: 'auditor',
        type: 'MATH_MISMATCH',
        title: 'Math Discrepancy Detected in Field Note',
        description: `Note stated ₹${result.statedUdhaar.toLocaleString('en-IN')}, but arithmetic (₹${result.total.toLocaleString('en-IN')} - ₹${result.paid.toLocaleString('en-IN')}) is ₹${result.computedUdhaar.toLocaleString('en-IN')}. Caught ₹${result.mathDiscrepancy.toLocaleString('en-IN')} discrepancy.`,
        metadata: {
          total: result.total,
          paid: result.paid,
          statedUdhaar: result.statedUdhaar,
          computedUdhaar: result.computedUdhaar,
          discrepancy: result.mathDiscrepancy,
          items: this.executionContext.items,
        },
        options: [
          {
            label: `Use Computed ₹${result.computedUdhaar.toLocaleString('en-IN')} (Recommended)`,
            value: result.computedUdhaar,
            isRecommended: true,
          },
          {
            label: `Use Stated ₹${result.statedUdhaar.toLocaleString('en-IN')}`,
            value: result.statedUdhaar,
            isRecommended: false,
          },
        ],
        createdAt: Date.now(),
        status: 'PENDING',
      };
      this.pendingApprovals.push(req);
      return true;
    }

    // 2. High Credit Risk Gate (Risk)
    if (task.agent === 'risk' && result.requiresHumanApproval) {
      this.metrics.totalApprovalsRequested++;
      const req: ApprovalRequest = {
        id: `appr-risk-${Date.now()}`,
        taskId: task.id,
        agent: 'risk',
        type: result.creditLimitExceeded ? 'CREDIT_LIMIT_EXCEEDED' : 'HIGH_CREDIT_RISK',
        title: result.creditLimitExceeded
          ? 'Credit Limit Exceeded — Dispatch Blocked'
          : 'High Credit Risk Exposure (> 50%) — Approval Required',
        description: result.approvalReason || result.cfoDirective,
        metadata: {
          exposurePercent: result.exposurePercent,
          currentBalance: result.currentBalance,
          creditLimit: result.creditLimit,
          newTotalOutstanding: result.newTotalOutstanding,
          items: this.executionContext.items,
        },
        options: [
          {
            label: 'Authorize Dispatch with Owner Override',
            value: 'AUTHORIZE',
            isRecommended: false,
          },
          {
            label: 'Enforce Cash Payment First (Recommended)',
            value: 'REQUIRE_CASH',
            isRecommended: true,
          },
        ],
        createdAt: Date.now(),
        status: 'PENDING',
      };
      this.pendingApprovals.push(req);
      return true;
    }

    // 3. Outbound WhatsApp/UPI Dispatch Gate (Collections)
    if (task.agent === 'collections' && task.requires_approval) {
      this.metrics.totalApprovalsRequested++;
      const req: ApprovalRequest = {
        id: `appr-outbox-${Date.now()}`,
        taskId: task.id,
        agent: 'collections',
        type: 'OUTBOX_DISPATCH',
        title: 'Approve Outbound WhatsApp Parchi & Pre-filled UPI QR',
        description: 'Verify draft receipt before making it accessible for direct merchant dispatch to customer.',
        metadata: {
          whatsappText: result.whatsappParchiText,
          upiUrl: result.upiUrl,
          outboxId: result.outboxItem?.id,
          items: this.executionContext.items,
          total: this.executionContext.totalBill,
          paid: this.executionContext.paidAmount,
          computedUdhaar: this.executionContext.computedUdhaar,
          voucher: this.executionContext.voucher,
        },
        options: [
          {
            label: 'Approve & Release to Outbox (Recommended)',
            value: 'APPROVE',
            isRecommended: true,
          },
          {
            label: 'Cancel Outbox Message',
            value: 'CANCEL',
            isRecommended: false,
          },
        ],
        createdAt: Date.now(),
        status: 'PENDING',
      };
      this.pendingApprovals.push(req);
      return true;
    }

    // 4. Intake Gate: Customer match (< 0.85) or Unverified Numbers
    if (task.agent === 'intake' && result.needsConfirmation) {
      this.metrics.totalApprovalsRequested++;

      if (result.partySimilarity !== undefined && result.partySimilarity < 0.85) {
        const req: ApprovalRequest = {
          id: `appr-cust-${Date.now()}`,
          taskId: task.id,
          agent: 'intake',
          type: 'UNCERTAIN_INTAKE',
          title: 'Confirm Customer Match: As Heard -> Matched To',
          description: `As heard: "${result.asHeardPartyName}" -> Matched to: "${result.matchedPartyName}" (${Math.round(result.partySimilarity * 100)}% match similarity).`,
          metadata: {
            asHeard: result.asHeardPartyName,
            matchedTo: result.matchedPartyName,
            matchedId: result.customer.matchedId,
            evidence: result.customer.evidence,
            similarity: result.partySimilarity,
            items: result.items,
            total: result.totalBill,
            paid: result.paidAmount,
          },
          options: [
            {
              label: `Confirm match to "${result.matchedPartyName}" (Recommended)`,
              value: result.customer.matchedId,
              isRecommended: true,
            },
            {
              label: `Keep as new customer "${result.asHeardPartyName}"`,
              value: 'NEW_CUSTOMER',
              isRecommended: false,
            },
          ],
          createdAt: Date.now(),
          status: 'PENDING',
        };
        this.pendingApprovals.push(req);
        return true;
      }

      if (result.unverifiedNumbers && result.unverifiedNumbers.length > 0) {
        const numList = result.unverifiedNumbers
          .map((u: any) => `${u.field} (₹${Number(u.value).toLocaleString('en-IN')})`)
          .join(', ');
        const req: ApprovalRequest = {
          id: `appr-num-${Date.now()}`,
          taskId: task.id,
          agent: 'intake',
          type: 'UNCERTAIN_INTAKE',
          title: 'Number Verification Needed: Not Found in Text',
          description: `The extracted amount ${numList} was not found in your original speech/text note. Please confirm before the audit runs.`,
          metadata: {
            unverifiedNumbers: result.unverifiedNumbers,
            total: result.totalBill,
            paid: result.paidAmount,
            stated: result.statedPending,
          },
          options: [
            {
              label: 'Confirm values and proceed with audit (Recommended)',
              value: 'CONFIRM',
              isRecommended: true,
            },
            {
              label: 'Reject and re-enter request',
              value: 'REJECT',
              isRecommended: false,
            },
          ],
          createdAt: Date.now(),
          status: 'PENDING',
        };
        this.pendingApprovals.push(req);
        return true;
      }

      const req: ApprovalRequest = {
        id: `appr-intake-${Date.now()}`,
        taskId: task.id,
        agent: 'intake',
        type: 'UNCERTAIN_INTAKE',
        title: 'Confirm Customer Identification',
        description: `Matched "${result.customer.name}" with ${(result.confidence * 100).toFixed(0)}% confidence. Confirm customer khata.`,
        metadata: {
          customer: result.customer,
          confidence: result.confidence,
        },
        options: [
          {
            label: `Confirm "${result.customer.name}" (Recommended)`,
            value: result.customer.id,
            isRecommended: true,
          },
        ],
        createdAt: Date.now(),
        status: 'PENDING',
      };
      this.pendingApprovals.push(req);
      return true;
    }

    return false;
  }

  // Skip downstream tasks when a prerequisite permanently fails
  private skipDownstreamTasks(failedTaskId: string, reason: string) {
    if (!this.currentPlan) return;
    const tasks = this.currentPlan.tasks;

    const downstreamIds = new Set<string>();
    const findDownstream = (id: string) => {
      for (const t of tasks) {
        if (t.depends_on.includes(id) && !downstreamIds.has(t.id)) {
          downstreamIds.add(t.id);
          findDownstream(t.id);
        }
      }
    };
    findDownstream(failedTaskId);

    for (const t of tasks) {
      if (downstreamIds.has(t.id) && t.status === 'pending') {
        t.status = 'skipped';
        t.reason = `${t.reason} (Skipped: ${reason})`;
      }
    }
  }

  // Handle user decision on an approval request
  public async resolveApproval(approvalId: string, decision: 'APPROVE' | 'REJECT', chosenValue?: any): Promise<void> {
    const approval = this.pendingApprovals.find((a) => a.id === approvalId);
    if (!approval) return;

    approval.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    approval.resolvedAt = Date.now();
    approval.userDecision = chosenValue;

    if (!this.currentPlan) return;
    const task = this.currentPlan.tasks.find((t) => t.id === approval.taskId);

    if (decision === 'APPROVE') {
      if (task) {
        task.status = 'succeeded';
        this.metrics.totalTasksCompleted++;

        // Store user choice in execution context
        if (approval.type === 'MATH_MISMATCH') {
          this.executionContext.approvedPending = chosenValue;
        }

        this.broadcastMessage('user', task.agent, 'APPROVAL_GRANTED', {
          approvalId,
          taskId: task.id,
          decision,
          chosenValue,
        });
      }
    } else {
      if (task) {
        task.status = 'rejected';
        this.skipDownstreamTasks(task.id, 'User rejected approval gate');
        this.broadcastMessage('user', task.agent, 'APPROVAL_REJECTED', {
          approvalId,
          taskId: task.id,
        });
      }
    }

    // Remove resolved approval from pending list
    this.pendingApprovals = this.pendingApprovals.filter((a) => a.id !== approvalId);
    this.notify();

    // Resume execution
    await this.step();
  }
}

export const supervisor = new SupervisorStateMachine();
