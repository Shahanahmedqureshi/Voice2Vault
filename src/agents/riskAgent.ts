import { tools } from '../tools';
import { CreditRiskResult } from '../tools/creditRisk';
import { Customer } from '../types/entities';

export interface RiskAgentResult extends CreditRiskResult {
  requiresHumanApproval: boolean;
  approvalReason?: string;
}

/**
 * Risk Agent: Assesses customer credit exposure ratio and credit limit compliance.
 * Triggers supervisor approval if risk is HIGH or limit is exceeded.
 */
export async function executeRiskAgent(
  customer: Customer,
  totalBill: number,
  newPending: number
): Promise<RiskAgentResult> {
  const result = await tools.calc_credit_risk(customer.id, totalBill, newPending);

  const requiresHumanApproval =
    result.riskRating === 'HIGH_CREDIT_RISK' || result.creditLimitExceeded;

  let approvalReason: string | undefined;
  if (result.creditLimitExceeded) {
    approvalReason = `Customer balance would exceed credit limit: ₹${result.newTotalOutstanding.toLocaleString('en-IN')} > ₹${result.creditLimit.toLocaleString('en-IN')}`;
  } else if (result.riskRating === 'HIGH_CREDIT_RISK') {
    approvalReason = `High credit exposure ratio: ${result.exposurePercent}% of bill is unpaid (threshold: ${result.thresholdPercent}%)`;
  }

  return {
    ...result,
    requiresHumanApproval,
    approvalReason,
  };
}
