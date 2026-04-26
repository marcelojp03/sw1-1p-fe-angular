import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class InstitucionService {
    private http = inject(HttpClient);
    private base = environment.api.baseUrl;

    listar(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/instituciones`);
    }

    obtener(id: string): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.base}/instituciones/${id}`);
    }

    crear(body: any): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.base}/instituciones`, body);
    }

    actualizar(id: string, body: any): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.base}/instituciones/${id}`, body);
    }

    eliminar(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/instituciones/${id}`);
    }

    listarConfiguraciones(id: string): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.base}/instituciones/${id}/configuraciones`);
    }

    actualizarConfiguracion(id: string, body: any): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.base}/instituciones/${id}/configuraciones`, body);
    }

    eliminarConfiguracion(id: string, clave: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/instituciones/${id}/configuraciones/${clave}`);
    }
}
