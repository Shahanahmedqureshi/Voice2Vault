import React from 'react';
import {
  Check,
  Loader2,
  Clock,
  AlertCircle,
  Pause,
  ArrowDown,
} from 'lucide-react';
import { Task, TaskPlan, TaskStatus } from '../types/agent';

interface LiveDagViewProps {
  plan: TaskPlan | null;
  isPlanning?: boolean;
  onSelectTask?: (task: Task) => void;
}

export const LiveDagView: React.FC<LiveDagViewProps> = ({ plan, isPlanning = false, onSelectTask }) => {
  return (
    <div className="bg-white border border-[#E4E0D6] rounded-[8px] flex flex-col h-full min-h-[460px]">
      {/* 48px Header row */}
      <div className="h-[48px] px-4 border-b border-[#E4E0D6] flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#1F2328]">Task plan</h2>

        {isPlanning ? (
          <div className="flex items-center gap-1.5 text-[12px] text-[#234E7D] font-medium bg-[#E8EFF7] px-2 py-0.5 rounded-[4px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2]" />
            <span>Planning DAG...</span>
          </div>
        ) : plan ? (
          <div className="flex items-center gap-2 text-[12px] text-[#5B6168]">
            {plan.isFallbackPlan && (
              <span className="text-[11px] text-[#9A5B00] bg-[#FBF0DC] border border-[#E4E0D6] px-1.5 py-0.5 rounded-[4px]">
                Template plan
              </span>
            )}
            <span>{plan.tasks.length} tasks</span>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-start">
        {isPlanning && !plan ? (
          /* Active Planning State with animated pipeline */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-[#E8EFF7] border border-[#234E7D]/20 flex items-center justify-center mb-3">
              <Loader2 className="w-5 h-5 text-[#234E7D] animate-spin stroke-[2]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1F2328]">Synthesizing agent pipeline...</p>
            <p className="text-[12px] text-[#5B6168] mt-1 max-w-[280px]">
              Analyzing natural request, validating entities, and setting up verification gates.
            </p>
            <div className="w-48 h-1.5 bg-[#E4E0D6] rounded-full overflow-hidden mt-4">
              <div className="h-full bg-[#234E7D] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : !plan ? (
          /* Empty state: plain centered text, no icon */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[280px]">
            <p className="text-[14px] font-medium text-[#1F2328]">No task is running.</p>
            <p className="text-[13px] text-[#5B6168] mt-1">
              Enter a request or start a demo scenario to see the plan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Goal header & progress */}
            <div className="pb-3 border-b border-[#E4E0D6] flex flex-col gap-1.5">
              <div className="text-[12px] font-medium text-[#5B6168]">Goal</div>
              <div className="text-[14px] text-[#1F2328] font-medium">{plan.goal}</div>
            </div>

            {/* Workflow nodes */}
            <div className="flex flex-col items-center gap-2 py-2">
              {plan.tasks.map((task, idx) => {
                // 3px left status stripe & icon determination
                let stripeColor = 'bg-[#8A8F96]'; // grey pending
                let statusIcon = <Clock className="w-4 h-4 text-[#8A8F96] stroke-[1.5]" />;
                let statusLabel: string | null = null;

                if (task.status === 'running') {
                  stripeColor = 'bg-[#234E7D]'; // accent running
                  statusIcon = <Loader2 className="w-4 h-4 text-[#234E7D] animate-spin stroke-[1.5]" />;
                } else if (task.status === 'awaiting_approval') {
                  stripeColor = 'bg-[#9A5B00]'; // amber waiting
                  statusIcon = <Pause className="w-4 h-4 text-[#9A5B00] stroke-[1.5]" />;
                  statusLabel = 'Waiting for you';
                } else if (task.status === 'retrying') {
                  stripeColor = 'bg-[#9A5B00]';
                  statusIcon = <Loader2 className="w-4 h-4 text-[#9A5B00] animate-spin stroke-[1.5]" />;
                  statusLabel = `Retry ${task.retryCount} of 2`;
                } else if (task.status === 'succeeded') {
                  stripeColor = 'bg-[#2F6B3F]'; // green done
                  statusIcon = <Check className="w-4 h-4 text-[#2F6B3F] stroke-[1.5]" />;
                } else if (task.status === 'failed') {
                  stripeColor = 'bg-[#A7321F]'; // red failed
                  statusIcon = <AlertCircle className="w-4 h-4 text-[#A7321F] stroke-[1.5]" />;
                } else if (task.status === 'skipped') {
                  stripeColor = 'bg-[#E4E0D6]';
                  statusIcon = <span className="text-[11px] text-[#8A8F96]">Skipped</span>;
                }

                // Friendly agent name formatting
                const agentName = task.agent.charAt(0).toUpperCase() + task.agent.slice(1) + ' agent';
                const actionLabel = task.action.replace(/_/g, ' ');

                return (
                  <React.Fragment key={task.id}>
                    {/* 200x64 node rectangle */}
                    <div
                      onClick={() => onSelectTask?.(task)}
                      title="Click to inspect extracted items, calculations & voucher"
                      className="w-full max-w-[320px] sm:w-[260px] h-[64px] bg-white border border-[#E4E0D6] rounded-[6px] relative overflow-hidden flex items-center justify-between px-3 cursor-pointer hover:bg-[#FBFAF7] transition-colors"
                    >
                      {/* 3px left status stripe */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${stripeColor}`} />

                      {/* Content inside */}
                      <div className="flex flex-col text-left pl-1">
                        <div className="text-[14px] font-semibold text-[#1F2328] leading-tight">
                          {agentName}
                        </div>
                        <div className="text-[12px] text-[#5B6168] capitalize leading-tight mt-0.5">
                          {statusLabel || actionLabel}
                        </div>
                      </div>

                      {/* Right: status icon + elapsed ms in tabular numbers */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {statusIcon}
                        {task.durationMs !== undefined && (
                          <span className="text-[11px] text-[#8A8F96] tabular-nums font-mono">
                            {task.durationMs} ms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Connector line with small arrowhead */}
                    {idx < plan.tasks.length - 1 && (
                      <div className="flex flex-col items-center">
                        <ArrowDown className="w-3.5 h-3.5 text-[#CFC9BC] stroke-[1.5]" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
