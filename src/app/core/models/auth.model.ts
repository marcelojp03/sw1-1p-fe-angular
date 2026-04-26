export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: number;
    email: string;
    fullName: string;
    roles: string[];
}

export interface CurrentUser {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
    organizationId?: number;
}
