import React, { useState } from 'react';
import { Download, ExternalLink, QrCode, Copy, Check } from 'lucide-react';
import { Customer, InventoryItem, PriceListItem, Voucher, LedgerEntry, OutboxItem } from '../types/entities';
import { exportToExcel, exportToCsv } from '../utils/sheetExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface WorkspaceTabsProps {
  vouchers: Voucher[];
  ledgerEntries: LedgerEntry[];
  customers: Customer[];
  inventory: InventoryItem[];
  priceList: PriceListItem[];
  outbox: OutboxItem[];
  onSelectVoucher?: (voucher: Voucher) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  vouchers,
  ledgerEntries,
  customers,
  inventory,
  priceList,
  outbox,
  onSelectVoucher,
}) => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'customers' | 'inventory' | 'outbox'>('vouchers');
  const [copiedOutboxId, setCopiedOutboxId] = useState<string | null>(null);

  const handleExportXlsx = () => {
    exportToExcel(vouchers, ledgerEntries, 'Voice2Vault_Ledger_Export');
  };

  const handleExportCsv = () => {
    exportToCsv(vouchers, 'Voice2Vault_Vouchers_Export');
  };

  const formatINR = (val: number) => {
    return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(val || 0));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCopyContent = (id: string, text: string) => {
    navigator?.clipboard?.writeText(text);
    setCopiedOutboxId(id);
    setTimeout(() => setCopiedOutboxId(null), 2000);
  };

  // Chart data for Customers & Risk
  const barChartData = customers.map((c) => ({
    name: c.name.split(' ')[0], // short name
    outstanding: c.current_balance,
    limit: c.credit_limit,
  }));

  const riskCounts = {
    Low: customers.filter((c) => c.current_balance <= c.credit_limit * 0.5).length,
    Medium: customers.filter((c) => c.current_balance > c.credit_limit * 0.5 && c.current_balance <= c.credit_limit).length,
    High: customers.filter((c) => c.current_balance > c.credit_limit).length,
  };

  const donutData = [
    { name: 'Low', value: riskCounts.Low || 1, color: '#2F6B3F' },
    { name: 'Medium', value: riskCounts.Medium || 1, color: '#9A5B00' },
    { name: 'High', value: riskCounts.High || 1, color: '#A7321F' },
  ];

  return (
    <div className="bg-white border border-[#E4E0D6] rounded-[8px] flex flex-col">
      {/* 48px Header row with underline tabs & secondary export buttons */}
      <div className="h-[48px] px-4 border-b border-[#E4E0D6] flex flex-wrap items-center justify-between gap-4">
        {/* Underline Tabs */}
        <div className="flex items-center gap-6 text-[14px]">
          {/* Master ledger */}
          <button
            type="button"
            onClick={() => setActiveTab('vouchers')}
            className={`pb-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vouchers'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Master ledger</span>
            <span className="text-[12px] text-[#8A8F96]">({vouchers.length})</span>
          </button>

          {/* Customers and risk */}
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`pb-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Customers and risk</span>
            <span className="text-[12px] text-[#8A8F96]">({customers.length})</span>
          </button>

          {/* Inventory and rates */}
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Inventory and rates</span>
            <span className="text-[12px] text-[#8A8F96]">({inventory.length})</span>
          </button>

          {/* Outbox */}
          <button
            type="button"
            onClick={() => setActiveTab('outbox')}
            className={`pb-2 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'outbox'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Outbox</span>
            <span className="text-[12px] text-[#8A8F96]">({outbox.length})</span>
          </button>
        </div>

        {/* Export buttons: both secondary white with 1px border */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportXlsx}
            className="h-[32px] px-3 text-[13px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.5] text-[#5B6168]" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="h-[32px] px-3 text-[13px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.5] text-[#5B6168]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Master ledger table */}
      {activeTab === 'vouchers' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-[#FBFAF7] text-[#5B6168] border-b border-[#E4E0D6] font-medium">
              <tr className="h-[40px]">
                <th className="px-4">Voucher</th>
                <th className="px-4">Date</th>
                <th className="px-4">Customer</th>
                <th className="px-4 text-right">Total bill</th>
                <th className="px-4 text-right">Paid</th>
                <th className="px-4 text-right">Due balance</th>
                <th className="px-4">Audit status</th>
                <th className="px-4">Risk level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {vouchers.map((v) => {
                const isHighRisk = v.creditRisk?.riskRating === 'HIGH_CREDIT_RISK';
                const isModerate = v.creditRisk?.riskRating === 'MODERATE';

                return (
                  <tr
                    key={v.id}
                    onClick={() => onSelectVoucher?.(v)}
                    className="h-[40px] hover:bg-[#FBFAF7] cursor-pointer transition-colors"
                  >
                    <td className="px-4 font-mono text-[12px] text-[#234E7D]">
                      {v.voucherNumber}
                    </td>
                    <td className="px-4 text-[#5B6168]">{formatDate(v.date)}</td>
                    <td className="px-4 font-medium text-[#1F2328]">{v.partyName}</td>
                    <td className="px-4 text-right tabular-nums text-[#1F2328]">
                      {formatINR(v.totalAmount)}
                    </td>
                    <td className="px-4 text-right tabular-nums text-[#5B6168]">
                      {formatINR(v.paidAmount)}
                    </td>
                    <td className="px-4 text-right font-medium tabular-nums text-[#1F2328]">
                      {formatINR(v.computedUdhaar)}
                    </td>
                    {/* Status with dot */}
                    <td className="px-4">
                      {v.hasMathAnomaly ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9A5B00]">
                          <span className="w-2 h-2 rounded-full bg-[#9A5B00]" />
                          <span>Mismatch fixed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#2F6B3F]">
                          <span className="w-2 h-2 rounded-full bg-[#2F6B3F]" />
                          <span>Audit OK</span>
                        </span>
                      )}
                    </td>
                    {/* Risk level with dot */}
                    <td className="px-4">
                      {isHighRisk ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#A7321F]">
                          <span className="w-2 h-2 rounded-full bg-[#A7321F]" />
                          <span>High</span>
                        </span>
                      ) : isModerate ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9A5B00]">
                          <span className="w-2 h-2 rounded-full bg-[#9A5B00]" />
                          <span>Medium</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#2F6B3F]">
                          <span className="w-2 h-2 rounded-full bg-[#2F6B3F]" />
                          <span>Low</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Customers and risk with 2 Recharts widgets */}
      {activeTab === 'customers' && (
        <div className="p-4 flex flex-col gap-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#E4E0D6]">
            {/* Bar Chart: Outstanding by Customer */}
            <div className="bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] p-3 flex flex-col gap-2">
              <div className="text-[13px] font-semibold text-[#1F2328]">Outstanding by customer</div>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5B6168' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#5B6168' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [formatINR(val), 'Outstanding']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E4E0D6', fontSize: 12, borderRadius: 6 }}
                    />
                    <Bar dataKey="outstanding" fill="#234E7D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Risk Distribution */}
            <div className="bg-[#FBFAF7] border border-[#E4E0D6] rounded-[6px] p-3 flex flex-col gap-2">
              <div className="text-[13px] font-semibold text-[#1F2328]">Risk distribution</div>
              <div className="h-[160px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} accounts`, `${name} risk`]}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E4E0D6', fontSize: 12, borderRadius: 6 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-col gap-1.5 text-[12px] text-[#5B6168] ml-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2F6B3F]" />
                    <span>Low ({riskCounts.Low})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#9A5B00]" />
                    <span>Medium ({riskCounts.Medium})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#A7321F]" />
                    <span>High ({riskCounts.High})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[#FBFAF7] text-[#5B6168] border-b border-[#E4E0D6] font-medium">
                <tr className="h-[40px]">
                  <th className="px-4">Customer name</th>
                  <th className="px-4">Area / Beat</th>
                  <th className="px-4">Phone</th>
                  <th className="px-4 text-right">Outstanding</th>
                  <th className="px-4 text-right">Credit limit</th>
                  <th className="px-4">Exposure</th>
                  <th className="px-4">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {customers.map((c) => {
                  const usagePercent = Math.min(100, Math.round((c.current_balance / c.credit_limit) * 100));
                  const isHigh = c.current_balance > c.credit_limit;
                  const isMed = c.current_balance > c.credit_limit * 0.5 && !isHigh;

                  return (
                    <tr key={c.id} className="h-[40px] hover:bg-[#FBFAF7] transition-colors">
                      <td className="px-4 font-medium text-[#1F2328]">{c.name}</td>
                      <td className="px-4 text-[#5B6168]">{c.beat}</td>
                      <td className="px-4 text-[#5B6168] font-mono text-[12px]">{c.phone}</td>
                      <td className="px-4 text-right font-medium tabular-nums text-[#1F2328]">
                        {formatINR(c.current_balance)}
                      </td>
                      <td className="px-4 text-right tabular-nums text-[#5B6168]">
                        {formatINR(c.credit_limit)}
                      </td>
                      <td className="px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-[#E4E0D6] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isHigh ? 'bg-[#A7321F]' : isMed ? 'bg-[#9A5B00]' : 'bg-[#2F6B3F]'}`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-[#5B6168] tabular-nums font-mono">{usagePercent}%</span>
                        </div>
                      </td>
                      <td className="px-4">
                        {isHigh ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#A7321F]">
                            <span className="w-2 h-2 rounded-full bg-[#A7321F]" />
                            <span>High</span>
                          </span>
                        ) : isMed ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9A5B00]">
                            <span className="w-2 h-2 rounded-full bg-[#9A5B00]" />
                            <span>Medium</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#2F6B3F]">
                            <span className="w-2 h-2 rounded-full bg-[#2F6B3F]" />
                            <span>Low</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory and rates */}
      {activeTab === 'inventory' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-[#FBFAF7] text-[#5B6168] border-b border-[#E4E0D6] font-medium">
              <tr className="h-[40px]">
                <th className="px-4">SKU</th>
                <th className="px-4">Commodity</th>
                <th className="px-4">Unit</th>
                <th className="px-4 text-right">Wholesale rate</th>
                <th className="px-4 text-right">Stock</th>
                <th className="px-4 text-right">Reorder level</th>
                <th className="px-4">Warehouse location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {inventory.map((item) => {
                const price = priceList.find((p) => p.sku === item.sku);
                const isLow = item.stock <= item.reorder_point;

                return (
                  <tr key={item.sku} className="h-[40px] hover:bg-[#FBFAF7] transition-colors">
                    <td className="px-4 font-mono text-[12px] text-[#5B6168]">{item.sku}</td>
                    <td className="px-4 font-medium text-[#1F2328]">{item.name}</td>
                    <td className="px-4 text-[#5B6168]">{item.unit}</td>
                    <td className="px-4 text-right tabular-nums text-[#1F2328]">
                      {price?.rate ? formatINR(price.rate) : '—'}
                    </td>
                    <td className="px-4 text-right font-medium tabular-nums">
                      <span className={isLow ? 'text-[#A7321F]' : 'text-[#1F2328]'}>{item.stock}</span>
                    </td>
                    <td className="px-4 text-right tabular-nums text-[#8A8F96]">{item.reorder_point}</td>
                    <td className="px-4 text-[#5B6168]">{item.godown}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Outbox */}
      {activeTab === 'outbox' && (
        <div className="p-4 flex flex-col gap-3">
          <div className="text-[12px] text-[#5B6168] bg-[#FBFAF7] border border-[#E4E0D6] p-2 rounded-[6px]">
            Draft only, nothing is auto-sent. Review messages and payment links before sending.
          </div>

          {outbox.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#5B6168]">
              No messages in outbox.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outbox.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E4E0D6] rounded-[6px] p-3.5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[14px] text-[#1F2328]">{item.partyName}</div>
                      <span className="text-[11px] text-[#5B6168] border border-[#E4E0D6] px-1.5 py-0.5 rounded-[4px]">
                        Draft
                      </span>
                    </div>
                    <div className="text-[12px] text-[#5B6168] font-mono mt-0.5">{item.phone}</div>

                    <pre className="mt-2 p-2 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[12px] font-sans whitespace-pre-wrap text-[#1F2328] leading-relaxed max-h-[140px] overflow-y-auto">
                      {item.content}
                    </pre>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E0D6]">
                    <button
                      type="button"
                      onClick={() => handleCopyContent(item.id, item.content)}
                      className="h-[32px] px-2.5 text-[12px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedOutboxId === item.id ? <Check className="w-3.5 h-3.5 text-[#2F6B3F]" /> : <Copy className="w-3.5 h-3.5 text-[#5B6168]" />}
                      <span>{copiedOutboxId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <a
                      href={`https://wa.me/${(item.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(item.content)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-[32px] px-3 text-[12px] font-medium rounded-[6px] bg-[#234E7D] text-white hover:bg-[#1B4068] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open wa.me</span>
                      <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
