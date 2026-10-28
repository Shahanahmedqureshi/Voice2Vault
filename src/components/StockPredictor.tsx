import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  Send,
  Copy,
  Check,
  Search,
  Filter,
  Package,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  IndianRupee,
  RefreshCw,
  Info
} from 'lucide-react';
import { DemandVelocityChart } from './DemandVelocityChart';

interface AdvisorResult {
  summary: string;
  bullets: string[];
  recommendedAction: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  engineUsed?: string;
  latency?: number;
}

interface SkuRow {
  id: string;
  category: 'Kirana & Staples' | 'Pharma & Health' | 'Hardware & Industrial';
  skuName: string;
  unit: string;
  peakSeason: string;
  demandOutlook: 'High Demand' | 'Stable' | 'Off-Season';
  recommendation: string;
  urgency: 'Immediate' | 'Watch' | 'Liquidate' | 'Standard';
  currentStock: number;
  minReorder: number;
}

const INITIAL_SKUS: SkuRow[] = [
  {
    id: 'sku-1',
    category: 'Pharma & Health',
    skuName: 'ORS Packets & Electrolytes (Electral / Prolyte)',
    unit: '100g Sachets (Box of 50)',
    peakSeason: 'April – July (Peak Summer Heat)',
    demandOutlook: 'High Demand',
    recommendation: 'Stock 50+ units immediately before heatwave surge (+40%)',
    urgency: 'Immediate',
    currentStock: 18,
    minReorder: 60,
  },
  {
    id: 'sku-2',
    category: 'Kirana & Staples',
    skuName: 'Refined Soybean & Sunflower Oil (15L Tins)',
    unit: '15L Wholesale Tins',
    peakSeason: 'Sept – Nov (Festive / Diwali & Wedding)',
    demandOutlook: 'High Demand',
    recommendation: 'Advance-book 2 weeks before festive rush; lock mandi rate',
    urgency: 'Immediate',
    currentStock: 25,
    minReorder: 75,
  },
  {
    id: 'sku-3',
    category: 'Pharma & Health',
    skuName: 'Slow-Moving Cold Cough Syrups (Monsoon Batch)',
    unit: '100ml Bottles (Carton of 24)',
    peakSeason: 'Nov – Jan (Winter Peak Only)',
    demandOutlook: 'Off-Season',
    recommendation: 'Liquidate slow stock; bundle with paracetamol or exchange with MR',
    urgency: 'Liquidate',
    currentStock: 96,
    minReorder: 20,
  },
  {
    id: 'sku-4',
    category: 'Kirana & Staples',
    skuName: 'Sugar M-30 Wholesale Bags (50kg)',
    unit: '50kg Jute Bag',
    peakSeason: 'Oct – Dec (Mithai & Festival Season)',
    demandOutlook: 'High Demand',
    recommendation: 'Pre-order 40 bags; hedge against anticipated +3.8% mandi price bump',
    urgency: 'Watch',
    currentStock: 15,
    minReorder: 40,
  },
  {
    id: 'sku-5',
    category: 'Kirana & Staples',
    skuName: 'Glucose-D Instant Energy Powder (500g Jars)',
    unit: '500g Pet Jars',
    peakSeason: 'May – July (Summer Sports & Labour)',
    demandOutlook: 'High Demand',
    recommendation: 'Maintain 15-day rolling safety buffer with C&F distributor',
    urgency: 'Watch',
    currentStock: 30,
    minReorder: 45,
  },
  {
    id: 'sku-6',
    category: 'Hardware & Industrial',
    skuName: 'GI Wire & Tarpaulin Waterproof Sheets (120 GSM)',
    unit: 'Bundles (12x18 ft)',
    peakSeason: 'June – Aug (Monsoon Protection)',
    demandOutlook: 'Stable',
    recommendation: 'Reorder 25 bundles 3 weeks prior to rainy season onset',
    urgency: 'Watch',
    currentStock: 14,
    minReorder: 30,
  },
  {
    id: 'sku-7',
    category: 'Pharma & Health',
    skuName: 'Winter Petroleum Jelly & Cold Moisturisers',
    unit: '50g Tubs (Tray of 12)',
    peakSeason: 'Dec – Feb (Winter Peak)',
    demandOutlook: 'Off-Season',
    recommendation: 'Zero new procurement; clear remaining 14 tubs at cost price',
    urgency: 'Liquidate',
    currentStock: 42,
    minReorder: 10,
  },
  {
    id: 'sku-8',
    category: 'Kirana & Staples',
    skuName: 'Chakki Fresh Whole Wheat Atta (10kg Bags)',
    unit: '10kg Poly Packs',
    peakSeason: 'Year-Round (Daily Staple)',
    demandOutlook: 'Stable',
    recommendation: 'Standard rolling reorder cycle; 7-day inventory velocity',
    urgency: 'Standard',
    currentStock: 55,
    minReorder: 50,
  },
];

