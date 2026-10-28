import { tools } from '../tools';
import { AuditMathResult } from '../tools/auditMath';

export interface AuditorResult extends AuditMathResult {
  hinglishExplanation: string;
  recommendedApprovalAction: 'USE_COMPUTED' | 'USE_STATED' | 'NONE';
}

/**
 * Auditor Agent: HYBRID.
 * Calls deterministic tool `audit_math(total, paid, stated_pending)`.
 * Math is NEVER done by the LLM.
 * The agent generates a natural Hinglish explanation of the deterministic result.
 */
export async function executeAuditor(
  totalBill: number,
  paidAmount: number,
  statedPending?: number | null,
  partyName?: string
): Promise<AuditorResult> {
  // 1. Deterministic math tool execution
  const mathResult = await tools.audit_math(totalBill, paidAmount, statedPending);

  // 2. Hinglish narrative generation (can use server or deterministic template)
  let hinglishExplanation = '';
  const party = partyName || 'पार्टी';

  if (mathResult.hasMathAnomaly) {
    if (mathResult.mathDiscrepancy > 0) {
      hinglishExplanation = `${party}: कुल बिल ₹${mathResult.total.toLocaleString('en-IN')}, प्राप्त ₹${mathResult.paid.toLocaleString('en-IN')}, असली बकाया ₹${mathResult.computedUdhaar.toLocaleString('en-IN')} बनता है। पर्ची में ₹${mathResult.statedUdhaar.toLocaleString('en-IN')} लिखा गया था। ₹${mathResult.mathDiscrepancy.toLocaleString('en-IN')} का ओवरस्टेटमेंट पकड़ा गया।`;
    } else {
      hinglishExplanation = `${party}: कुल बिल ₹${mathResult.total.toLocaleString('en-IN')}, प्राप्त ₹${mathResult.paid.toLocaleString('en-IN')}। पर्ची में बकाया ₹${mathResult.statedUdhaar.toLocaleString('en-IN')} कम दर्शाया गया है, जबकि हिसाब से ₹${mathResult.computedUdhaar.toLocaleString('en-IN')} बकाया है।`;
    }
  } else {
    hinglishExplanation = `${party}: कुल बिल ₹${mathResult.total.toLocaleString('en-IN')}, प्राप्त ₹${mathResult.paid.toLocaleString('en-IN')}, असली बकाया ₹${mathResult.computedUdhaar.toLocaleString('en-IN')}। हिसाब 100% सही और सत्यापित है।`;
  }

  return {
    ...mathResult,
    hinglishExplanation,
    recommendedApprovalAction: mathResult.hasMathAnomaly ? 'USE_COMPUTED' : 'NONE',
  };
}
