import React from 'react';
import { TrendingUp, CheckCircle, ShieldAlert } from 'lucide-react';
import { Voucher } from '../types/voucher';

interface KpiBentoRowProps {
  vouchers: Voucher[];
}

export const KpiBentoRow: React.FC<KpiBentoRowProps> = ({ vouchers }) => {
  // Compute totals across vouchers
  const totalDispatched = vouchers.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
  const realizedPaid = vouchers.reduce((acc, v) => acc + (v.paidAmount || 0), 0);
  const exposedUdhaar = vouchers.reduce((acc, v) => acc + (v.computedUdhaar || 0), 0);
  const totalMathDiscrepancyCaught = vouchers.reduce(
    (acc, v) => acc + (v.hasMathAnomaly ? Math.abs(v.mathDiscrepancy || 0) : 0),
    0
  );
  const anomalyCount = vouchers.filter((v) => v.hasMathAnomaly).length;

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {/* 1. Total Dispatched (₹) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Dispatched
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatINR(totalDispatched)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-sans">
            <span>{vouchers.length} wholesale mandi invoices</span>
          </div>
        </div>
      </div>

      {/* 2. Realized Paid (₹) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Realized Paid (Cash / UPI)
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
            {formatINR(realizedPaid)}
          </div>
          <div className="text-xs text-emerald-600/80 mt-1 flex items-center gap-1.5 font-sans">
            <span>
              {totalDispatched > 0
                ? `${((realizedPaid / totalDispatched) * 100).toFixed(1)}% recovery rate`
                : '100% recovered'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Exposed Udhaar & Math Saved (₹) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Exposed Udhaar & Math Saved
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatINR(exposedUdhaar)}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1 font-sans">
            <span>
              Saved {formatINR(totalMathDiscrepancyCaught)} in {anomalyCount} flagged traps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
