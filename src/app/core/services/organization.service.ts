import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    OrganizationResponse,
    CreateOrganizationRequest,
    AreaResponse,
    CreateAreaRequest,
} from '../models/wf.models';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/organizations`;

    list(): Observable<OrganizationResponse[]> {
        return this.http.get<OrganizationResponse[]>(this.base);
    }

    get(id: number): Observable<OrganizationResponse> {
        return this.http.get<OrganizationResponse>(`${this.base}/${id}`);
    }

    create(body: CreateOrganizationRequest): Observable<OrganizationResponse> {
        return this.http.post<OrganizationResponse>(this.base, body);
    }

    update(id: number, body: Partial<CreateOrganizationRequest>): Observable<OrganizationResponse> {
        return this.http.put<OrganizationResponse>(`${this.base}/${id}`, body);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    // Areas
    createArea(orgId: number, body: CreateAreaRequest): Observable<OrganizationResponse> {
        return this.http.post<OrganizationResponse>(`${this.base}/${orgId}/areas`, body);
    }

    deleteArea(orgId: number, areaId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${orgId}/areas/${areaId}`);
    }

    updateArea(orgId: number, areaId: number, body: CreateAreaRequest): Observable<AreaResponse> {
        return this.http.put<AreaResponse>(`${this.base}/${orgId}/areas/${areaId}`, body);
    }
}
