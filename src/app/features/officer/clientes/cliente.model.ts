export interface CreateClientRequest {
    organizationId: string;
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
    id: string;
    organizationId: string;
    fullName: string;
    documentType: string;
    documentNumber: string;
    phone?: string;
    email?: string;
    address?: string;
    userId?: string;
    createdBy?: string;
    createdAt: string;
}
