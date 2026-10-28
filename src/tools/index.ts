import { db } from '../store/db';
import { audit_math, AuditMathResult } from './auditMath';
import { calc_credit_risk, CreditRiskResult } from './creditRisk';
import {
  Customer,
  PriceListItem,
  InventoryItem,
  Voucher,
  VoucherItem,
  LedgerEntry,
  OutboxItem,
} from '../types/entities';
import QRCode from 'qrcode';

// Helper for simulated realistic latency
function simulateLatency(min = 200, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simple hash for idempotency
export function computeIdempotencyKey(
  customerId: string,
  date: string,
  total: number,
  items: VoucherItem[]
): string {
  const itemsStr = (items || [])
    .map((i) => `${i.particulars}_${i.qty}_${i.estRate || 0}`)
    .sort()
    .join('|');
  return `idem_${customerId}_${date}_${total}_${btoa(itemsStr).slice(0, 16)}`;
}

// Tool Definitions with JSON Schemas
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const REGISTERED_TOOLS: ToolDefinition[] = [
  {
    name: 'lookup_price',
    description: 'Look up the official wholesale rate for an item SKU or name in the merchant price list. Never invent rates.',
    parameters: {
      type: 'object',
      properties: {
        skuOrName: { type: 'string', description: 'Item SKU or approximate name' },
      },
      required: ['skuOrName'],
    },
  },
  {
    name: 'search_customer',
    description: 'Fuzzy match a customer name against the master customer directory and return best match with confidence score.',
    parameters: {
      type: 'object',
      properties: {
        nameQuery: { type: 'string', description: 'Raw customer name from field note' },
      },
      required: ['nameQuery'],
    },
  },
  {
    name: 'audit_math',
    description: 'Perform deterministic arithmetic audit on total bill, paid amount, and stated pending udhaar.',
    parameters: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total bill amount in INR' },
        paid: { type: 'number', description: 'Amount received/paid in INR' },
        stated_pending: { type: 'number', description: 'Claimed balance in INR' },
      },
      required: ['total', 'paid'],
    },
  },
  {
    name: 'calc_credit_risk',
    description: 'Calculate customer credit risk based on exposure ratio, total balance, and credit limit.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'Customer unique ID' },
        totalBill: { type: 'number', description: 'Total bill amount' },
        newPending: { type: 'number', description: 'Audited new pending udhaar' },
      },
      required: ['customerId', 'totalBill', 'newPending'],
    },
  },
  {
    name: 'write_voucher',
    description: 'Record audited transaction voucher into the persistent ledger with idempotency deduplication.',
    parameters: {
      type: 'object',
      properties: {
        voucher: { type: 'object', description: 'Full audited voucher payload' },
      },
      required: ['voucher'],
    },
  },
  {
    name: 'update_inventory',
    description: 'Deduct dispatched quantities from warehouse inventory bins.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              qty: { type: 'number' },
            },
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'generate_upi_qr',
    description: 'Generate standardized NPCI UPI collection URI and high-density QR code client-side.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Pending collection amount in INR' },
        note: { type: 'string', description: 'Transaction narration / voucher ref' },
        customUpiId: { type: 'string', description: 'Optional merchant VPA override' },
      },
      required: ['amount', 'note'],
    },
  },
  {
    name: 'draft_whatsapp',
    description: 'Draft Hinglish WhatsApp dispatch parchi and direct click-to-chat wa.me link.',
    parameters: {
      type: 'object',
      properties: {
        voucher: { type: 'object', description: 'Audited voucher' },
      },
      required: ['voucher'],
    },
  },
  {
    name: 'generate_daily_summary',
    description: 'Generate aggregated daily cash/UPI collections and pending udhaar tally from master ledger.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      },
    },
  },
];

