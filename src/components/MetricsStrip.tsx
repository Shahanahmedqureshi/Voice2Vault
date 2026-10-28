import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { RunMetrics } from '../types/agent';
import { Voucher, LedgerEntry } from '../types/entities';
import { db } from '../store/db';

export interface MetricsStripProps {
  metrics: RunMetrics;
  isExecuting: boolean;
  activeTaskCount: number;
  totalTaskCount?: number;
  pendingApprovalCount?: number;
  hasFailedTasks?: boolean;
  vouchers?: Voucher[];
  ledgerEntries?: LedgerEntry[];
}

interface DailyTrendPoint {
  dateKey: string;
  displayDate: string;
  fullDate: string;
  revenue: number;
  collected: number;
  invoiceCount: number;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatCompactINR = (val: number): string => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
  return `₹${val}`;
};

const formatShortDate = (dateStr: string): string => {
  try {
    const clean = dateStr.split(' ')[0].split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[monthIdx] || ''}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
};

const formatFullDate = (dateStr: string): string => {
  try {
    const clean = dateStr.split(' ')[0].split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      return `${day} ${months[monthIdx] || ''} ${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
};

// Compact sparkline tooltip
interface MiniTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyTrendPoint;
    value: number;
  }>;
}

const CustomMiniTooltip: React.FC<MiniTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div className="bg-[#FFFFFF] border border-[#E4E0D6] px-2 py-1 rounded-[4px] shadow-sm text-[11px] pointer-events-none">
        <div className="text-[#5B6168] text-[10px]">{point.displayDate}</div>
        <div className="text-[#234E7D] font-mono tabular-nums font-semibold">
          {formatINR(point.revenue)}
        </div>
      </div>
    );
  }
  return null;
};

// Expanded detailed chart tooltip
interface ExpandedTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyTrendPoint;
    value: number;
    dataKey: string;
  }>;
}

const CustomExpandedTooltip: React.FC<ExpandedTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload;
    return (
      <div className="bg-[#FFFFFF] border border-[#E4E0D6] p-2.5 rounded-[6px] shadow-sm text-[12px] min-w-[150px] pointer-events-none">
        <div className="text-[#5B6168] text-[11px] font-medium border-b border-[#E4E0D6] pb-1 mb-1.5">
          {point.fullDate}
        </div>
        <div className="flex items-center justify-between gap-3 text-[#1F2328]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#234E7D]" />
            <span>Revenue</span>
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#234E7D]">
            {formatINR(point.revenue)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[#5B6168] mt-1 text-[11px]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#2F6B3F]" />
            <span>Collected</span>
          </span>
          <span className="font-mono tabular-nums text-[#2F6B3F]">
            {formatINR(point.collected)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[#8A8F96] mt-1 pt-1 border-t border-[#E4E0D6] text-[10px]">
          <span>Sales Invoices</span>
          <span className="font-mono tabular-nums text-[#1F2328]">{point.invoiceCount}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const MetricsStrip: React.FC<MetricsStripProps> = ({
  metrics,
  isExecuting,
  activeTaskCount,
  totalTaskCount = 0,
  pendingApprovalCount = 0,
  hasFailedTasks = false,
  vouchers,
  ledgerEntries,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine status and dot color
  let statusText = 'Ready';
  let dotColor = 'bg-[#8A8F96]'; // grey idle

  if (isExecuting) {
    statusText = 'Running';
    dotColor = 'bg-[#234E7D]'; // accent running
  } else if (pendingApprovalCount > 0) {
    statusText = 'Waiting for approval';
    dotColor = 'bg-[#9A5B00]'; // amber waiting
  } else if (hasFailedTasks) {
    statusText = 'Failed';
    dotColor = 'bg-[#A7321F]'; // red failed
  } else if (metrics.totalTasksCompleted > 0) {
    statusText = 'Completed';
    dotColor = 'bg-[#2F6B3F]'; // green completed
  }

  const tasksCompleted = metrics.totalTasksCompleted;
  const tasksDisplay = totalTaskCount > 0 ? `${tasksCompleted} of ${totalTaskCount}` : `${tasksCompleted}`;

  // Aggregate daily revenue trends from vouchers and ledger history
  const trendData = useMemo<DailyTrendPoint[]>(() => {
    const dataSourceVouchers = vouchers && vouchers.length > 0 ? vouchers : db.getVouchers();
    const map = new Map<string, { revenue: number; collected: number; count: number }>();

    if (dataSourceVouchers.length > 0) {
      dataSourceVouchers.forEach((v) => {
        const rawDate = v.date || '';
        const dateKey = rawDate.split(' ')[0].split('T')[0] || '2026-10-15';
        const existing = map.get(dateKey) || { revenue: 0, collected: 0, count: 0 };
        existing.revenue += Number(v.totalAmount) || 0;
        existing.collected += Number(v.paidAmount) || 0;
        existing.count += 1;
        map.set(dateKey, existing);
      });
    } else {
      const dataSourceLedger = ledgerEntries && ledgerEntries.length > 0 ? ledgerEntries : db.getLedgerEntries();
      dataSourceLedger.forEach((entry) => {
        const rawDate = entry.date || '';
        const dateKey = rawDate.split(' ')[0].split('T')[0] || '2026-10-15';
        const existing = map.get(dateKey) || { revenue: 0, collected: 0, count: 0 };
        existing.revenue += Number(entry.debit) || 0;
        existing.collected += Number(entry.credit) || 0;
        existing.count += 1;
        map.set(dateKey, existing);
      });
    }

    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((key) => {
      const item = map.get(key)!;
      return {
        dateKey: key,
        displayDate: formatShortDate(key),
        fullDate: formatFullDate(key),
        revenue: item.revenue,
        collected: item.collected,
        invoiceCount: item.count,
      };
    });
  }, [vouchers, ledgerEntries]);

  // Aggregate metrics
  const totalPeriodRevenue = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [trendData]);

  const totalPeriodCollected = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.collected, 0);
  }, [trendData]);

  const peakDay = useMemo(() => {
    if (trendData.length === 0) return { revenue: 0, displayDate: '-' };
    return trendData.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), trendData[0]);
  }, [trendData]);

  const averageDailyRevenue = useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.round(totalPeriodRevenue / trendData.length);
  }, [trendData, totalPeriodRevenue]);

  return (
    <div className="bg-[#FBFAF7] border-b border-[#E4E0D6] px-6 text-[13px] text-[#5B6168]">
      <div className="max-w-[1440px] w-full mx-auto min-h-[40px] py-1 flex items-center justify-between gap-4 flex-wrap">
        {/* Left Section: Operational Run Status & Counters */}
        <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
          {/* Status dot + text */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
            <span className="font-medium text-[#1F2328]">{statusText}</span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#E4E0D6]" />

          {/* Tasks */}
          <div className="flex items-center gap-1.5">
            <span>Tasks</span>
            <span className="text-[#1F2328] font-medium tabular-nums">{tasksDisplay}</span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#E4E0D6]" />

          {/* Retries */}
          <div className="flex items-center gap-1.5">
            <span>Retries</span>
            <span className="text-[#1F2328] font-medium tabular-nums">{metrics.totalRetries}</span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#E4E0D6]" />

          {/* Waiting for approval */}
          <div className="flex items-center gap-1.5">
            <span>Waiting for approval</span>
            <span className={`font-medium tabular-nums ${pendingApprovalCount > 0 ? 'text-[#9A5B00]' : 'text-[#1F2328]'}`}>
              {pendingApprovalCount}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#E4E0D6]" />

          {/* Run time */}
          <div className="flex items-center gap-1.5">
            <span>Run time</span>
            <span className="text-[#1F2328] font-medium tabular-nums">{metrics.lastRunDurationMs} ms</span>
          </div>
        </div>

        {/* Right Section: Recharts Daily Revenue Line Chart */}
        <div className="flex items-center gap-3 ml-auto pl-4 border-l border-[#E4E0D6] shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#234E7D]" />
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8A8F96]">Daily revenue</span>
                <span className="text-[13px] font-semibold text-[#1F2328] font-mono tabular-nums">
                  {formatINR(totalPeriodRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Embedded Recharts Sparkline */}
          {trendData.length > 0 ? (
            <div
              className="w-[120px] h-[26px] bg-[#FFFFFF] border border-[#E4E0D6] rounded-[4px] px-1 py-0.5 cursor-pointer hover:border-[#234E7D] transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
              title="Click to view detailed revenue trend chart"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <Tooltip content={<CustomMiniTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#234E7D"
                    strokeWidth={1.5}
                    dot={{ r: 1.5, fill: '#234E7D', strokeWidth: 0 }}
                    activeDot={{ r: 3, fill: '#234E7D', stroke: '#FFFFFF', strokeWidth: 1 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <span className="text-[11px] text-[#8A8F96]">No ledger data</span>
          )}

          {/* Expand/Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] px-2 py-0.5 border border-[#E4E0D6] rounded-[4px] bg-[#FFFFFF] hover:bg-[#F6F4EF] text-[#5B6168] hover:text-[#1F2328] flex items-center gap-1 transition-colors cursor-pointer"
            aria-expanded={isExpanded}
            title={isExpanded ? 'Collapse revenue trend' : 'Expand daily revenue chart'}
          >
            <span>{isExpanded ? 'Hide' : 'Trend'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Detailed Recharts Line Chart View */}
      {isExpanded && (
        <div className="border-t border-[#E4E0D6] py-3.5 max-w-[1440px] mx-auto bg-[#FFFFFF] rounded-b-[6px] mb-2 px-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-[#E4E0D6]">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#234E7D]" />
                <h4 className="text-[14px] font-semibold text-[#1F2328]">Daily Sales Revenue Trend</h4>
              </div>
              <p className="text-[12px] text-[#5B6168] mt-0.5">
                Computed from ledger dispatch vouchers, showing billed sales volume and cash collection realization over time.
              </p>
            </div>

            {/* Quick KPI summary tags */}
            <div className="flex items-center gap-3 text-[12px]">
              <div className="bg-[#FBFAF7] border border-[#E4E0D6] px-2.5 py-1 rounded-[4px]">
                <span className="text-[#8A8F96] text-[11px] block">Period Total</span>
                <span className="font-mono tabular-nums font-semibold text-[#1F2328]">{formatINR(totalPeriodRevenue)}</span>
              </div>
              <div className="bg-[#FBFAF7] border border-[#E4E0D6] px-2.5 py-1 rounded-[4px]">
                <span className="text-[#8A8F96] text-[11px] block">Collected</span>
                <span className="font-mono tabular-nums font-semibold text-[#2F6B3F]">{formatINR(totalPeriodCollected)}</span>
              </div>
              <div className="bg-[#FBFAF7] border border-[#E4E0D6] px-2.5 py-1 rounded-[4px]">
                <span className="text-[#8A8F96] text-[11px] block">Peak Day ({peakDay.displayDate})</span>
                <span className="font-mono tabular-nums font-semibold text-[#234E7D]">{formatINR(peakDay.revenue)}</span>
              </div>
              <div className="bg-[#FBFAF7] border border-[#E4E0D6] px-2.5 py-1 rounded-[4px]">
                <span className="text-[#8A8F96] text-[11px] block">Avg Daily</span>
                <span className="font-mono tabular-nums font-semibold text-[#1F2328]">{formatINR(averageDailyRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Full Recharts Line Chart with Grid, Axes, and Legend */}
          <div className="w-full h-[180px] pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 4, left: 10 }}>
                <CartesianGrid stroke="#E4E0D6" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#5B6168' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E4E0D6' }}
                />
                <YAxis
                  tickFormatter={formatCompactINR}
                  tick={{ fontSize: 11, fill: '#5B6168' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E4E0D6' }}
                  width={45}
                />
                <Tooltip content={<CustomExpandedTooltip />} />
                <Line
                  name="Sales Revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#234E7D"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#234E7D', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#234E7D', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                <Line
                  name="Realized Cash"
                  type="monotone"
                  dataKey="collected"
                  stroke="#2F6B3F"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={{ r: 2.5, fill: '#2F6B3F', stroke: '#FFFFFF', strokeWidth: 1 }}
                  activeDot={{ r: 4, fill: '#2F6B3F', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart footer legend */}
          <div className="flex items-center justify-between text-[11px] text-[#5B6168] mt-2 pt-2 border-t border-[#E4E0D6]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#234E7D] inline-block" />
                <span>Sales Revenue (Total Invoiced)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#2F6B3F] inline-block border-b border-dashed border-[#2F6B3F]" />
                <span>Realized Cash & UPI</span>
              </div>
            </div>
            <span className="text-[#8A8F96]">
              {trendData.length} ledger days recorded &bull; Real-time synchronization
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

