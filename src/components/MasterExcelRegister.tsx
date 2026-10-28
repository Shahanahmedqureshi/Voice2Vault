import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';
import { Voucher } from '../types/voucher';

interface MasterExcelRegisterProps {
  vouchers: Voucher[];
  selectedVoucherId: string | null;
  onSelectVoucher: (voucher: Voucher) => void;
  onExportCsv: () => void;
  onResetToDefault: () => void;
}

export const MasterExcelRegister: React.FC<MasterExcelRegisterProps> = ({
  vouchers,
  selectedVoucherId,
  onSelectVoucher,
  onExportCsv,
  onResetToDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'FLAGGED' | 'CLEAN'>('ALL');

  const columnHeaders = [
    { col: 'A', name: 'Voucher No' },
    { col: 'B', name: 'Date' },
    { col: 'C', name: 'Party Name' },
    { col: 'D', name: 'Beat Location' },
    { col: 'E', name: 'Payment' },
    { col: 'F', name: 'Total Bill' },
    { col: 'G', name: 'Realized' },
    { col: 'H', name: 'Stated' },
    { col: 'I', name: 'Net Udhaar' },
    { col: 'J', name: 'Anomaly' },
    { col: 'K', name: 'Status' },
  ];

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.partyBeat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'FLAGGED') return v.hasMathAnomaly;
    if (filterMode === 'CLEAN') return !v.hasMathAnomaly;
    return true;
  });

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-6">
      {/* 1. CARD TITLE & ACTIONS */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
              Master Ledger Register
            </h3>
            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {vouchers.length} Vouchers
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Synchronized with Google Drive Excel format • Click any row to preview invoice
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetToDefault}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to default baseline vouchers"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            <span>Reset</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-2xs"
            title="Download CSV for Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party, mandi or voucher..."
            className="w-full bg-gray-50/70 border border-gray-200 pl-9 pr-3.5 py-2 text-xs rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              filterMode === 'ALL'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({vouchers.length})
          </button>
          <button
            onClick={() => setFilterMode('FLAGGED')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              filterMode === 'FLAGGED'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Anomalies ({vouchers.filter((v) => v.hasMathAnomaly).length})
          </button>
          <button
            onClick={() => setFilterMode('CLEAN')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
              filterMode === 'CLEAN'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Verified Clean ({vouchers.filter((v) => !v.hasMathAnomaly).length})
          </button>
        </div>
      </div>

      {/* 3. CLEAN DATA TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              {columnHeaders.map((col) => (
                <th key={col.col} className="pb-3 px-3 first:pl-0 last:pr-0 font-normal">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher) => {
                const isSelected = voucher.id === selectedVoucherId;

                return (
                  <tr
                    key={voucher.id}
                    onClick={() => onSelectVoucher(voucher)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 font-medium'
                        : 'hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Voucher No */}
                    <td className="py-3 px-3 first:pl-0 font-mono font-medium text-gray-900">
                      {voucher.voucherNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 font-mono text-gray-500">
                      {voucher.date}
                    </td>

                    {/* Party Name */}
                    <td className="py-3 px-3 font-medium text-gray-900 truncate max-w-[200px]" title={voucher.partyName}>
                      {voucher.partyName}
                    </td>

                    {/* Beat */}
                    <td className="py-3 px-3 text-gray-500 truncate max-w-[160px]" title={voucher.partyBeat}>
                      {voucher.partyBeat}
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3 px-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md text-[11px] font-mono">
                        {voucher.paymentMode}
                      </span>
                    </td>

                    {/* Total Bill */}
                    <td className="py-3 px-3 font-mono text-gray-900 font-medium">
                      {formatINR(voucher.totalAmount)}
                    </td>

                    {/* Realized */}
                    <td className="py-3 px-3 font-mono text-emerald-700 font-medium">
                      {formatINR(voucher.paidAmount)}
                    </td>

                    {/* Stated */}
                    <td className={`py-3 px-3 font-mono ${voucher.hasMathAnomaly ? 'text-red-500 line-through' : 'text-gray-500'}`}>
                      {formatINR(voucher.statedUdhaar)}
                    </td>

                    {/* Net Udhaar */}
                    <td className="py-3 px-3 font-mono font-semibold text-gray-900">
                      {formatINR(voucher.computedUdhaar)}
                    </td>

                    {/* Anomaly Caught */}
                    <td className="py-3 px-3 font-mono">
                      {voucher.hasMathAnomaly ? (
                        <span className="text-red-600 font-semibold">
                          +{formatINR(Math.abs(voucher.mathDiscrepancy))}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-normal">₹0.00</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 last:pr-0">
                      {voucher.hasMathAnomaly ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          Math Trap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400 italic">
                  No matching ledger entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
