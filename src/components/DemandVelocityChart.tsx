import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Flame, AlertTriangle, Sparkles, Activity, Check } from 'lucide-react';

interface MonthlyVelocityData {
  month: string;
  ors: number;
  oilSugar: number;
  coughSyrup: number;
  glucose: number;
  isForecast?: boolean;
}

const VELOCITY_HISTORY: MonthlyVelocityData[] = [
  { month: 'Nov 2025', ors: 42, oilSugar: 180, coughSyrup: 110, glucose: 35 },
  { month: 'Dec 2025', ors: 48, oilSugar: 120, coughSyrup: 165, glucose: 30 },
  { month: 'Jan 2026', ors: 55, oilSugar: 95, coughSyrup: 178, glucose: 38 },
  { month: 'Feb 2026', ors: 82, oilSugar: 110, coughSyrup: 92, glucose: 60 },
  { month: 'Mar 2026', ors: 135, oilSugar: 145, coughSyrup: 45, glucose: 105 },
  { month: 'Apr 2026 (Fcst)', ors: 195, oilSugar: 175, coughSyrup: 28, glucose: 160, isForecast: true },
];

interface SkuConfig {
  id: 'all' | 'ors' | 'oilSugar' | 'coughSyrup' | 'glucose';
  key: keyof Omit<MonthlyVelocityData, 'month' | 'isForecast'> | 'all';
  label: string;
  shortLabel: string;
  color: string;
  category: string;
  trend: string;
  badge: string;
  statusType: 'surge' | 'festive' | 'deadstock' | 'summer';
}

