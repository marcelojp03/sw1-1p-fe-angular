export interface StartProcedureRequest {
    policyId: string;
    clientId: string;
    organizationId: string;
}

export interface ProcedureSummaryResponse {
    id: string;
    code: string;
    organizationId: string;
    clientId: string;
    currentNodeIds: string[];
    status: string;
    policyName: string;
    policyVersion: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProcedureResponse {
    id: string;
    code: string;
    organizationId: string;
    policyId: string;
    policyVersion: number;
    clientId: string;
    startedBy: string;
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
    nodeId?: string;
    nodeLabel?: string;
    userId?: string;
    notes?: string;
    occurredAt: string;
}
