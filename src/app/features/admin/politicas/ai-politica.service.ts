import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    SuggestWorkflowRequest,
    SuggestWorkflowResponse,
    SuggestFormFieldsRequest,
    SuggestFormFieldsResponse,
    AnalyzeBottlenecksRequest,
    AnalyzeBottlenecksResponse,
} from './ai-politica.model';

@Injectable({ providedIn: 'root' })
export class AiPoliticaService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/ai`;

    suggestWorkflow(req: SuggestWorkflowRequest, organizationId: string): Observable<SuggestWorkflowResponse> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.post<SuggestWorkflowResponse>(`${this.base}/suggest-workflow`, req, { params });
    }

    suggestFormFields(req: SuggestFormFieldsRequest, organizationId: string): Observable<SuggestFormFieldsResponse> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.post<SuggestFormFieldsResponse>(`${this.base}/suggest-form-fields`, req, { params });
    }

    analyzeBottlenecks(req: AnalyzeBottlenecksRequest, organizationId: string): Observable<AnalyzeBottlenecksResponse> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.post<AnalyzeBottlenecksResponse>(`${this.base}/analyze-bottlenecks`, req, { params });
    }
}
