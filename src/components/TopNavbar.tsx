import React from 'react';
import { FileSpreadsheet, Download, Sparkles, BarChart3, TrendingUp } from 'lucide-react';

interface TopNavbarProps {
  activeTab: 'audit' | 'stock';
  onSelectTab: (tab: 'audit' | 'stock') => void;
  onOpenCloudExcel: () => void;
  onExportCsv: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCloudExcel,
  onExportCsv,
}) => {
  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Sleek logo badge + Voice2Vault + subtle pill Gemma 4 Multimodal */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm ring-1 ring-slate-800/10">
            V2V
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-semibold text-base sm:text-lg text-slate-900 tracking-tight">
              Voice2Vault
            </h1>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Gemma 4 Multimodal
            </span>
          </div>
        </div>

        {/* Center/Nav: Clean Navigation Tabs: [📊 Forensic Audit] and [📈 AI Stock Predictor] */}
        <nav className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 order-3 sm:order-2">
          <button
            type="button"
            onClick={() => onSelectTab('audit')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-slate-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-700" />
            <span>📊 Forensic Audit</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('stock')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'bg-white text-slate-950 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>📈 AI Stock Predictor</span>
          </button>
        </nav>

        {/* Right: 📊 Live Cloud Excel + 📥 Export CSV */}
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <button
            type="button"
            onClick={onOpenCloudExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            title="Open Master Spreadsheet preview"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">Live Cloud Excel</span>
            <span className="md:hidden">Excel</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            title="Download UTF-8 CSV register for Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Export CSV</span>
            <span className="md:hidden">CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
