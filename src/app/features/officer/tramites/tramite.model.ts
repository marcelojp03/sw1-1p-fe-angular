export interface StartProcedureRequest {
    policyId: number;
    clientId: number;
    organizationId: number;
}

export interface ProcedureSummaryResponse {
    id: number;
    code: string;
    organizationId: number;
    clientId: number;
    currentNodeIds: string[];
    status: string;
    policyName: string;
    policyVersion: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProcedureResponse {
    id: number;
    code: string;
    organizationId: number;
    policyId: number;
    policyVersion: number;
    clientId: number;
    startedBy: number;
    requester?: any;
    currentNodeIds: string[];
    status: string;
    policySnapshot?: any;
    formData?: any;
    startChannel: string;
    startedAt: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProcedureHistory {
    id: string;
    procedureId: string;
    eventType: string;
    description?: string;
    performedBy?: string;
    nodeId?: string;
    taskId?: string;
    createdAt: string;
}
