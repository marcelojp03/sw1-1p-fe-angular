export interface CreatePolicyRequest {
    organizationId: string;
    policyKey: string;
    name: string;
    description?: string;
    allowedStartChannels?: string[];
}

export interface PolicySummaryResponse {
    id: string;
    organizationId: string;
    policyKey: string;
    name: string;
    version: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    createdAt: string;
    updatedAt: string;
}

export interface PolicyResponse extends PolicySummaryResponse {
    description?: string;
    allowedStartChannels: string[];
    nodes: any[];
    transitions: any[];
    swimlanes: any[];
    diagram: any;
}

export interface DiagramUpdateRequest {
    diagram: any;
    nodes: any[];
    transitions: any[];
    swimlanes: any[];
}

export type NodeType = 'START' | 'MANUAL_FORM' | 'MANUAL_ACTION' | 'CLIENT_TASK'
    | 'CONDITION' | 'NOTIFICATION' | 'PARALLEL_SPLIT' | 'PARALLEL_JOIN' | 'END';

export interface PolicyNode {
    id: string;
    nodeType: NodeType;
    label: string;
    assignedAreaId?: number;
    estimatedMinutes?: number;
    form?: any;
    notificationTemplate?: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
}

export interface PolicyTransition {
    id: string;
    from: string;
    to: string;
    label?: string;
    condition?: string;
}
