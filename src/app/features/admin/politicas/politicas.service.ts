import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    PolicySummaryResponse,
    PolicyResponse,
    CreatePolicyRequest,
    DiagramUpdateRequest,
} from './politica.model';

@Injectable({ providedIn: 'root' })
export class PoliticaService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/policies`;

    list(organizationId: number): Observable<PolicySummaryResponse[]> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.get<PolicySummaryResponse[]>(this.base, { params });
    }

    listPublished(organizationId: number): Observable<PolicySummaryResponse[]> {
        const params = new HttpParams().set('organizationId', organizationId).set('status', 'PUBLISHED');
        return this.http.get<PolicySummaryResponse[]>(this.base, { params });
    }

    get(id: number): Observable<PolicyResponse> {
        return this.http.get<PolicyResponse>(`${this.base}/${id}`);
    }

    create(body: CreatePolicyRequest): Observable<PolicyResponse> {
        return this.http.post<PolicyResponse>(this.base, body);
    }

    updateDiagram(id: number, body: DiagramUpdateRequest): Observable<PolicyResponse> {
        return this.http.put<PolicyResponse>(`${this.base}/${id}/diagram`, body);
    }

    publish(id: number): Observable<PolicyResponse> {
        return this.http.post<PolicyResponse>(`${this.base}/${id}/publish`, {});
    }

    archive(id: number): Observable<PolicyResponse> {
        return this.http.post<PolicyResponse>(`${this.base}/${id}/archive`, {});
    }

    newVersion(organizationId: number, policyKey: string): Observable<PolicyResponse> {
        const params = new HttpParams()
            .set('organizationId', organizationId)
            .set('policyKey', policyKey);
        return this.http.post<PolicyResponse>(`${this.base}/new-version`, {}, { params });
    }
}
