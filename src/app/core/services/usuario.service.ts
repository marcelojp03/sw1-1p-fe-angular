import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse, RegisterRequest, UpdateUserRequest } from '../../features/admin/usuarios/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
    private http = inject(HttpClient);
    private base = environment.api.baseUrl;

    listar(page = 0, size = 50): Observable<any> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<any>(`${this.base}/users`, { params });
    }

    obtener(id: number): Observable<UserResponse> {
        return this.http.get<UserResponse>(`${this.base}/users/${id}`);
    }

    crear(body: RegisterRequest): Observable<UserResponse> {
        return this.http.post<UserResponse>(`${this.base}/auth/register`, body);
    }

    actualizar(id: number, body: UpdateUserRequest): Observable<UserResponse> {
        return this.http.put<UserResponse>(`${this.base}/users/${id}`, body);
    }

    cambiarEstado(id: number, active: boolean): Observable<UserResponse> {
        return this.http.patch<UserResponse>(`${this.base}/users/${id}/status`, null, {
            params: new HttpParams().set('active', active)
        });
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/users/${id}`);
    }
}
