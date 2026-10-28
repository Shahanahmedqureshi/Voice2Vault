import { AnomalyDetails } from '../types/entities';

export interface AuditMathResult {
  total: number;
  paid: number;
  statedUdhaar: number;
  computedUdhaar: number;
  hasMathAnomaly: boolean;
  mathDiscrepancy: number; // stated - computed
  anomalyDetails: AnomalyDetails;
}

/**
 * Pure deterministic arithmetic audit function.
 * Math is NEVER done by the LLM.
 * Formula: Computed Pending = Total - Paid
 * Discrepancy = Stated Pending - Computed Pending
 */
export function audit_math(
  total: number,
  paid: number,
  stated_pending?: number | null
): AuditMathResult {
  const cleanTotal = Math.max(0, Number(total) || 0);
  const cleanPaid = Math.max(0, Number(paid) || 0);
  const computedUdhaar = Math.max(0, cleanTotal - cleanPaid);

  const cleanStated =
    stated_pending !== undefined && stated_pending !== null && !isNaN(Number(stated_pending))
      ? Number(stated_pending)
      : computedUdhaar;

  const mathDiscrepancy = cleanStated - computedUdhaar;
  const hasMathAnomaly = Math.abs(mathDiscrepancy) > 0.001;

  let riskClassification: AnomalyDetails['riskClassification'] = 'CLEAN_SETTLEMENT';
  let explanation = `Arithmetic Verified: ₹${cleanTotal.toLocaleString('en-IN')} Total - ₹${cleanPaid.toLocaleString('en-IN')} Paid = ₹${computedUdhaar.toLocaleString('en-IN')} Due.`;

  if (hasMathAnomaly) {
    if (mathDiscrepancy > 0) {
      riskClassification = 'HIGH_RISK_OVERSTATEMENT';
      explanation = `Math Mismatch Caught: Note stated ₹${cleanStated.toLocaleString('en-IN')}, but arithmetic (₹${cleanTotal.toLocaleString('en-IN')} - ₹${cleanPaid.toLocaleString('en-IN')}) is ₹${computedUdhaar.toLocaleString('en-IN')}. Caught ₹${mathDiscrepancy.toLocaleString('en-IN')} overstatement error.`;
    } else {
      riskClassification = 'UNDERSTATEMENT';
      explanation = `Math Mismatch Caught: Note understated pending balance by ₹${Math.abs(mathDiscrepancy).toLocaleString('en-IN')} (Stated: ₹${cleanStated.toLocaleString('en-IN')}, Computed: ₹${computedUdhaar.toLocaleString('en-IN')}).`;
    }
  }

  return {
    total: cleanTotal,
    paid: cleanPaid,
    statedUdhaar: cleanStated,
    computedUdhaar,
    hasMathAnomaly,
    mathDiscrepancy,
    anomalyDetails: {
      statedBalance: cleanStated,
      actualBalance: computedUdhaar,
      discrepancyCaught: Math.abs(mathDiscrepancy),
      explanation,
      riskClassification,
    },
  };
}
