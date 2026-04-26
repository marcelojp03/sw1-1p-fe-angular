export interface DashboardSummaryResponse {
    totalProcedures: number;
    proceduresByStatus: Record<string, number>;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    totalTasks: number;
}

export interface StatusCount {
    status: string;
    count: number;
}

export interface ProceduresByStatusResponse {
    items: StatusCount[];
}

export interface AverageTimeByNodeItem {
    nodeId: string;
    nodeLabel: string;
    avgDurationHours: number;
    completedCount: number;
}

export interface TaskOverdueItem {
    taskId: string;
    procedureId: string;
    procedureCode: string;
    nodeLabel: string;
    assignedAreaId: string;
    assignedUserId?: string;
    dueAt: string;
    createdAt?: string;
    overdueDays: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
