export interface CreateOrganizationRequest {
    name: string;
    businessType: string;
    ruc?: string;
    logoUrl?: string;
}

export interface AreaResponse {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
}

export interface OrganizationResponse {
    id: string;
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
