export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: number;
    username: string;
    roles: string[];
}

export interface CurrentUser {
    id: number;
    username: string;
    email: string;
    fullName: string;
    roles: string[];
    organizationId?: number;
}
