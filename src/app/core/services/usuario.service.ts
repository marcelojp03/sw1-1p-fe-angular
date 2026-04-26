import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
    UsuarioResponse,
    CrearUsuarioRequest,
    ActualizarUsuarioRequest,
    AsignarRolRequest,
} from '../models/sia.models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
    private http = inject(HttpClient);
    private base = environment.api.baseUrl;

    listar(): Observable<ApiResponse<UsuarioResponse[]>> {
        return this.http.get<ApiResponse<UsuarioResponse[]>>(`${this.base}/usuarios`);
    }

    obtener(id: string): Observable<ApiResponse<UsuarioResponse>> {
        return this.http.get<ApiResponse<UsuarioResponse>>(`${this.base}/usuarios/${id}`);
    }

    crear(body: CrearUsuarioRequest): Observable<ApiResponse<UsuarioResponse>> {
        return this.http.post<ApiResponse<UsuarioResponse>>(`${this.base}/auth/register`, body);
    }

    actualizar(id: string, body: ActualizarUsuarioRequest): Observable<ApiResponse<UsuarioResponse>> {
        return this.http.put<ApiResponse<UsuarioResponse>>(`${this.base}/usuarios/${id}`, body);
    }

    eliminar(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/usuarios/${id}`);
    }

    asignarRol(id: string, body: AsignarRolRequest): Observable<ApiResponse<UsuarioResponse>> {
        return this.http.post<ApiResponse<UsuarioResponse>>(`${this.base}/usuarios/${id}/roles`, body);
    }
}
