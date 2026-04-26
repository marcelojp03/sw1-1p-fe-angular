// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserResponse {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
    positionName?: string;
    phone?: string;
    areaId?: number;
    organizationId?: number;
    clientId?: number;
    active: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    roles: string[];
    positionName?: string;
    phone?: string;
    areaId?: number;
    organizationId?: number;
}

export interface UpdateUserRequest {
    fullName: string;
    email: string;
    phone?: string;
    positionName?: string;
    roles: string[];
    organizationId?: number;
    areaId?: number;
}

// ─── Organizations ────────────────────────────────────────────────────────────

export interface CreateOrganizationRequest {
    name: string;
    businessType: string;
    ruc?: string;
    logoUrl?: string;
}

export interface AreaResponse {
    id: number;
    name: string;
    description?: string;
    organizationId: number;
}

export interface OrganizationResponse {
    id: number;
    name: string;
    businessType: string;
    ruc?: string;
    logoUrl?: string;
    active: boolean;
    areas: AreaResponse[];
}

export interface CreateAreaRequest {
    name: string;
    description?: string;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface CreateClientRequest {
    organizationId: number;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface UpdateClientRequest {
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
}

export interface ClientResponse {
    id: number;
    organizationId: number;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone?: string;
    email?: string;
    address?: string;
    userId?: number;
    createdBy?: number;
    createdAt: string;
}

// ─── Policies ────────────────────────────────────────────────────────────────

export interface CreatePolicyRequest {
    organizationId: number;
    policyKey: string;
    name: string;
    description?: string;
    allowedStartChannels?: string[];
}

export interface PolicySummaryResponse {
    id: number;
    organizationId: number;
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

// ─── Procedures ───────────────────────────────────────────────────────────────

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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface TaskResponse {
    id: number;
    procedureId: number;
    procedureCode: string;
    policyId: number;
    nodeId: string;
    label: string;
    organizationId: number;
    assignedAreaId: number;
    taskAudience: string;
    status: string;
    assignedUserId?: number;
    assignedClientId?: number;
    form?: any;
    formResponse?: any;
    notes?: string;
    completedBy?: number;
    attachmentUrls?: string[];
    createdAt: string;
    startedAt?: string;
    dueAt?: string;
    completedAt?: string;
}

export interface CompleteTaskRequest {
    formResponse?: any;
    notes?: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface CreateNotificationRequest {
    organizationId: number;
    clientId?: number;
    userId?: number;
    procedureCode?: string;
    type: string;
    title: string;
    message: string;
    procedureId?: number;
    taskId?: number;
}

export interface NotificationResponse {
    id: number;
    organizationId: number;
    clientId?: number;
    userId?: number;
    procedureCode?: string;
    type: string;
    title: string;
    message: string;
    procedureId?: number;
    taskId?: number;
    read: boolean;
    createdAt: string;
    readAt?: string;
}