const SKU_OPTIONS: SkuConfig[] = [
  {
    id: 'all',
    key: 'all',
    label: 'All Monitored SKUs (Comparative)',
    shortLabel: 'All High-Impact SKUs',
    color: '#0F172A',
    category: 'Multi-SKU',
    trend: '+40% Avg Shift',
    badge: '📊 Multi-Line View',
    statusType: 'surge',
  },
  {
    id: 'ors',
    key: 'ors',
    label: 'ORS Packets & Electrolytes',
    shortLabel: 'ORS & Electrolytes',
    color: '#F59E0B',
    category: 'Pharma / Surge',
    trend: '+364.3% Surge',
    badge: '🔥 +40% MoM Surge',
    statusType: 'surge',
  },
  {
    id: 'oilSugar',
    key: 'oilSugar',
    label: 'Refined Oil & Sugar (15L Tins & 50kg Bags)',
    shortLabel: 'Refined Oil & Sugar',
    color: '#6366F1',
    category: 'Kirana / Festive',
    trend: '+84.2% Seasonal Lift',
    badge: '🎉 Festive Booking',
    statusType: 'festive',
  },
  {
    id: 'coughSyrup',
    key: 'coughSyrup',
    label: 'Slow-Moving Cold Cough Syrups',
    shortLabel: 'Cold Cough Syrups',
    color: '#E11D48',
    category: 'Pharma / Dead Stock',
    trend: '-84.3% Drop from Peak',
    badge: '⚠️ Dead Stock Risk',
    statusType: 'deadstock',
  },
  {
    id: 'glucose',
    key: 'glucose',
    label: 'Glucose-D & Hydration Jars',
    shortLabel: 'Glucose-D Hydration',
    color: '#10B981',
    category: 'FMCG / Summer',
    trend: '+357% Volume Ramp',
    badge: '☀️ Summer Lift',
    statusType: 'summer',
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isForecast = String(label).includes('Fcst');
    return (
      <div className="bg-slate-950 text-white rounded-xl p-3.5 shadow-xl border border-slate-800 text-xs min-w-[210px] animate-in fade-in duration-150">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
          <span className="font-semibold text-slate-200">{label}</span>
          {isForecast ? (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
              🔮 AI Forecast
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">Actuals</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300 truncate max-w-[130px]">{entry.name}</span>
              </div>
              <span className="font-mono font-bold text-white">
                {entry.value}{' '}
                <span className="text-[10px] text-slate-400 font-normal">units</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const DemandVelocityChart: React.FC = () => {
  const [selectedSku, setSelectedSku] = useState<'all' | 'ors' | 'oilSugar' | 'coughSyrup' | 'glucose'>('all');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm flex flex-col gap-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-bold text-indigo-700 tracking-wider uppercase">
              Recharts Analytics Engine // 6-Month Rolling Window
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Demand Velocity Over Last 6 Months
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracking sales velocity (monthly cases dispatched) from Nov 2025 through April 2026 forecast across key Mandi SKUs.
          </p>
        </div>

        {/* Selected View KPI Indicator */}
        <div className="flex items-center gap-2 self-start lg:self-auto bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600">
            Window: <strong className="text-slate-900 font-mono">Nov 2025 – Apr 2026</strong>
          </span>
        </div>
      </div>

      {/* 2. Interactive SKU Selector Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Select SKU:
        </span>
        {SKU_OPTIONS.map((sku) => {
          const isSelected = selectedSku === sku.id;
          return (
            <button
              key={sku.id}
              type="button"
              onClick={() => setSelectedSku(sku.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border active:scale-[0.98] ${
                isSelected
                  ? 'bg-slate-950 text-white border-slate-950 shadow-2xs font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {sku.id !== 'all' && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: sku.color }}
                />
              )}
              <span>{sku.shortLabel}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {sku.trend}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Recharts Line Chart Container */}
      <div className="w-full h-[320px] pt-2">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={VELOCITY_HISTORY}
            margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              dy={8}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-5}
              unit=" u"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 16, fontSize: 11 }}
            />

            {/* Reference line separating historical actuals from the April forecast */}
            <ReferenceLine
              x="Mar 2026"
              stroke="#CBD5E1"
              strokeDasharray="4 4"
              label={{
                value: 'AI Forecast ▶',
                position: 'top',
                fill: '#94A3B8',
                fontSize: 10,
              }}
            />

            {/* ORS Packets Line (Amber) */}
            {(selectedSku === 'all' || selectedSku === 'ors') && (
              <Line
                type="monotone"
                dataKey="ors"
                name="ORS & Electrolytes"
                stroke="#F59E0B"
                strokeWidth={selectedSku === 'ors' ? 3.5 : 2.5}
                dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#F59E0B', stroke: '#FEF3C7', strokeWidth: 3 }}
              />
            )}

            {/* Refined Oil & Sugar Line (Indigo) */}
            {(selectedSku === 'all' || selectedSku === 'oilSugar') && (
              <Line
                type="monotone"
                dataKey="oilSugar"
                name="Refined Oil & Sugar"
                stroke="#6366F1"
                strokeWidth={selectedSku === 'oilSugar' ? 3.5 : 2.5}
                dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#6366F1', stroke: '#EEF2FF', strokeWidth: 3 }}
              />
            )}

            {/* Cold Cough Syrups Line (Rose) */}
            {(selectedSku === 'all' || selectedSku === 'coughSyrup') && (
              <Line
                type="monotone"
                dataKey="coughSyrup"
                name="Cold Cough Syrups"
                stroke="#E11D48"
                strokeWidth={selectedSku === 'coughSyrup' ? 3.5 : 2.5}
                dot={{ r: 4, fill: '#E11D48', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#E11D48', stroke: '#FFE4E6', strokeWidth: 3 }}
              />
            )}

            {/* Glucose-D Line (Emerald) */}
            {(selectedSku === 'all' || selectedSku === 'glucose') && (
              <Line
                type="monotone"
                dataKey="glucose"
                name="Glucose-D Hydration"
                stroke="#10B981"
                strokeWidth={selectedSku === 'glucose' ? 3.5 : 2}
                strokeDasharray={selectedSku === 'all' ? '4 4' : undefined}
                dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#10B981', stroke: '#D1FAE5', strokeWidth: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Bottom Metric Takeaway Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
          <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-900 block">
              Highest Velocity Surge: ORS & Electrolytes
            </span>
            <span className="text-[11px] text-amber-700">
              Surged from 42 to 195 units/mo (+364%) as temperature climbs past 40°C.
            </span>
          </div>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-900 block">
              Cyclical Festive Peak: Oil & Sugar
            </span>
            <span className="text-[11px] text-indigo-700">
              Rebounding from 95 to 175 units/mo ahead of pre-festive wholesale runs.
            </span>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-900 block">
              Severe Slump Alert: Cough Syrups
            </span>
            <span className="text-[11px] text-rose-700">
              Dropped -84% from winter peak (178 to 28 units), creating dead capital.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
