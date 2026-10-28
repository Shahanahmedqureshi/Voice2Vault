import { tools } from '../tools';
import { db } from '../store/db';
import { Customer, LedgerEntry } from '../types/entities';

export interface DailyReportResult {
  date: string;
  totalVouchers: number;
  totalTurnover: number;
  cashRealized: number;
  totalUdhaarPending: number;
  anomaliesCaught: number;
  highRiskParties: string[];
  summaryNarrative: string;
}

export interface CustomerStatementResult {
  customer: Customer;
  currentBalance: number;
  creditLimit: number;
  entries: LedgerEntry[];
  summaryNarrative: string;
}

/**
 * Reporter Agent: Generates daily collection summaries, mandi ledger tallies, and customer statements.
 */
export async function executeDailySummary(): Promise<DailyReportResult> {
  const summary = await tools.generate_daily_summary();

  const narrative = `दैनिक मंडी हिसाब रिपोर्ट (${summary.date}): कुल वाउचर: ${summary.totalVouchers}, कुल व्यापार: ₹${summary.totalTurnover.toLocaleString('en-IN')}, रोकड़/UPI प्राप्त: ₹${summary.cashRealized.toLocaleString('en-IN')}, कुल बाकी उधारी: ₹${summary.totalUdhaarPending.toLocaleString('en-IN')}। आज ${summary.anomaliesCaught} गणित विसंगतियां पकड़ी गईं।`;

  return {
    ...summary,
    summaryNarrative: narrative,
  };
}

export async function executeCustomerStatement(customerId: string): Promise<CustomerStatementResult> {
  const customer = db.getCustomerById(customerId) || db.getCustomers()[0];
  const allEntries = db.getLedgerEntries();
  const customerEntries = allEntries.filter((e) => e.partyId === customer.id || e.partyName === customer.name);

  const narrative = `${customer.name} (${customer.beat}): वर्तमान कुल बकाया उधारी ₹${customer.current_balance.toLocaleString('en-IN')} (क्रेडिट सीमा ₹${customer.credit_limit.toLocaleString('en-IN')})। कुल ${customerEntries.length} ट्रांजैक्शन दर्ज हैं।`;

  return {
    customer,
    currentBalance: customer.current_balance,
    creditLimit: customer.credit_limit,
    entries: customerEntries,
    summaryNarrative: narrative,
  };
}
