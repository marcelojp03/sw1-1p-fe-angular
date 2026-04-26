export interface TaskResponse {
    id: string;
    procedureId: string;
    procedureCode: string;
    policyId: string;
    nodeId: string;
    label: string;
    organizationId: string;
    assignedAreaId: string;
    taskAudience: string;
    status: string;
    assignedUserId?: string;
    assignedClientId?: string;
    form?: any;
    formResponse?: any;
    notes?: string;
    completedBy?: string;
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
