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
