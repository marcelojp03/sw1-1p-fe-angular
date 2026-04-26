export interface UserResponse {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    positionName?: string;
    phone?: string;
    areaId?: string;
    organizationId?: string;
    clientId?: string;
    active: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    roles: string[];
    positionName?: string;
    phone?: string;
    areaId?: string;
    organizationId?: string;
}

export interface UpdateUserRequest {
    fullName: string;
    email: string;
    phone?: string;
    positionName?: string;
    roles: string[];
    organizationId?: string;
    areaId?: string;
}
