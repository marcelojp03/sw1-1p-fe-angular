import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    DashboardSummaryResponse,
    ProceduresByStatusResponse,
    AverageTimeByNodeItem,
    TaskOverdueItem,
    PageResponse,
} from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/dashboard`;

    summary(organizationId: string): Observable<DashboardSummaryResponse> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.get<DashboardSummaryResponse>(`${this.base}/summary`, { params });
    }

    proceduresByStatus(organizationId: string, policyId?: string): Observable<ProceduresByStatusResponse> {
        let params = new HttpParams().set('organizationId', organizationId);
        if (policyId) params = params.set('policyId', policyId);
        return this.http.get<ProceduresByStatusResponse>(`${this.base}/procedures-by-status`, { params });
    }

    averageTimeByNode(organizationId: string, policyId?: string): Observable<AverageTimeByNodeItem[]> {
        let params = new HttpParams().set('organizationId', organizationId);
        if (policyId) params = params.set('policyId', policyId);
        return this.http.get<AverageTimeByNodeItem[]>(`${this.base}/average-time-by-node`, { params });
    }

    tasksOverdue(organizationId: string, page = 0, size = 20): Observable<PageResponse<TaskOverdueItem>> {
        const params = new HttpParams()
            .set('organizationId', organizationId)
            .set('page', page)
            .set('size', size);
        return this.http.get<PageResponse<TaskOverdueItem>>(`${this.base}/tasks-overdue`, { params });
    }
}
