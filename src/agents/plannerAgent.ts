import { TaskPlan, Task } from '../types/agent';
import { db } from '../store/db';

export function getTemplatePlanForIntent(
  intent: 'record_sale' | 'check_balance' | 'send_reminder' | 'daily_summary',
  rawInput: string
): TaskPlan {
  switch (intent) {
    case 'record_sale':
      return {
        goal: 'Ingest dispatch note, audit arithmetic, verify credit risk, record ledger entry, and prepare settlement outbox',
        intent: 'record_sale',
        isFallbackPlan: true,
        tasks: [
          {
            id: 't1_intake',
            agent: 'intake',
            action: 'extract_entities',
            inputs: { rawInput },
            depends_on: [],
            requires_approval: false,
            reason: 'Parse customer, line items, total bill, paid cash, and stated pending from field note',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't2_auditor',
            agent: 'auditor',
            action: 'audit_arithmetic',
            inputs: {},
            depends_on: ['t1_intake'],
            requires_approval: true, // Will pause if math discrepancy detected
            reason: 'Deterministic arithmetic audit: verify Total - Paid == Stated Pending',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't3_risk',
            agent: 'risk',
            action: 'evaluate_credit_risk',
            inputs: {},
            depends_on: ['t2_auditor'],
            requires_approval: true, // Will pause if exposure > 50% or over credit limit
            reason: 'Assess customer credit exposure ratio and outstanding limit',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't4_ledger',
            agent: 'ledger',
            action: 'commit_voucher_and_inventory',
            inputs: {},
            depends_on: ['t3_risk'],
            requires_approval: false,
            reason: 'Idempotent write to master ledger and deduct warehouse stock',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't5_collections',
            agent: 'collections',
            action: 'prepare_settlement_outbox',
            inputs: {},
            depends_on: ['t4_ledger'],
            requires_approval: true, // Always require approval before finalizing message
            reason: 'Generate pre-filled UPI QR and draft Hinglish WhatsApp dispatch parchi',
            status: 'pending',
            retryCount: 0,
          },
        ],
      };

    case 'check_balance':
      return {
        goal: 'Lookup customer account in ledger and report current outstanding balance',
        intent: 'check_balance',
        isFallbackPlan: true,
        tasks: [
          {
            id: 't1_search',
            agent: 'intake',
            action: 'search_customer_khata',
            inputs: { rawInput },
            depends_on: [],
            requires_approval: false,
            reason: 'Fuzzy match customer name against master directory',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't2_statement',
            agent: 'reporter',
            action: 'fetch_customer_statement',
            inputs: {},
            depends_on: ['t1_search'],
            requires_approval: false,
            reason: 'Aggregate debit/credit history and compute current outstanding',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't3_upi',
            agent: 'collections',
            action: 'generate_settlement_qr',
            inputs: {},
            depends_on: ['t2_statement'],
            requires_approval: false,
            reason: 'Create quick payment QR for current balance',
            status: 'pending',
            retryCount: 0,
          },
        ],
      };

    case 'send_reminder':
      return {
        goal: 'Identify overdue credit balances exceeding threshold and draft payment reminder outbox',
        intent: 'send_reminder',
        isFallbackPlan: true,
        tasks: [
          {
            id: 't1_filter',
            agent: 'risk',
            action: 'filter_overdue_parties',
            inputs: { minUdhaar: 10000 },
            depends_on: [],
            requires_approval: false,
            reason: 'Scan customer accounts for outstanding balance > ₹10,000',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't2_draft_reminders',
            agent: 'collections',
            action: 'draft_bulk_reminders',
            inputs: {},
            depends_on: ['t1_filter'],
            requires_approval: true,
            reason: 'Draft personalized Hinglish WhatsApp reminders with pre-filled UPI links (Requires human approval)',
            status: 'pending',
            retryCount: 0,
          },
        ],
      };

    case 'daily_summary':
    default:
      return {
        goal: 'Generate comprehensive daily mandi accounting tally and collections summary',
        intent: 'daily_summary',
        isFallbackPlan: true,
        tasks: [
          {
            id: 't1_tally',
            agent: 'reporter',
            action: 'aggregate_daily_ledger',
            inputs: { date: new Date().toISOString().split('T')[0] },
            depends_on: [],
            requires_approval: false,
            reason: 'Calculate total turnover, realized cash/UPI, and pending udhaar for today',
            status: 'pending',
            retryCount: 0,
          },
          {
            id: 't2_risk_audit',
            agent: 'risk',
            action: 'highlight_receivables_risk',
            inputs: {},
            depends_on: ['t1_tally'],
            requires_approval: false,
            reason: 'Identify high exposure debtors and math audit discrepancies caught today',
            status: 'pending',
            retryCount: 0,
          },
        ],
      };
  }
}

// Heuristic Intent Detection
export function detectIntent(text: string): 'record_sale' | 'check_balance' | 'send_reminder' | 'daily_summary' {
  const lower = (text || '').toLowerCase();
  if (lower.includes('balance') || lower.includes('outstanding') || lower.includes('batao') || lower.includes('khata')) {
    return 'check_balance';
  }
  if (lower.includes('reminder') || lower.includes('bhejo') || lower.includes('upar') || lower.includes('10000')) {
    return 'send_reminder';
  }
  if (lower.includes('summary') || lower.includes('aaj ka') || lower.includes('report') || lower.includes('din bhar')) {
    return 'daily_summary';
  }
  return 'record_sale';
}

/**
 * Planner Agent: Generates a validated multi-task DAG plan.
 * Connects to `/api/planner` with fallback to local hybrid planner.
 */
export async function planBusinessRequest(
  requestText: string,
  imageBase64?: string,
  audioBase64?: string
): Promise<TaskPlan> {
  const detected = detectIntent(requestText);
  const settings = db.getSettings();

  // Model rate-limit error simulation
  if (settings.injectModelRateLimit) {
    db.updateSettings({ injectModelRateLimit: false });
    throw new Error('MODEL_RATE_LIMIT_429: Simulated Gemma API Rate Limit Exceeded. Supervisor will retry with backoff.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: requestText,
        detectedIntent: detected,
        hasImage: Boolean(imageBase64),
        hasAudio: Boolean(audioBase64),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.plan?.tasks && Array.isArray(data.plan.tasks) && data.plan.tasks.length > 0) {
        // Validate DAG structure
        const tasks: Task[] = data.plan.tasks.map((t: any, i: number) => ({
          id: t.id || `t${i + 1}`,
          agent: t.agent || 'intake',
          action: t.action || 'execute',
          inputs: t.inputs || {},
          depends_on: Array.isArray(t.depends_on) ? t.depends_on : [],
          requires_approval: Boolean(t.requires_approval),
          reason: t.reason || 'Task in execution pipeline',
          status: 'pending',
          retryCount: 0,
        }));

        return {
          goal: data.plan.goal || 'Execute business request',
          intent: data.plan.intent || detected,
          tasks,
          isFallbackPlan: false,
        };
      }
    }
  } catch (err) {
    console.warn('Planner API call fallback:', err);
  }

  // Fallback to validated template plan for detected intent
  return getTemplatePlanForIntent(detected, requestText);
}
