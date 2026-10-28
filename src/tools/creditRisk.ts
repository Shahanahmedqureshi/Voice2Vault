import { Customer, CreditRisk, AppSettings } from '../types/entities';

export interface CreditRiskResult extends CreditRisk {
  customer: Customer;
  currentBalance: number;
  newPending: number;
  newTotalOutstanding: number;
  exposurePercent: number;
  creditLimit: number;
  creditLimitExceeded: boolean;
  thresholdPercent: number;
}

/**
 * Pure deterministic credit risk calculator.
 * Exposure ratio = pending / total_bill (or new pending / customer limit)
 * Compares total balance vs customer credit_limit.
 * Thresholds configurable via settings.
 */
export function calc_credit_risk(
  customer: Customer,
  totalBill: number,
  newPending: number,
  settings?: Partial<AppSettings>
): CreditRiskResult {
  const thresholdPercent = settings?.riskExposureThresholdPercent ?? 50.0;
  const cleanTotal = Math.max(1, Number(totalBill) || 1);
  const cleanPending = Math.max(0, Number(newPending) || 0);

  const exposurePercent = Number(((cleanPending / cleanTotal) * 100).toFixed(1));
  const currentBalance = customer.current_balance || 0;
  const creditLimit = customer.credit_limit || 50000;
  const newTotalOutstanding = currentBalance + cleanPending;

  const creditLimitExceeded = newTotalOutstanding > creditLimit;

  let riskRating: CreditRisk['riskRating'] = 'LOW';
  let badgeText = 'LOW CREDIT RISK';
  let cfoDirective = 'Standard 7-day payment window authorized. Good credit standing.';

  if (creditLimitExceeded || exposurePercent >= thresholdPercent) {
    riskRating = 'HIGH_CREDIT_RISK';
    badgeText = creditLimitExceeded
      ? 'CREDIT LIMIT EXCEEDED'
      : `HIGH EXPOSURE (${exposurePercent}%)`;
    cfoDirective = creditLimitExceeded
      ? `Credit limit of ₹${creditLimit.toLocaleString('en-IN')} exceeded (New balance: ₹${newTotalOutstanding.toLocaleString('en-IN')}). Strictly collect prior dues before dispatch.`
      : `High exposure ratio (${exposurePercent}% >= ${thresholdPercent}%). Require immediate cash collection before booking next shipment.`;
  } else if (exposurePercent >= 30.0 || newTotalOutstanding >= creditLimit * 0.75) {
    riskRating = 'MODERATE';
    badgeText = 'MODERATE CREDIT RISK';
    cfoDirective = 'Monitor customer receivables. Settle current balance within 3 business days.';
  }

  return {
    customer,
    currentBalance,
    newPending: cleanPending,
    newTotalOutstanding,
    exposurePercent,
    creditLimit,
    creditLimitExceeded,
    thresholdPercent,
    riskRating,
    badgeText,
    cfoDirective,
  };
}