// Tool Implementation Functions
export const tools = {
  // 1. Lookup price
  async lookup_price(skuOrName: string): Promise<{
    found: boolean;
    item?: PriceListItem;
    rate?: number;
    isEstimated: boolean;
  }> {
    await simulateLatency(200, 400);
    const item = db.lookupPrice(skuOrName);
    if (item) {
      return { found: true, item, rate: item.rate, isEstimated: false };
    }
    return { found: false, isEstimated: true };
  },

  // 2. Fuzzy customer search
  async search_customer(nameQuery: string): Promise<{
    customer: Customer;
    confidence: number;
    needsConfirmation: boolean;
  }> {
    await simulateLatency(200, 350);
    const customers = db.getCustomers();
    const query = (nameQuery || '').toLowerCase().trim();

    let bestMatch: Customer = customers[0];
    let maxScore = 0;

    for (const cust of customers) {
      const name = cust.name.toLowerCase();
      let score = 0;

      if (name === query) {
        score = 1.0;
      } else if (name.includes(query) || query.includes(name)) {
        score = 0.85;
      } else {
        const queryTokens = query.split(/\s+/);
        const nameTokens = name.split(/\s+/);
        let matches = 0;
        for (const token of queryTokens) {
          if (token.length > 2 && nameTokens.some((nt) => nt.includes(token) || token.includes(nt))) {
            matches++;
          }
        }
        score = matches > 0 ? 0.7 + (matches / queryTokens.length) * 0.2 : 0.3;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = cust;
      }
    }

    return {
      customer: bestMatch,
      confidence: Number(maxScore.toFixed(2)),
      needsConfirmation: maxScore < 0.8,
    };
  },

  // 3. Deterministic math audit
  async audit_math(
    total: number,
    paid: number,
    stated_pending?: number | null
  ): Promise<AuditMathResult> {
    await simulateLatency(150, 300);
    return audit_math(total, paid, stated_pending);
  },

  // 4. Deterministic credit risk
  async calc_credit_risk(
    customerId: string,
    totalBill: number,
    newPending: number
  ): Promise<CreditRiskResult> {
    await simulateLatency(200, 350);
    const customer = db.getCustomerById(customerId) || db.getCustomers()[0];
    const settings = db.getSettings();
    return calc_credit_risk(customer, totalBill, newPending, settings);
  },

  // 5. Write Voucher with Idempotency & Failure Injection
  async write_voucher(voucherData: Partial<Voucher>): Promise<{
    success: boolean;
    voucher: Voucher;
    isDuplicate: boolean;
    ledgerEntry?: LedgerEntry;
  }> {
    await simulateLatency(300, 600);

    const settings = db.getSettings();
    // Demo Failure Injection check
    if (settings.injectToolFailure) {
      // Auto-clear injection so the next retry succeeds!
      db.updateSettings({ injectToolFailure: false });
      throw new Error('SIMULATED_DB_TIMEOUT: Godown write connection dropped (Demo Injected Failure). Supervisor will auto-retry.');
    }

    const vouchers = db.getVouchers();
    const voucherNumber = voucherData.voucherNumber || `V2V-10${vouchers.length + 5}`;
    const date = voucherData.date || new Date().toISOString().split('T')[0];
    const partyName = voucherData.partyName || 'Sharma Kirana & General Store';
    const totalAmount = Number(voucherData.totalAmount) || 0;
    const paidAmount = Number(voucherData.paidAmount) || 0;
    const computedUdhaar = voucherData.computedUdhaar !== undefined
      ? voucherData.computedUdhaar
      : Math.max(0, totalAmount - paidAmount);

    const idempotencyKey =
      voucherData.idempotencyKey ||
      computeIdempotencyKey(
        voucherData.partyId || partyName,
        date,
        totalAmount,
        voucherData.items || []
      );

    const fullVoucher: Voucher = {
      id: voucherData.id || `v2v-${Date.now()}`,
      voucherNumber,
      date,
      partyId: voucherData.partyId || 'cust-sharma',
      partyName,
      partyBeat: voucherData.partyBeat || 'Vijay Nagar Scheme 54, Indore',
      partyGstin: voucherData.partyGstin || '23AABCS1429B1Z5',
      dueDate: voucherData.dueDate || '2026-11-02 (Monday)',
      totalAmount,
      paidAmount,
      paymentMode: voucherData.paymentMode || 'CASH',
      statedUdhaar: voucherData.statedUdhaar ?? computedUdhaar,
      computedUdhaar,
      hasMathAnomaly: Boolean(voucherData.hasMathAnomaly),
      mathDiscrepancy: voucherData.mathDiscrepancy || 0,
      anomalyDetails: voucherData.anomalyDetails || {
        statedBalance: voucherData.statedUdhaar ?? computedUdhaar,
        actualBalance: computedUdhaar,
        discrepancyCaught: 0,
        explanation: 'Clean settlement verified.',
        riskClassification: 'CLEAN_SETTLEMENT',
      },
      items: voucherData.items || [],
      creditRisk: voucherData.creditRisk || {
        exposurePercent: 0,
        riskRating: 'LOW',
        badgeText: 'CLEAN SETTLEMENT',
        cfoDirective: 'Authorized standard dispatch.',
      },
      hinglishSummary: voucherData.hinglishSummary || `${partyName}: कुल बिल ₹${totalAmount.toLocaleString('en-IN')}`,
      whatsappParchiText: voucherData.whatsappParchiText || '',
      rawNote: voucherData.rawNote,
      engineUsed: voucherData.engineUsed || 'gemma-4-26b-a4b-it',
      latencySeconds: voucherData.latencySeconds || 0.3,
      idempotencyKey,
    };

    const saveResult = db.saveVoucher(fullVoucher);

    let ledgerEntry: LedgerEntry | undefined;
    if (!saveResult.isDuplicate) {
      // Add ledger entry
      ledgerEntry = {
        id: `led-${Date.now()}`,
        voucherId: fullVoucher.id,
        voucherNumber: fullVoucher.voucherNumber,
        date: fullVoucher.date,
        partyId: fullVoucher.partyId || 'cust-sharma',
        partyName: fullVoucher.partyName,
        debit: fullVoucher.totalAmount,
        credit: fullVoucher.paidAmount,
        balance: fullVoucher.computedUdhaar,
        narration: `Sale dispatch ref ${fullVoucher.voucherNumber} (${fullVoucher.paymentMode})`,
      };
      db.addLedgerEntry(ledgerEntry);

      // Update customer balance if udhaar exists
      if (fullVoucher.partyId) {
        db.updateCustomerBalance(fullVoucher.partyId, fullVoucher.computedUdhaar);
      }
    }

    return {
      success: true,
      voucher: saveResult.voucher,
      isDuplicate: saveResult.isDuplicate,
      ledgerEntry,
    };
  },

  // 6. Update inventory
  async update_inventory(items: VoucherItem[]): Promise<{
    success: boolean;
    updatedItems: { sku: string; deductedQty: number; remainingStock: number }[];
  }> {
    await simulateLatency(200, 400);
    const updatedItems: { sku: string; deductedQty: number; remainingStock: number }[] = [];

    for (const item of items || []) {
      let targetSku = item.sku;
      if (!targetSku) {
        const found = db.lookupPrice(item.particulars);
        if (found) targetSku = found.sku;
      }

      if (targetSku) {
        const inv = db.updateInventoryStock(targetSku, -Math.abs(item.qty || 0));
        if (inv) {
          updatedItems.push({
            sku: targetSku,
            deductedQty: item.qty,
            remainingStock: inv.stock,
          });
        }
      }
    }

    return { success: true, updatedItems };
  },

  // 7. Generate UPI QR Client-Side
  async generate_upi_qr(
    amount: number,
    note: string,
    customUpiId?: string
  ): Promise<{
    upiUrl: string;
    qrDataUrl: string;
    vpa: string;
    amount: number;
  }> {
    await simulateLatency(150, 300);
    const settings = db.getSettings();
    const vpa = customUpiId || settings.upiId || 'vyaparvault@upi';
    const payeeName = encodeURIComponent(settings.upiPayeeName || 'VyaparVault Wholesale');
    const cleanAmount = Number(amount).toFixed(2);
    const encodedNote = encodeURIComponent(note || 'VyaparVault Khata Settlement');

    // Standard NPCI UPI URI
    const upiUrl = `upi://pay?pa=${vpa}&pn=${payeeName}&am=${cleanAmount}&cu=INR&tn=${encodedNote}`;

    // Render QR client-side
    const qrDataUrl = await QRCode.toDataURL(upiUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#141413',
        light: '#FFFFFF',
      },
    });

    return { upiUrl, qrDataUrl, vpa, amount };
  },

  // 8. Draft WhatsApp Parchi
  async draft_whatsapp(
    customer: Customer,
    voucher: Voucher
  ): Promise<{
    outboxItem: OutboxItem;
    whatsappWebUrl: string;
    parchiText: string;
  }> {
    await simulateLatency(150, 300);

    const hasAnomaly = voucher.hasMathAnomaly;
    const parchiText = `*VYAPARVAULT // KHATA ERP DISPATCH PARCHI*\n----------------------------------------\n*Voucher:* ${voucher.voucherNumber}\n*Party:* ${customer.name}\n*Beat:* ${customer.beat}\n*Total Bill:* ₹${voucher.totalAmount.toLocaleString('en-IN')}\n*Realized (${voucher.paymentMode}):* ₹${voucher.paidAmount.toLocaleString('en-IN')}\n*Actual Due Udhaar:* ₹${voucher.computedUdhaar.toLocaleString('en-IN')}\n${hasAnomaly ? `⚠️ *AUDIT ALERT:* Note stated ₹${voucher.statedUdhaar.toLocaleString('en-IN')} (₹${voucher.mathDiscrepancy.toLocaleString('en-IN')} Error Blocked)\n` : ''}*Payment Due:* ${voucher.dueDate}\n*Master Khata:* Verified & Logged\n----------------------------------------\n_VyaparVault Autonomous Operations_`;

    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone || '919826011029';
    const whatsappWebUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(parchiText)}`;

    const outboxItem: OutboxItem = {
      id: `out-${Date.now()}`,
      voucherId: voucher.id,
      partyName: customer.name,
      phone: customer.phone,
      messageType: 'WHATSAPP_PARCHI',
      content: parchiText,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    db.saveOutboxItem(outboxItem);

    return { outboxItem, whatsappWebUrl, parchiText };
  },

  // 9. Generate Daily Summary
  async generate_daily_summary(dateStr?: string): Promise<{
    date: string;
    totalVouchers: number;
    totalTurnover: number;
    cashRealized: number;
    totalUdhaarPending: number;
    anomaliesCaught: number;
    highRiskParties: string[];
  }> {
    await simulateLatency(200, 400);
    const vouchers = db.getVouchers();
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    let totalTurnover = 0;
    let cashRealized = 0;
    let totalUdhaarPending = 0;
    let anomaliesCaught = 0;
    const highRiskSet = new Set<string>();

    for (const v of vouchers) {
      totalTurnover += v.totalAmount;
      cashRealized += v.paidAmount;
      totalUdhaarPending += v.computedUdhaar;
      if (v.hasMathAnomaly) anomaliesCaught++;
      if (v.creditRisk?.riskRating === 'HIGH_CREDIT_RISK') {
        highRiskSet.add(v.partyName);
      }
    }

    return {
      date: targetDate,
      totalVouchers: vouchers.length,
      totalTurnover,
      cashRealized,
      totalUdhaarPending,
      anomaliesCaught,
      highRiskParties: Array.from(highRiskSet),
    };
  },
};
