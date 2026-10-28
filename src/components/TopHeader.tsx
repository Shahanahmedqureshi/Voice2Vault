import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';

interface TopHeaderProps {
  onOpenCloudExcel: () => void;
  onExportCsv: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenCloudExcel,
  onExportCsv,
}) => {
  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo / Title on Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
            V2V
          </div>
          <div>
            <h1 className="font-semibold text-base text-gray-900 tracking-tight">
              Voice2Vault Khata
            </h1>
            <p className="text-xs text-gray-400">
              Wholesale Accounting & Arithmetic Auditor
            </p>
          </div>
        </div>

        {/* Clean Actions on Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCloudExcel}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            title="Open Master Spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Open Cloud Excel</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 hover:text-black bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Download CSV register"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
