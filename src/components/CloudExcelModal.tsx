import React from 'react';
import { X, ExternalLink, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { Voucher } from '../types/voucher';

interface CloudExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: Voucher[];
  onExportCsv: () => void;
}

export const CloudExcelModal: React.FC<CloudExcelModalProps> = ({
  isOpen,
  onClose,
  vouchers,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const googleSheetsUrl =
    'https://docs.google.com/spreadsheets/d/1VyaparVault_Indore_MasterLedger_FY26/edit#gid=0';

  const formatINR = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6">
      <div className="bg-white border border-gray-100 w-full max-w-5xl max-h-[85vh] flex flex-col rounded-2xl shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 tracking-tight">
                  Cloud Master Ledger
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <ShieldCheck className="w-3 h-3" />
                  Synced
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                VYAPARVAULT_INDORE_MASTER_LEDGER_FY26.XLSX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleSheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-colors"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-gray-50/70 border-b border-gray-100 px-6 py-2.5 flex items-center justify-between text-xs text-gray-600">
          <span className="text-gray-500 font-mono text-[11px]">
            {vouchers.length} Total Registered Wholesale Vouchers
          </span>
          <button
            onClick={onExportCsv}
            className="px-3 py-1 bg-gray-900 hover:bg-black text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-medium text-xs transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download CSV for Excel</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-3 first:pl-0 font-normal">#</th>
                  <th className="pb-3 px-3 font-normal">Voucher</th>
                  <th className="pb-3 px-3 font-normal">Date</th>
                  <th className="pb-3 px-3 font-normal">Party</th>
                  <th className="pb-3 px-3 font-normal">Beat</th>
                  <th className="pb-3 px-3 text-right font-normal">Total</th>
                  <th className="pb-3 px-3 text-right font-normal">Paid</th>
                  <th className="pb-3 px-3 text-right font-normal">Net Udhaar</th>
                  <th className="pb-3 px-3 text-right font-normal">Anomaly</th>
                  <th className="pb-3 px-3 last:pr-0 text-center font-normal">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vouchers.map((v, i) => (
                  <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3 first:pl-0 font-mono text-gray-400">
                      {i + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-gray-900">
                      {v.voucherNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-500">
                      {v.date}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900">
                      {v.partyName}
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {v.partyBeat}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-gray-900">
                      {formatINR(v.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-emerald-700">
                      {formatINR(v.paidAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-gray-900">
                      {formatINR(v.computedUdhaar)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {v.hasMathAnomaly ? (
                        <span className="text-red-600 font-medium">
                          +{formatINR(Math.abs(v.mathDiscrepancy))}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0.00</span>
                      )}
                    </td>
                    <td className="py-3 px-3 last:pr-0 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          v.hasMathAnomaly
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {v.hasMathAnomaly ? 'Math Trap Caught' : 'Verified Clean'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/70 border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
          <span>Synced with Indore Wholesale Master Sheet • Google Sheets API</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
