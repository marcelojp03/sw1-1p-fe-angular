import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PolicySummaryResponse } from '../models/wf.models';

@Injectable({ providedIn: 'root' })
export class PolicyService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/policies`;

    list(organizationId: number): Observable<PolicySummaryResponse[]> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.get<PolicySummaryResponse[]>(this.base, { params });
    }

    listPublished(organizationId: number): Observable<PolicySummaryResponse[]> {
        const params = new HttpParams()
            .set('organizationId', organizationId)
            .set('status', 'PUBLISHED');
        return this.http.get<PolicySummaryResponse[]>(this.base, { params });
    }
}
