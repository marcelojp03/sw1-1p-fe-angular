import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, CurrentUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.api.baseUrl;

    private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    private readonly _userSignal = signal<CurrentUser | null>(this.getUserFromStorage());
    readonly currentUserSignal = this._userSignal.asReadonly();

    private readonly TOKEN_KEY = environment.auth.tokenKey;
    private readonly USER_KEY = environment.auth.userKey;

    login(username: string, password: string): Observable<LoginResponse> {
        const body: LoginRequest = { username, password };
        return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, body).pipe(
            tap((response) => {
                sessionStorage.setItem(this.TOKEN_KEY, response.token);
                const user = this.buildUserFromResponse(response);
                this.saveUser(user);
                this.currentUserSubject.next(user);
                this._userSignal.set(user);
            }),
            catchError((error) => {
                console.error('[AuthService] Error en login:', error);
                return throwError(() => error);
            })
        );
    }

    loadUserFromToken(): void {
        const token = this.getAccessToken();
        if (token && !this.isTokenExpired(token) && !this.currentUserSubject.value) {
            const user = this.getUserFromStorage();
            if (user) {
                this.currentUserSubject.next(user);
                this._userSignal.set(user);
            }
        }
    }

    private _isSessionExpiring = false;

    logout(): void {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
        this._userSignal.set(null);
        this.router.navigate(['/auth/login']);
    }

    clearSession(): boolean {
        if (this._isSessionExpiring) return false;
        this._isSessionExpiring = true;
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
        this._userSignal.set(null);
        return true;
    }

    resetSessionExpiring(): void {
        this._isSessionExpiring = false;
    }

    getAccessToken(): string | null {
        return sessionStorage.getItem(this.TOKEN_KEY);
    }

    getCurrentUser(): CurrentUser | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        return !!token && !this.isTokenExpired(token);
    }

    isLogged(): boolean {
        return this.isAuthenticated();
    }

    hasRole(role: string): boolean {
        return this.getCurrentUser()?.roles?.includes(role) ?? false;
    }

    isTokenExpired(token: string): boolean {
        try {
            const payload = this.getTokenPayload(token);
            if (!payload || !payload.exp) return true;
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    private buildUserFromResponse(response: LoginResponse): CurrentUser {
        const payload = this.getTokenPayload(response.token);
        return {
            id: response.userId,
            username: response.username,
            email: payload?.email ?? '',
            fullName: payload?.fullName ?? response.username,
            roles: response.roles,
            organizationId: payload?.organizationId ?? undefined,
        };
    }

    private getTokenPayload(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch {
            return null;
        }
    }

    private saveUser(user: CurrentUser): void {
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    private getUserFromStorage(): CurrentUser | null {
        const str = sessionStorage.getItem(this.USER_KEY);
        if (!str) return null;
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }
}
