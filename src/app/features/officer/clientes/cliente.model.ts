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
