// Requests
export interface SuggestWorkflowRequest {
    organizationName: string;
    policyName: string;
    policyDescription: string;
    existingNodes: { nodeId: string; type: string; label: string }[];
    language: string;
}

export interface SuggestFormFieldsRequest {
    policyName: string;
    nodeLabel: string;
    nodeType: string;
    areaName: string;
    existingFields: string[];
    language: string;
}

export interface AnalyzeBottlenecksRequest {
    policyName: string;
    metrics: {
        nodeId: string;
        label: string;
        avgDurationHours: number;
        expectedHours?: number | null;
        pendingTasks: number;
        completedTasks: number;
        cancelledTasks: number;
    }[];
    language: string;
}

// Responses
export interface NodeSuggestion {
    label: string;
    type: string;
    description: string;
    suggestedArea: string;
    suggestedFields: string[];
}

export interface TransitionSuggestion {
    from: string;
    to: string;
    condition?: string;
}

export interface SuggestWorkflowResponse {
    suggestions: NodeSuggestion[];
    suggestedTransitions: TransitionSuggestion[];
}

export interface FieldSuggestion {
    fieldId: string;
    label: string;
    type: string;
    required: boolean;
    description: string;
    options?: string[];
}

export interface SuggestFormFieldsResponse {
    suggestions: FieldSuggestion[];
}

export interface BottleneckItem {
    nodeId: string;
    label: string;
    severity: string;
    issue: string;
    recommendation: string;
}

export interface AnalyzeBottlenecksResponse {
    bottlenecks: BottleneckItem[];
    generalRecommendations: string[];
}

// AI Diagram Generation
export interface GenerateDiagramRequest {
    organizationName: string;
    policyName: string;
    policyDescription: string;
    areas: string[];
    language: string;
}

export interface GenerateDiagramResponse {
    diagram: Record<string, unknown>;  // graph.fromJSON()-compatible: { cells: [...] }
}
