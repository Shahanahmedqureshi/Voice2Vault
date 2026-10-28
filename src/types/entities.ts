export interface Customer {
  id: string;
  name: string;
  phone: string;
  beat: string;
  gstin: string;
  credit_limit: number;
  current_balance: number;
  matchedName?: string;
  matchedId?: string;
  evidence?: string | null;
  similarity?: number;
}

export interface PriceListItem {
  sku: string;
  name: string;
  unit: string;
  rate: number;
  category: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  unit: string;
  stock: number;
  reorder_point: number;
  godown: string;
}

export interface VoucherItem {
  sr: number;
  sku?: string;
  particulars: string;
  qty: number;
  unit: string;
  estRate: number;
  isEstimatedRate?: boolean;
  lineTotal: number;
  godownAction?: string;
  evidence?: string | null;
  matchedSkuName?: string;
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
  creditLimitExceeded?: boolean;
  creditLimit?: number;
  newTotalOutstanding?: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  date: string;
  partyId?: string;
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
  idempotencyKey?: string;
  evidenceQuotes?: Record<string, string | null>;
  matchedCustomerName?: string;
}

export interface LedgerEntry {
  id: string;
  voucherId: string;
  voucherNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  debit: number;   // Sale / Udhaar added
  credit: number;  // Paid amount realized
  balance: number; // Balance after this transaction
  narration: string;
}

export interface OutboxItem {
  id: string;
  voucherId: string;
  partyName: string;
  phone: string;
  messageType: 'WHATSAPP_PARCHI' | 'UPI_COLLECTION_REQUEST';
  content: string;
  upiUrl?: string;
  status: 'DRAFT' | 'APPROVED' | 'SENT';
  createdAt: string;
}

export interface AppSettings {
  upiId: string;
  upiPayeeName: string;
  riskExposureThresholdPercent: number;
  defaultCreditLimit: number;
  injectToolFailure: boolean;
  injectModelRateLimit: boolean;
  injectBadInput: boolean;
}
