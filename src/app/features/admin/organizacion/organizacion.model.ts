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
