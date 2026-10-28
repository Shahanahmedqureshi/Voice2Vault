import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Share2,
  FileSpreadsheet,
  Calendar,
  MapPin,
  FileText,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { Voucher } from '../types/voucher';
import { UpiPaymentQr } from './UpiPaymentQr';
import { formatVoucherForWhatsApp } from '../utils/whatsappFormatter';

interface ForensicVoucherProps {
  voucher: Voucher | null;
  onAppendToRegister: (voucher: Voucher) => void;
  onUpdateVoucher?: (voucher: Voucher) => void;
  isAppended: boolean;
}

export const ForensicVoucher: React.FC<ForensicVoucherProps> = ({
  voucher,
  onAppendToRegister,
  onUpdateVoucher,
  isAppended,
}) => {
  const [smsCopied, setSmsCopied] = useState(false);

  if (!voucher) {
    return (
      <div className="bg-white rounded-[8px] border border-[#E4E0D6] p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <h3 className="font-semibold text-[15px] text-[#1F2328]">
          No voucher selected
        </h3>
        <p className="text-[13px] text-[#5B6168] mt-1 max-w-sm">
          Select a voucher from the ledger or run a request to view details.
        </p>
      </div>
    );
  }

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // WhatsApp intent URL with human-readable Hindi/Hinglish message
  const whatsappText = formatVoucherForWhatsApp(voucher as any);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  // Regional Indian SMS intent
  const smsBody = voucher.hasMathAnomaly
    ? `[Voice2Vault] ${voucher.partyName}: Total Bill Rs ${voucher.totalAmount.toLocaleString('en-IN')}, Paid Rs ${voucher.paidAmount.toLocaleString('en-IN')}. ACTUAL Due Udhaar: Rs ${voucher.computedUdhaar.toLocaleString('en-IN')} (Stated Rs ${voucher.statedUdhaar.toLocaleString('en-IN')} - Rs ${Math.abs(voucher.mathDiscrepancy).toLocaleString('en-IN')} error prevented). Due: ${voucher.dueDate}.`
    : `[Voice2Vault] ${voucher.partyName}: Total Bill Rs ${voucher.totalAmount.toLocaleString('en-IN')}, Paid Rs ${voucher.paidAmount.toLocaleString('en-IN')}. Due Udhaar: Rs ${voucher.computedUdhaar.toLocaleString('en-IN')}. Due: ${voucher.dueDate}. 100% Math Verified.`;

  const smsUrl = `sms:?&body=${encodeURIComponent(smsBody)}`;

  const handleSmsClick = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(smsBody).catch(() => {});
      setSmsCopied(true);
      setTimeout(() => setSmsCopied(false), 2500);
    }
  };

  // Credit Risk calculations
  const total = voucher.totalAmount || 1;
  const paid = voucher.paidAmount || 0;
  const udhaar = voucher.computedUdhaar || 0;
  const paidPercent = Math.min(100, Math.max(0, (paid / total) * 100));
  const udhaarPercent = Math.min(100, Math.max(0, (udhaar / total) * 100));

  return (
    <div className="bg-white rounded-[8px] border border-[#E4E0D6] p-5 flex flex-col gap-5">
      {/* 1. Party header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#E4E0D6] gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-[16px] font-semibold text-[#1F2328]">
              {voucher.partyName}
            </h3>
            <span className="text-[12px] font-mono text-[#5B6168] bg-[#FBFAF7] px-2 py-0.5 rounded-[4px] border border-[#E4E0D6]">
              {voucher.voucherNumber}
            </span>
            {(voucher.evidenceQuotes?.partyName || (voucher as any).evidence) && (
              <span className="text-[11px] text-[#234E7D] bg-[#E8EFF7] px-2 py-0.5 rounded-[4px] border border-[#234E7D]/20 font-medium">
                Evidence quote: "{voucher.evidenceQuotes?.partyName || (voucher as any).evidence || voucher.partyName}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[12px] text-[#5B6168]">
            <span className="inline-flex items-center gap-1 bg-[#FBFAF7] text-[#5B6168] px-2 py-0.5 rounded-[4px] border border-[#E4E0D6]">
              <MapPin className="w-3 h-3 text-[#8A8F96] stroke-[1.5]" />
              {voucher.partyBeat}
            </span>

            {voucher.partyGstin && (
              <span className="font-mono text-[11px] text-[#8A8F96]">
                GST: {voucher.partyGstin}
              </span>
            )}

            {(voucher as any).matchedCustomerName && (voucher as any).matchedCustomerName !== voucher.partyName && (
              <span className="text-[11px] text-[#5B6168] bg-[#FBFAF7] px-2 py-0.5 rounded-[4px] border border-[#E4E0D6]">
                Matched khata: {(voucher as any).matchedCustomerName}
              </span>
            )}
          </div>
        </div>

        {/* Due Date Badge */}
        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FBF0DC] text-[#9A5B00] rounded-[4px] border border-[#E4E0D6] text-[12px] font-medium">
            <Calendar className="w-3 h-3 text-[#9A5B00] stroke-[1.5]" />
            <span>Due: {voucher.dueDate}</span>
          </div>
          <span className="text-[11px] text-[#8A8F96] font-mono">
            Issued {voucher.date}
          </span>
        </div>
      </div>

      {/* 2. Math alert card */}
      {voucher.hasMathAnomaly ? (
        <div className="bg-[#FAE8E4] border border-[#A7321F]/30 rounded-[6px] p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[#A7321F] font-semibold text-[13px]">
              <AlertCircle className="w-4 h-4 text-[#A7321F] shrink-0 stroke-[1.5]" />
              <span>Math discrepancy caught in field note</span>
            </div>
            <span className="text-[12px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-[#A7321F] text-white">
              Saved {formatINR(Math.abs(voucher.mathDiscrepancy))} error
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white rounded-[4px] p-2.5 border border-[#E4E0D6] text-[12px] font-mono">
            <div>
              <div className="text-[11px] text-[#5B6168] font-sans">Stated balance</div>
              <div className="text-[13px] font-semibold text-[#A7321F] line-through">
                {formatINR(voucher.statedUdhaar)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#5B6168] font-sans">Audited balance</div>
              <div className="text-[13px] font-semibold text-[#1F2328]">
                {formatINR(voucher.computedUdhaar)}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-[#5B6168] font-sans">Discrepancy blocked</div>
              <div className="text-[13px] font-semibold text-[#A7321F]">
                + {formatINR(Math.abs(voucher.mathDiscrepancy))}
              </div>
            </div>
          </div>

          <p className="text-[12px] text-[#A7321F] leading-relaxed font-sans">
            {voucher.anomalyDetails?.explanation ||
              `Field note claimed ₹${voucher.statedUdhaar} remaining, but exact arithmetic (${formatINR(voucher.totalAmount)} Total - ${formatINR(voucher.paidAmount)} Paid) equals ${formatINR(voucher.computedUdhaar)}. Prevented an artificial overstatement.`}
          </p>
        </div>
      ) : (
        <div className="bg-[#E7F1EA] border border-[#2F6B3F]/30 rounded-[6px] p-3 flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2 text-[#2F6B3F] font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2F6B3F] shrink-0 stroke-[1.5]" />
            <span>Arithmetic 100% verified: Total bill matches payments and stated balance.</span>
          </div>
          <span className="font-mono font-medium text-[#2F6B3F] bg-white px-2 py-0.5 rounded-[4px] border border-[#2F6B3F]/30 text-[11px]">
            Clean settlement
          </span>
        </div>
      )}

      {/* 3. Item table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E4E0D6] text-[12px] font-medium text-[#5B6168]">
              <th className="pb-2.5 pr-4 font-medium">Item</th>
              <th className="pb-2.5 px-4 text-right font-medium">Qty</th>
              <th className="pb-2.5 px-4 text-right font-medium">Rate</th>
              <th className="pb-2.5 pl-4 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E0D6]">
            {voucher.items && voucher.items.length > 0 ? (
              voucher.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FBFAF7] transition-colors">
                  <td className="py-2.5 pr-4 text-[#1F2328]">
                    <div className="font-medium">{item.particulars}</div>
                    <div className="text-[11px] text-[#8A8F96] mt-0.5">
                      {item.godownAction || 'Direct delivery'}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5B6168] whitespace-nowrap">
                    {item.qty} <span className="text-[11px] text-[#8A8F96] font-sans">{item.unit}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#5B6168] whitespace-nowrap">
                    {Number(item.estRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-medium text-[#1F2328] whitespace-nowrap">
                    {Number(item.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 text-center text-[#8A8F96] italic text-[12px]">
                  No line items extracted.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Settlement exposure bar */}
      <div className="bg-[#FBFAF7] rounded-[6px] p-3 border border-[#E4E0D6] flex flex-col gap-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-medium text-[#1F2328]">Settlement exposure</span>
          <span className="text-[#5B6168] font-mono tabular-nums">
            Paid: {paidPercent.toFixed(0)}% · Udhaar: {udhaarPercent.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#E4E0D6] rounded-[2px] overflow-hidden flex">
          <div
            style={{ width: `${paidPercent}%` }}
            className="h-full bg-[#2F6B3F] transition-all duration-300"
            title={`Realized: ${formatINR(voucher.paidAmount)}`}
          />
          <div
            style={{ width: `${udhaarPercent}%` }}
            className={`h-full transition-all duration-300 ${
              voucher.hasMathAnomaly ? 'bg-[#A7321F]' : 'bg-[#9A5B00]'
            }`}
            title={`Udhaar: ${formatINR(voucher.computedUdhaar)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#5B6168] font-mono tabular-nums">
          <span className="flex items-center gap-1.5 text-[#2F6B3F] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2F6B3F]"></span>
            Realized ({voucher.paymentMode}): {formatINR(voucher.paidAmount)}
          </span>
          <span className="flex items-center gap-1.5 text-[#1F2328] font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                voucher.hasMathAnomaly ? 'bg-[#A7321F]' : 'bg-[#9A5B00]'
              }`}
            ></span>
            Audited udhaar: {formatINR(voucher.computedUdhaar)}
          </span>
        </div>
      </div>

      {/* 5. Totals summary */}
      <div className="border-t border-[#E4E0D6] pt-3 flex flex-col gap-1.5 font-mono tabular-nums text-[13px]">
        <div className="flex justify-between text-[#5B6168]">
          <span className="font-sans">Gross invoice total:</span>
          <span className="font-medium text-[#1F2328]">{formatINR(voucher.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-[#2F6B3F]">
          <span className="font-sans">Less: Realized amount ({voucher.paymentMode}):</span>
          <span className="font-medium">- {formatINR(voucher.paidAmount)}</span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-[#E4E0D6] text-[14px]">
          <span className="font-semibold text-[#1F2328] font-sans">Net audited balance (udhaar):</span>
          <span
            className={`font-semibold ${
              voucher.hasMathAnomaly ? 'text-[#A7321F]' : 'text-[#1F2328]'
            }`}
          >
            {formatINR(voucher.computedUdhaar)}
          </span>
        </div>
      </div>

      {/* 6. INSTANT UPI PAYMENT QR CODE (Based on Net Udhaar) */}
      <UpiPaymentQr
        voucher={voucher}
        onMarkPaid={onUpdateVoucher}
      />

      {/* 7. 2 CLEAN BOTTOM ACTION BUTTONS: 🟢 Send WhatsApp Parchi + Excel and ➕ Save to Master Ledger */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        {/* Send WhatsApp Parchi */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 h-[36px] px-3.5 rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors font-medium text-[13px] text-center flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-[#5B6168] stroke-[1.5]" />
          <span>Send WhatsApp parchi</span>
        </a>

        {/* Save to Master Ledger */}
        <button
          type="button"
          onClick={() => onAppendToRegister(voucher)}
          className={`w-full sm:flex-1 h-[36px] px-3.5 rounded-[6px] border transition-colors font-medium text-[13px] flex items-center justify-center gap-2 cursor-pointer ${
            isAppended
              ? 'border-[#E4E0D6] bg-[#FBFAF7] text-[#5B6168]'
              : 'border-[#234E7D] bg-[#234E7D] hover:bg-[#1B4068] text-white'
          }`}
        >
          {isAppended ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#2F6B3F] stroke-[1.5]" />
              <span>Saved to ledger</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4 stroke-[1.5]" />
              <span>Save to ledger</span>
            </>
          )}
        </button>

        {/* Quick SMS intent link */}
        <a
          href={smsUrl}
          onClick={handleSmsClick}
          className="h-[36px] w-[36px] text-[#5B6168] hover:text-[#1F2328] hover:bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
          title="Send SMS summary"
        >
          <MessageSquare className="w-4 h-4 stroke-[1.5]" />
        </a>
      </div>
    </div>
  );
};
