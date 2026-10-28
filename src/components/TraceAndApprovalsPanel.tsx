import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ApprovalRequest, AgentMessage, AuditLogEntry } from '../types/agent';

interface TraceAndApprovalsPanelProps {
  approvals: ApprovalRequest[];
  messages: AgentMessage[];
  auditLogs: AuditLogEntry[];
  onResolveApproval: (approvalId: string, decision: 'APPROVE' | 'REJECT', chosenValue?: any) => void;
}

export const TraceAndApprovalsPanel: React.FC<TraceAndApprovalsPanelProps> = ({
  approvals,
  messages,
  auditLogs,
  onResolveApproval,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'messages' | 'activity_log'>('approvals');
  const [selectedApprovalValues, setSelectedApprovalValues] = useState<Record<string, any>>({});
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Record<string, boolean>>({});

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  const togglePayload = (id: string) => {
    setExpandedPayloadIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDecision = (approval: ApprovalRequest, decision: 'APPROVE' | 'REJECT') => {
    const chosenValue =
      selectedApprovalValues[approval.id] ??
      (approval.options?.find((o) => o.isRecommended)?.value ?? approval.options?.[0]?.value);

    onResolveApproval(approval.id, decision, chosenValue);
  };

  return (
    <div className="bg-white border border-[#E4E0D6] rounded-[8px] flex flex-col h-full min-h-[460px]">
      {/* 48px Header row with underline tabs */}
      <div className="h-[48px] px-4 border-b border-[#E4E0D6] flex items-center justify-between">
        <div className="flex items-center gap-4 text-[13px]">
          {/* Approvals tab */}
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`pb-1 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approvals'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Approvals</span>
            <span className="text-[#8A8F96]">({pendingApprovals.length})</span>
          </button>

          {/* Messages tab */}
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`pb-1 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Messages</span>
            <span className="text-[#8A8F96]">({messages.length})</span>
          </button>

          {/* Activity log tab */}
          <button
            type="button"
            onClick={() => setActiveTab('activity_log')}
            className={`pb-1 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activity_log'
                ? 'border-[#234E7D] text-[#234E7D]'
                : 'border-transparent text-[#5B6168] hover:text-[#1F2328]'
            }`}
          >
            <span>Activity log</span>
            <span className="text-[#8A8F96]">({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Tab 1: Approvals */}
        {activeTab === 'approvals' && (
          <div className="flex flex-col gap-3">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
                <p className="text-[14px] font-medium text-[#1F2328]">Nothing is waiting for approval.</p>
                <p className="text-[13px] text-[#5B6168] mt-1">
                  When a task detects a discrepancy or over-limit balance, it will pause here.
                </p>
              </div>
            ) : (
              pendingApprovals.map((approval) => {
                const isMathMismatch = approval.type === 'MATH_MISMATCH';
                const statedVal = approval.metadata?.statedUdhaar ?? 29000;
                const computedVal = approval.metadata?.computedUdhaar ?? 27000;

                return (
                  <div
                    key={approval.id}
                    className="p-3.5 bg-white border border-[#E4E0D6] rounded-[6px] flex flex-col gap-3"
                  >
                    {/* Title */}
                    <div>
                      <div className="text-[14px] font-semibold text-[#1F2328]">
                        {approval.title}
                      </div>
                      <p className="text-[13px] text-[#5B6168] mt-1 leading-relaxed">
                        {approval.description}
                      </p>
                    </div>

                    {/* Itemized list extracted from image/note */}
                    {approval.metadata?.items && approval.metadata.items.length > 0 && (
                      <div className="border border-[#E4E0D6] rounded-[6px] overflow-hidden text-[12px]">
                        <div className="bg-[#FBFAF7] px-3 py-1.5 font-medium text-[#5B6168] border-b border-[#E4E0D6] flex justify-between items-center">
                          <span>Extracted items ({approval.metadata.items.length})</span>
                          <span className="font-mono text-[11px] text-[#1F2328]">
                            Total: ₹{Number(approval.metadata?.total || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="max-h-[140px] overflow-y-auto divide-y divide-[#E4E0D6]">
                          {approval.metadata.items.map((it: any, itIdx: number) => (
                            <div key={itIdx} className="px-3 py-1.5 flex items-center justify-between">
                              <div className="truncate max-w-[170px]">
                                <span className="font-medium text-[#1F2328]">{it.particulars}</span>
                                <span className="text-[#8A8F96] text-[11px] ml-1">({it.qty} {it.unit})</span>
                              </div>
                              <span className="font-mono tabular-nums text-[#1F2328] font-medium shrink-0">
                                ₹{Number(it.lineTotal || (it.qty * it.estRate) || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer match comparison table: As heard -> Matched to */}
                    {approval.metadata?.asHeard && approval.metadata?.matchedTo && (
                      <div className="border border-[#E4E0D6] rounded-[6px] overflow-hidden text-[13px] bg-[#FBFAF7] p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] text-[#5B6168]">
                          <span>As heard in request</span>
                          <span>Matched customer in system</span>
                        </div>
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-[#234E7D] font-semibold">"{approval.metadata.asHeard}"</span>
                          <span className="text-[#8A8F96]">&rarr;</span>
                          <span className="text-[#2F6B3F] font-semibold">"{approval.metadata.matchedTo}"</span>
                        </div>
                        {approval.metadata.evidence && (
                          <div className="text-[11px] text-[#5B6168] border-t border-[#E4E0D6] pt-1.5 flex items-center justify-between">
                            <span>Evidence quote: <span className="font-mono text-[#1F2328]">"{approval.metadata.evidence}"</span></span>
                            <span className="font-mono text-[#8A8F96]">({Math.round((approval.metadata.similarity || 0) * 100)}% match)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Two-column comparison table for math check */}
                    {isMathMismatch && (
                      <div className="border border-[#E4E0D6] rounded-[6px] overflow-hidden text-[13px]">
                        <div className="grid grid-cols-2 bg-[#FBFAF7] border-b border-[#E4E0D6] px-3 py-1.5 font-medium text-[#5B6168]">
                          <div>Stated in note</div>
                          <div>Computed from bill</div>
                        </div>
                        <div className="grid grid-cols-2 px-3 py-2 font-mono tabular-nums">
                          <div className="text-[#9A5B00]">₹{Number(statedVal).toLocaleString('en-IN')}</div>
                          <div className="text-[#2F6B3F] font-semibold">₹{Number(computedVal).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    )}

                    {/* Radio choices */}
                    {approval.options && approval.options.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[12px] font-medium text-[#5B6168]">Choice</div>
                        {approval.options.map((opt, i) => {
                          const isSelected =
                            selectedApprovalValues[approval.id] !== undefined
                              ? selectedApprovalValues[approval.id] === opt.value
                              : opt.isRecommended;

                          return (
                            <label
                              key={i}
                              className={`flex items-center gap-2 p-2 rounded-[6px] text-[13px] border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#E8EFF7] border-[#234E7D] text-[#1F2328]'
                                  : 'bg-white border-[#E4E0D6] text-[#5B6168] hover:bg-[#FBFAF7]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`approval-${approval.id}`}
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedApprovalValues((prev) => ({
                                    ...prev,
                                    [approval.id]: opt.value,
                                  }))
                                }
                                className="accent-[#234E7D]"
                              />
                              <span>{opt.label.replace('(Recommended)', '')}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Buttons: Approve (primary), Edit (secondary), Reject (secondary danger) */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E0D6]">
                      {/* Reject button */}
                      <button
                        type="button"
                        onClick={() => handleDecision(approval, 'REJECT')}
                        className="h-[36px] px-3 text-[13px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#A7321F] hover:bg-[#FAE8E4] transition-colors cursor-pointer"
                      >
                        Reject
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleDecision(approval, 'APPROVE')}
                        className="h-[36px] px-3 text-[13px] font-medium rounded-[6px] border border-[#E4E0D6] bg-white text-[#1F2328] hover:bg-[#FBFAF7] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>

                      {/* Approve button */}
                      <button
                        type="button"
                        onClick={() => handleDecision(approval, 'APPROVE')}
                        className="h-[36px] px-4 text-[13px] font-medium rounded-[6px] bg-[#234E7D] text-white hover:bg-[#1B4068] transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Messages */}
        {activeTab === 'messages' && (
          <div className="flex flex-col gap-2">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#5B6168]">
                No messages recorded yet.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-2.5 bg-white border border-[#E4E0D6] rounded-[6px] text-[13px] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-[12px] text-[#5B6168]">
                    <span className="font-medium text-[#1F2328]">
                      {msg.from} → {msg.to}
                    </span>
                    <span className="text-[#8A8F96]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[13px] text-[#1F2328] font-medium">{msg.type}</div>

                  {msg.payload && (
                    <div>
                      <button
                        type="button"
                        onClick={() => togglePayload(msg.id)}
                        className="text-[11px] text-[#234E7D] hover:underline flex items-center gap-1 cursor-pointer mt-1"
                      >
                        {expandedPayloadIds[msg.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{expandedPayloadIds[msg.id] ? 'Hide details' : 'View details'}</span>
                      </button>
                      {expandedPayloadIds[msg.id] && (
                        <pre className="mt-1 p-2 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[11px] font-mono overflow-x-auto text-[#1F2328]">
                          {JSON.stringify(msg.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Activity Log */}
        {activeTab === 'activity_log' && (
          <div className="flex flex-col gap-2">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#5B6168]">
                No activity logged yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-white border border-[#E4E0D6] rounded-[6px] text-[13px] flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#1F2328]">
                      {log.agent} · {log.tool}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#8A8F96] tabular-nums font-mono">
                        {log.durationMs} ms
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-[4px] border ${
                          log.status === 'SUCCESS'
                            ? 'text-[#2F6B3F] border-[#E7F1EA] bg-[#E7F1EA]'
                            : log.status === 'RETRY'
                            ? 'text-[#9A5B00] border-[#FBF0DC] bg-[#FBF0DC]'
                            : 'text-[#A7321F] border-[#FAE8E4] bg-[#FAE8E4]'
                        }`}
                      >
                        {log.status.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {log.error && (
                    <div className="text-[12px] text-[#A7321F] bg-[#FAE8E4] p-1.5 rounded-[4px] mt-1">
                      {log.error}
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() => togglePayload(log.id)}
                      className="text-[11px] text-[#234E7D] hover:underline flex items-center gap-1 cursor-pointer mt-1"
                    >
                      {expandedPayloadIds[log.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{expandedPayloadIds[log.id] ? 'Hide details' : 'View details'}</span>
                    </button>
                    {expandedPayloadIds[log.id] && (
                      <div className="mt-1 p-2 bg-[#FBFAF7] border border-[#E4E0D6] rounded-[4px] text-[11px] font-mono overflow-x-auto text-[#1F2328]">
                        <div>Inputs: {JSON.stringify(log.inputs)}</div>
                        {log.outputs && <div className="mt-1">Outputs: {JSON.stringify(log.outputs)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
