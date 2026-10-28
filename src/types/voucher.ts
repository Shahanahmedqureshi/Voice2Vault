export interface VoucherItem {
  sr: number;
  particulars: string;
  qty: number;
  unit: string;
  estRate: number;
  lineTotal: number;
  godownAction: string;
}

export interface AnomalyDetails {
  statedBalance: number;
  actualBalance: number;
  discrepancyCaught: number;
  explanation: string;
  riskClassification: 'HIGH_RISK_OVERSTATEMENT' | 'UNDERSTATEMENT' | 'CLEAN_SETTLEMENT';
}

export interface CreditRisk {
  exposurePercent: number;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH_CREDIT_RISK';
  badgeText: string;
  cfoDirective: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  date: string;
  partyName: string;
  partyBeat: string;
  partyGstin: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'PHONEPE' | 'BANK_TRANSFER' | 'CHEQUE' | 'UNPAID';
  statedUdhaar: number;
  computedUdhaar: number;
  hasMathAnomaly: boolean;
  mathDiscrepancy: number;
  anomalyDetails: AnomalyDetails;
  items: VoucherItem[];
  creditRisk: CreditRisk;
  hinglishSummary: string;
  whatsappParchiText: string;
  rawNote?: string;
  engineUsed?: string;
  latencySeconds?: number;
  evidenceQuotes?: Record<string, string | null>;
  matchedCustomerName?: string;
}