const PRESET_PROMPTS = [
  'Diwali aane wali hai, mujhe kis item ka stock badhana chahiye?',
  'Summer season ke liye high-margin FMCG & hydration items konsi hain?',
  'Slow-moving cough syrup aur dead stock ko bina loss ke kaise liquidate karein?',
  'Udhaar recovery aur inventory turnover ko balance kaise karein?',
];

export const StockPredictor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState<AdvisorResult | null>({
    summary:
      'Indore Mandi Seasonal Intelligence: Ahead of the regional summer heat spike, immediate +40% surge in hydration/electrolytes and beverage stock is forecast.',
    bullets: [
      'Procure 45-60 days forward inventory of ORS Sachets and Glucose powder immediately before regional temperature crosses 40°C.',
      'Pre-negotiate 3-5% carton margin discounts with local C&F distributors by paying upfront cash rather than availing credit.',
      'Initiate combo clearance on aging monsoon cough syrup batches to release ₹38,400 in locked working capital before expiry window narrows.',
    ],
    recommendedAction: 'Order 50+ ORS boxes & lock 35 tins refined oil',
    riskLevel: 'Moderate',
    engineUsed: 'gemini-2.5-flash',
    latency: 0.42,
  });

  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const handleAskAdvisor = async (customQuery?: string) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/inventory-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, category: categoryFilter }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.data) {
        setAdvisorResult({
          ...resData.data,
          engineUsed: resData.engine,
          latency: resData.latency,
        });
      }
    } catch (err) {
      console.error('Inventory advisor call fallback:', err);
      // Fallback
      setAdvisorResult({
        summary:
          'Local Mandi Strategy: Advance order high-velocity seasonal items while aggressively recovering receivables to preserve cash-flow.',
        bullets: [
          'Lock 2 weeks forward inventory on primary seasonal surges (ORS/Sugar/Oil) with verified distributors.',
          'Cap retailer Udhaar at 21 days max for seasonal consignments to prevent working capital traps.',
          'Conduct weekly batch expiry audits on all OTC pharma and confectionery lines to catch slow-moving stock early.',
        ],
        recommendedAction: 'Audit top 10 turnover SKUs and clear stagnant items',
        riskLevel: 'Moderate',
        engineUsed: 'LOCAL-INVENTORY-RULE-ENGINE',
        latency: 0.12,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStrategy = () => {
    if (!advisorResult) return;
    const text = `*VOICE2VAULT AI STOCK STRATEGY*\n${advisorResult.summary}\n\nKey Recommendations:\n${advisorResult.bullets.map((b) => `• ${b}`).join('\n')}\n\nAction: ${advisorResult.recommendedAction}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSkus = INITIAL_SKUS.filter((item) => {
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch =
      item.skuName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.recommendation.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.peakSeason.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* 1. Header Overview & Regional Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              AI Forecast Engine // Live Mandi Intelligence
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            AI Stock Predictor & Seasonal Forecasting
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Predict high-velocity SKU surges, hedge against wholesale price volatility, and eliminate dead-capital inventory traps.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <div className="flex-1 md:flex-initial bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
              Monitored SKUs
            </span>
            <span className="text-base font-semibold text-slate-900 font-mono">
              142 Active Lines
            </span>
          </div>
          <div className="flex-1 md:flex-initial bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] font-medium text-amber-700 block uppercase tracking-wider">
              Surge Forecast
            </span>
            <span className="text-base font-semibold text-amber-900 font-mono">
              +40% Volume
            </span>
          </div>
        </div>
      </div>

      {/* 2. CORE PREDICTOR: Velocity & Surge Prediction Cards (3 Grid Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: High-Velocity Surge SKU */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                High-Velocity Surge SKU
              </span>
              <span className="text-xs font-bold text-amber-600 font-mono">
                +40% Surge
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              ORS Packets & Electrolytes
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Electral 21.8g / Prolyte Ready Packs (WHO Formulation)
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Forecasted Demand:</span>
                <span className="font-semibold text-slate-900 font-mono">180 Boxes / wk</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Current Godown Stock:</span>
                <span className="font-semibold text-amber-700 font-mono">18 Boxes (Critical Low)</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-amber-500 h-full w-[22%]" />
              </div>
              <span className="text-[11px] text-slate-500">
                ⚠️ Stockout risk in <strong>2.1 days</strong> at upcoming 43°C heat peak.
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
              <strong>Weather Trigger:</strong> Meteorological heat wave alert in Central India. Anticipated +40% retail off-take.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Recommendation: Stock 50+ units immediately
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Festive Stocking Alert */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Festive Stocking Alert
              </span>
              <span className="text-xs font-bold text-indigo-600 font-mono">
                +65% Festive Lift
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              Refined Oil & Sugar
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              15L Soybean Tins & 50kg Sugar M-30 Jute Consignments
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Advance Buffer Window:</span>
                <span className="font-semibold text-slate-900 font-mono">2 Weeks Prior</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Mandi Price Volatility:</span>
                <span className="font-semibold text-indigo-700 font-mono">+3.8% Expected Next Week</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-indigo-500 h-full w-[65%]" />
              </div>
              <span className="text-[11px] text-slate-500">
                💡 Pre-booking 60 tins locks in ~₹7,200 margin protection.
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
              <strong>Seasonal Cycle:</strong> Wholesale halwai and retail confectioner bulk stocking starts 14 days prior to festivals.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Recommendation: Stock up 2 weeks prior
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Dead Stock Warning */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Dead Stock Warning
              </span>
              <span className="text-xs font-bold text-rose-600 font-mono">
                Locked: ₹38,400
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              Slow-Moving Cold Cough Syrups
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Monsoon Expiry Batches (96 Bottles aging &gt;70 days)
            </p>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Sales Velocity Drop:</span>
                <span className="font-semibold text-rose-700 font-mono">-68% Velocity</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Days to Expiry:</span>
                <span className="font-semibold text-slate-900 font-mono">110 Days Left</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-rose-500 h-full w-[88%]" />
              </div>
              <span className="text-[11px] text-slate-500">
                ⚠️ C&F return window expires in 45 days. Action required now.
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-3.5 leading-relaxed">
              <strong>Risk Action:</strong> Clear existing batch to avoid dead capital and write-offs. Bundle with high-runner OTC items.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Recommendation: Liquidate slow stock
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recharts Line Graph: Demand Velocity Over Last 6 Months */}
      <DemandVelocityChart />

      {/* 4. Interactive "Ask Gemma 4 Inventory Advisor" Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                Ask Gemma 4 Inventory Advisor
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  Instant 3-Bullet Strategy
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Ask in Hinglish or English regarding festival preparation, dead stock liquidation, or distributor credit terms.
              </p>
            </div>
          </div>

          {advisorResult?.engineUsed && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Model: {advisorResult.engineUsed}
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            💡 Quick Mandi Scenarios (Click to consult):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(promptText);
                  handleAskAdvisor(promptText);
                }}
                className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 transition-colors text-left cursor-pointer active:scale-[0.98]"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea & Action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Diwali aane wali hai, mujhe kis item ka stock badhana chahiye aur distributor se kitna credit maangna chahiye?"
              className="w-full text-xs sm:text-sm bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/20 focus:border-slate-950 transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskAdvisor();
                }
              }}
            />
          </div>

          <button
            type="button"
            disabled={loading || !query.trim()}
            onClick={() => handleAskAdvisor()}
            className="sm:w-48 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-xs sm:text-sm rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:cursor-not-allowed self-stretch sm:self-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                <span>Auditing Stock...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Consult Advisor</span>
              </>
            )}
          </button>
        </div>

        {/* Live Advisor Strategy Output */}
        {advisorResult && (
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 tracking-wider uppercase block mb-1">
                  AI Strategic Brief // 3-Point Directive
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                  {advisorResult.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyStrategy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all cursor-pointer shrink-0"
                title="Copy stock strategy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* 3 Bullets */}
            <div className="grid grid-cols-1 gap-2.5">
              {advisorResult.bullets.map((bullet, bIdx) => (
                <div
                  key={bIdx}
                  className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                    {bIdx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>

            {/* Recommended Action Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Immediate Action:</span>
                <span className="font-bold text-slate-900 bg-slate-200/60 px-2.5 py-1 rounded-md">
                  {advisorResult.recommendedAction}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>Risk Level: <strong>{advisorResult.riskLevel}</strong></span>
                {advisorResult.latency && (
                  <span>• Latency: {advisorResult.latency}s</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Seasonal Demand Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              Seasonal Demand Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-category seasonal SKU calendar with AI inventory reorder thresholds and demand forecasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter Pills */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              {['All', 'Kirana & Staples', 'Pharma & Health', 'Hardware & Industrial'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-slate-950 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter SKUs..."
                className="text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950 transition-all w-36 sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3.5 px-4">Product / SKU Category</th>
                <th className="py-3.5 px-4">Peak Season / Month Window</th>
                <th className="py-3.5 px-4 text-center">Demand Outlook</th>
                <th className="py-3.5 px-4">AI Inventory Recommendation</th>
                <th className="py-3.5 px-4 text-right">Stock Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No matching SKUs found. Try resetting the category filter or search terms.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((sku) => {
                  let outlookBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      ⚖️ Stable
                    </span>
                  );

                  if (sku.demandOutlook === 'High Demand') {
                    outlookBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        🔥 High Demand
                      </span>
                    );
                  } else if (sku.demandOutlook === 'Off-Season') {
                    outlookBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        💤 Off-Season
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={sku.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-950">
                          {sku.skuName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                            {sku.category}
                          </span>
                          <span>•</span>
                          <span>{sku.unit}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{sku.peakSeason}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {outlookBadge}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium leading-relaxed">
                          {sku.recommendation}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-semibold text-slate-900">
                          {sku.currentStock} Units
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Min Reorder: {sku.minReorder}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
