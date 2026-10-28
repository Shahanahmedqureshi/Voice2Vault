import { audit_math } from './auditMath';
import { calc_credit_risk } from './creditRisk';
import { Customer } from '../types/entities';

export interface UnitTestResult {
  name: string;
  passed: boolean;
  actual: any;
  expected: any;
  message: string;
}

/**
 * Runs unit tests on pure financial and credit calculation functions.
 * Validates the core prompt requirement:
 * 42000 - 15000 = 27000, stated 29000 => mismatch of 2000, flagged.
 */
export function runPureFunctionTests(): UnitTestResult[] {
  const results: UnitTestResult[] = [];

  // Test 1: Core prompt benchmark (42,000 total, 15,000 paid, 29,000 stated)
  {
    const mathResult = audit_math(42000, 15000, 29000);
    const passed =
      mathResult.computedUdhaar === 27000 &&
      mathResult.mathDiscrepancy === 2000 &&
      mathResult.hasMathAnomaly === true &&
      mathResult.anomalyDetails.riskClassification === 'HIGH_RISK_OVERSTATEMENT';

    results.push({
      name: 'audit_math: 42000 bill - 15000 paid vs 29000 stated (caught 2000 overstatement)',
      passed,
      actual: {
        computed: mathResult.computedUdhaar,
        discrepancy: mathResult.mathDiscrepancy,
        hasAnomaly: mathResult.hasMathAnomaly,
      },
      expected: {
        computed: 27000,
        discrepancy: 2000,
        hasAnomaly: true,
      },
      message: passed
        ? 'Pass: Correctly caught ₹2,000 math discrepancy'
        : 'Fail: Calculation failed to match expected output',
    });
  }

  // Test 2: Clean settlement (15,000 total, 12,000 paid, 3,000 stated)
  {
    const cleanResult = audit_math(15000, 12000, 3000);
    const passed =
      cleanResult.computedUdhaar === 3000 &&
      cleanResult.mathDiscrepancy === 0 &&
      cleanResult.hasMathAnomaly === false;

    results.push({
      name: 'audit_math: 15000 bill - 12000 paid vs 3000 stated (clean settlement)',
      passed,
      actual: {
        computed: cleanResult.computedUdhaar,
        discrepancy: cleanResult.mathDiscrepancy,
        hasAnomaly: cleanResult.hasMathAnomaly,
      },
      expected: {
        computed: 3000,
        discrepancy: 0,
        hasAnomaly: false,
      },
      message: passed ? 'Pass: Clean settlement verified' : 'Fail: Clean settlement failed',
    });
  }

  // Test 3: Understatement anomaly (10,000 total, 2,000 paid, 5,000 stated)
  {
    const underResult = audit_math(10000, 2000, 5000);
    const passed =
      underResult.computedUdhaar === 8000 &&
      underResult.mathDiscrepancy === -3000 &&
      underResult.hasMathAnomaly === true &&
      underResult.anomalyDetails.riskClassification === 'UNDERSTATEMENT';

    results.push({
      name: 'audit_math: 10000 bill - 2000 paid vs 5000 stated (caught understatement)',
      passed,
      actual: {
        computed: underResult.computedUdhaar,
        discrepancy: underResult.mathDiscrepancy,
      },
      expected: {
        computed: 8000,
        discrepancy: -3000,
      },
      message: passed ? 'Pass: Caught ₹3,000 understatement' : 'Fail: Understatement failed',
    });
  }

  // Test 4: calc_credit_risk high exposure ratio (> 50%)
  {
    const mockCustomer: Customer = {
      id: 'cust-sharma',
      name: 'Sharma Kirana Store',
      phone: '+91 98260 11029',
      beat: 'Vijay Nagar, Indore',
      gstin: '23AABCS1429B1Z5',
      credit_limit: 50000,
      current_balance: 10000,
    };

    const riskResult = calc_credit_risk(mockCustomer, 42000, 27000, {
      riskExposureThresholdPercent: 50,
    });
    // 27000 / 42000 = 64.3% > 50%
    const passed =
      riskResult.exposurePercent === 64.3 &&
      riskResult.riskRating === 'HIGH_CREDIT_RISK';

    results.push({
      name: 'calc_credit_risk: Exposure ratio 64.3% triggers HIGH_CREDIT_RISK',
      passed,
      actual: {
        exposure: riskResult.exposurePercent,
        rating: riskResult.riskRating,
      },
      expected: {
        exposure: 64.3,
        rating: 'HIGH_CREDIT_RISK',
      },
      message: passed ? 'Pass: Correctly flagged high exposure' : 'Fail: High exposure not flagged',
    });
  }

  // Test 5: calc_credit_risk credit limit exceeded
  {
    const mockCustomer: Customer = {
      id: 'cust-overlimit',
      name: 'Overlimit Traders',
      phone: '+91 98260 99999',
      beat: 'Siyaganj, Indore',
      gstin: '23AAICB4810K1Z4',
      credit_limit: 30000,
      current_balance: 25000,
    };

    const riskResult = calc_credit_risk(mockCustomer, 20000, 10000);
    // new balance = 25000 + 10000 = 35000 > 30000 limit
    const passed =
      riskResult.creditLimitExceeded === true &&
      riskResult.newTotalOutstanding === 35000 &&
      riskResult.riskRating === 'HIGH_CREDIT_RISK';

    results.push({
      name: 'calc_credit_risk: Total outstanding exceeds credit limit (35000 > 30000)',
      passed,
      actual: {
        exceeded: riskResult.creditLimitExceeded,
        newTotal: riskResult.newTotalOutstanding,
      },
      expected: {
        exceeded: true,
        newTotal: 35000,
      },
      message: passed ? 'Pass: Correctly blocked over-limit dispatch' : 'Fail: Over-limit failed',
    });
  }

  return results;
}
