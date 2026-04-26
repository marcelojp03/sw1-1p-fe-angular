export interface ChatMessageResponse {
    id: string;
    procedureId: string;
    senderUserId: string;
    senderName: string;
    receiverAreaId?: string;
    message: string;
    attachments?: string[];
    createdAt: string;
}

export interface SendMessageRequest {
    message: string;
    receiverAreaId?: string;
}

export interface DiagramPatchMessage {
    policyId: string;
    senderUserId: string;
    cells: unknown[];
    sentAt?: string;
}
