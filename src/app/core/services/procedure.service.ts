import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ProcedureResponse,
    ProcedureSummaryResponse,
    StartProcedureRequest,
    ProcedureHistory,
} from '../models/wf.models';

@Injectable({ providedIn: 'root' })
export class ProcedureService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/procedures`;

    list(organizationId: number, status?: string): Observable<ProcedureSummaryResponse[]> {
        let params = new HttpParams().set('organizationId', organizationId);
        if (status) params = params.set('status', status);
        return this.http.get<ProcedureSummaryResponse[]>(this.base, { params });
    }

    get(id: number): Observable<ProcedureResponse> {
        return this.http.get<ProcedureResponse>(`${this.base}/${id}`);
    }

    start(body: StartProcedureRequest): Observable<ProcedureResponse> {
        return this.http.post<ProcedureResponse>(this.base, body);
    }

    getHistory(id: number): Observable<ProcedureHistory[]> {
        return this.http.get<ProcedureHistory[]>(`${this.base}/${id}/history`);
    }
}
