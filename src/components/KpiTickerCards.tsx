import React from 'react';
import { ShieldAlert, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { Voucher } from '../types/voucher';

interface KpiTickerCardsProps {
  vouchers: Voucher[];
}

export const KpiTickerCards: React.FC<KpiTickerCardsProps> = ({ vouchers }) => {
  const grossValue = vouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
  const realizedReceipts = vouchers.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
  const netUdhaar = vouchers.reduce((acc, v) => acc + (v.computedUdhaar || 0), 0);
  
  const flaggedVouchers = vouchers.filter((v) => v.hasMathAnomaly);
  const mathErrorsPrevented = flaggedVouchers.reduce(
    (acc, v) => acc + Math.abs(v.mathDiscrepancy || 0),
    0
  );

  const formatINR = (val: number) => {
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Gross Dispatch Value */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-sans text-gray-500 uppercase tracking-wider font-semibold">
          <span>GROSS DISPATCH VALUE</span>
          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm">
            F10_SUM
          </span>
        </div>
        <div className="mt-3 text-2xl font-bold font-mono text-[#141413] tracking-tight">
          {formatINR(grossValue)}
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
          <span>Commercial Invoiced Total</span>
        </div>
      </div>

      {/* Card 2: Realized Receipts */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-sans text-[#0F6E56] uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#0F6E56]" />
            REALIZED RECEIPTS
          </span>
          <span className="text-[10px] font-mono bg-[#E6F7EF] text-[#0F6E56] px-1.5 py-0.5 rounded-sm font-bold">
            SETTLED
          </span>
        </div>
        <div className="mt-3 text-2xl font-bold font-mono text-[#0F6E56] tracking-tight">
          {formatINR(realizedReceipts)}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Till Cash & IndusInd/HDFC Bank
        </div>
      </div>

      {/* Card 3: Net Market Udhaar */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-sans text-gray-700 uppercase tracking-wider font-semibold">
          <span>NET MARKET UDHAAR</span>
          <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-sm font-medium">
            EXPOSED
          </span>
        </div>
        <div className="mt-3 text-2xl font-bold font-mono text-[#C92A2A] tracking-tight">
          {formatINR(netUdhaar)}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Outstanding Wholesale Receivables
        </div>
      </div>

      {/* Card 4: Forensic Math Errors Prevented */}
      <div className="bg-[#FFF8F8] rounded-lg border border-[#F5C2C2] p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-sans text-[#C92A2A] uppercase tracking-wider font-bold">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#C92A2A]" />
            MATH ERRORS PREVENTED
          </span>
          <span className="text-[10px] font-mono bg-[#FFE3E3] text-[#C92A2A] px-1.5 py-0.5 rounded-sm font-bold">
            AUDITED
          </span>
        </div>
        <div className="mt-3 text-2xl font-bold font-mono text-[#C92A2A] tracking-tight">
          {formatINR(mathErrorsPrevented)}
        </div>
        <div className="mt-1 text-xs font-mono font-medium text-[#C92A2A]">
          {flaggedVouchers.length} Vouchers Flagged & Blocked
        </div>
      </div>
    </div>
  );
};
