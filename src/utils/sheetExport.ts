import * as XLSX from 'xlsx';
import { Voucher, LedgerEntry } from '../types/entities';

/**
 * Exports vouchers and ledger data using SheetJS.
 * Strictly labeled as "Export" (one-way read export), never "sync".
 */
export function exportToExcel(
  vouchers: Voucher[],
  ledgerEntries: LedgerEntry[],
  filenamePrefix = 'VyaparVault_Ledger_Export'
): void {
  const wb = XLSX.utils.book_new();

  // 1. Vouchers Sheet
  const voucherRows = vouchers.map((v) => ({
    'Voucher No': v.voucherNumber,
    Date: v.date,
    Party: v.partyName,
    Beat: v.partyBeat,
    GSTIN: v.partyGstin,
    'Payment Mode': v.paymentMode,
    'Total Bill (INR)': v.totalAmount,
    'Paid Amount (INR)': v.paidAmount,
    'Stated Udhaar (INR)': v.statedUdhaar,
    'Audited Udhaar (INR)': v.computedUdhaar,
    'Math Discrepancy (INR)': v.mathDiscrepancy,
    'Math Anomaly Caught': v.hasMathAnomaly ? 'YES' : 'NO',
    'Credit Risk': v.creditRisk?.riskRating || 'LOW',
    'Due Date': v.dueDate,
    'Hinglish Summary': v.hinglishSummary,
  }));
  const wsVouchers = XLSX.utils.json_to_sheet(voucherRows);
  XLSX.utils.book_append_sheet(wb, wsVouchers, 'Dispatched Vouchers');

  // 2. Master Ledger Sheet
  const ledgerRows = ledgerEntries.map((l) => ({
    'Ledger ID': l.id,
    Date: l.date,
    'Voucher Ref': l.voucherNumber,
    Party: l.partyName,
    'Debit (INR)': l.debit,
    'Credit (INR)': l.credit,
    'Balance (INR)': l.balance,
    Narration: l.narration,
  }));
  const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);
  XLSX.utils.book_append_sheet(wb, wsLedger, 'Master Ledger');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${todayStr}.xlsx`);
}

export function exportToCsv(
  vouchers: Voucher[],
  filenamePrefix = 'VyaparVault_Vouchers_Export'
): void {
  const wb = XLSX.utils.book_new();
  const voucherRows = vouchers.map((v) => ({
    'VOUCHER_NO': v.voucherNumber,
    'DATE': v.date,
    'PARTY_NAME': v.partyName,
    'BEAT_LOCATION': v.partyBeat,
    'GSTIN': v.partyGstin,
    'PAYMENT_MODE': v.paymentMode,
    'TOTAL_BILL_INR': v.totalAmount,
    'PAID_AMOUNT_INR': v.paidAmount,
    'STATED_UDHAAR_INR': v.statedUdhaar,
    'AUDITED_UDHAAR_INR': v.computedUdhaar,
    'MATH_DISCREPANCY_INR': v.mathDiscrepancy,
    'RISK_RATING': v.creditRisk?.riskRating || 'LOW',
  }));
  const ws = XLSX.utils.json_to_sheet(voucherRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Vouchers');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${todayStr}.csv`, { bookType: 'csv' });
}
