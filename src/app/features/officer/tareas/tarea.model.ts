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

export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'TEXTAREA' | 'FILE' | 'BOOLEAN';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    options?: string[];
    placeholder?: string;
}

export interface FormDefinition {
    fields: FormField[];
}
