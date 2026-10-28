export type AgentRole =
  | 'planner'
  | 'intake'
  | 'auditor'
  | 'ledger'
  | 'risk'
  | 'collections'
  | 'reporter';

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'awaiting_approval'
  | 'rejected'
  | 'skipped';

export interface Task {
  id: string;
  agent: AgentRole;
  action: string;
  inputs: Record<string, any>;
  depends_on: string[];
  requires_approval: boolean;
  reason: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  retryCount: number;
  durationMs?: number;
  startTime?: number;
  endTime?: number;
}

export interface TaskPlan {
  goal: string;
  intent: 'record_sale' | 'check_balance' | 'send_reminder' | 'daily_summary';
  tasks: Task[];
  isFallbackPlan?: boolean;
}

export interface AgentMessage {
  id: string;
  timestamp: number;
  from: AgentRole | 'supervisor' | 'user';
  to: AgentRole | 'supervisor' | 'user';
  type: string;
  payload: any;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  agent: AgentRole;
  tool: string;
  inputs: any;
  outputs: any;
  durationMs: number;
  status: 'SUCCESS' | 'FAILURE' | 'RETRY' | 'ESCALATED';
  error?: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  agent: AgentRole;
  type: 'MATH_MISMATCH' | 'HIGH_CREDIT_RISK' | 'UNCERTAIN_INTAKE' | 'OUTBOX_DISPATCH' | 'CREDIT_LIMIT_EXCEEDED';
  title: string;
  description: string;
  metadata: Record<string, any>;
  options?: {
    label: string;
    value: any;
    isRecommended?: boolean;
  }[];
  createdAt: number;
  resolvedAt?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userDecision?: any;
}

export interface RunMetrics {
  totalTasksCompleted: number;
  totalRetries: number;
  totalApprovalsRequested: number;
  lastRunDurationMs: number;
}
