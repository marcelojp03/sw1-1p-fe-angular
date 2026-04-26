import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ArchivoResponse } from '../models/sia.models';

export type ModuloArchivo = 'INSTITUCION' | 'ESTUDIANTE' | 'DOCENTE' | 'TUTOR' | 'EVALUACION';
export type TipoReferencia = 'LOGO' | 'FOTO_PERFIL' | 'EVIDENCIA' | 'DOCUMENTO' | 'ADJUNTO';

export interface ArchivoUploadOptions {
    modulo: ModuloArchivo;
    entidad: string;
    idEntidad: string;
    tipoReferencia: TipoReferencia;
    esPrincipal?: boolean;
    observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
    private http = inject(HttpClient);
    private base = environment.api.baseUrl;

    /** Sube un archivo y lo asocia a una entidad (POST /api/archivos/upload) */
    upload(file: File, opts: ArchivoUploadOptions): Observable<ApiResponse<ArchivoResponse>> {
        const form = new FormData();
        form.append('file', file);
        form.append('modulo', opts.modulo);
        form.append('entidad', opts.entidad);
        form.append('idEntidad', opts.idEntidad);
        form.append('tipoReferencia', opts.tipoReferencia);
        form.append('esPrincipal', String(opts.esPrincipal ?? true));
        if (opts.observacion) form.append('observacion', opts.observacion);
        return this.http.post<ApiResponse<ArchivoResponse>>(`${this.base}/archivos/upload`, form);
    }

    /** Obtiene el archivo principal activo de una entidad */
    getPrincipal(modulo: ModuloArchivo, entidad: string, idEntidad: string, tipoReferencia: TipoReferencia): Observable<ApiResponse<ArchivoResponse>> {
        const params = new HttpParams()
            .set('modulo', modulo)
            .set('entidad', entidad)
            .set('idEntidad', idEntidad)
            .set('tipoReferencia', tipoReferencia);
        return this.http.get<ApiResponse<ArchivoResponse>>(`${this.base}/archivos/principal`, { params });
    }

    /** Lista todos los archivos activos de una entidad */
    listar(modulo: ModuloArchivo, entidad: string, idEntidad: string): Observable<ApiResponse<ArchivoResponse[]>> {
        const params = new HttpParams()
            .set('modulo', modulo)
            .set('entidad', entidad)
            .set('idEntidad', idEntidad);
        return this.http.get<ApiResponse<ArchivoResponse[]>>(`${this.base}/archivos/entidad`, { params });
    }

    /** Elimina (baja lógica) un archivo */
    eliminar(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/archivos/${id}`);
    }
}
