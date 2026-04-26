import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
    InstitucionRequest, InstitucionResponse,
    ConfiguracionInstitucionRequest, ConfiguracionInstitucionResponse
} from '../models/sia.models';

@Injectable({ providedIn: 'root' })
export class InstitucionService {
    private http = inject(HttpClient);
    private base = environment.api.baseUrl;

    listar(): Observable<ApiResponse<InstitucionResponse[]>> {
        return this.http.get<ApiResponse<InstitucionResponse[]>>(`${this.base}/instituciones`);
    }

    obtener(id: string): Observable<ApiResponse<InstitucionResponse>> {
        return this.http.get<ApiResponse<InstitucionResponse>>(`${this.base}/instituciones/${id}`);
    }

    crear(body: InstitucionRequest): Observable<ApiResponse<InstitucionResponse>> {
        return this.http.post<ApiResponse<InstitucionResponse>>(`${this.base}/instituciones`, body);
    }

    actualizar(id: string, body: InstitucionRequest): Observable<ApiResponse<InstitucionResponse>> {
        return this.http.put<ApiResponse<InstitucionResponse>>(`${this.base}/instituciones/${id}`, body);
    }

    eliminar(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/instituciones/${id}`);
    }

    listarConfiguraciones(id: string): Observable<ApiResponse<ConfiguracionInstitucionResponse[]>> {
        return this.http.get<ApiResponse<ConfiguracionInstitucionResponse[]>>(`${this.base}/instituciones/${id}/configuraciones`);
    }

    actualizarConfiguracion(id: string, body: ConfiguracionInstitucionRequest): Observable<ApiResponse<ConfiguracionInstitucionResponse>> {
        return this.http.put<ApiResponse<ConfiguracionInstitucionResponse>>(`${this.base}/instituciones/${id}/configuraciones`, body);
    }

    eliminarConfiguracion(id: string, clave: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/instituciones/${id}/configuraciones/${clave}`);
    }
}
