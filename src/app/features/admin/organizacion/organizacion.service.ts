import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
    OrganizationResponse,
    CreateOrganizationRequest,
    AreaResponse,
    CreateAreaRequest,
} from './organizacion.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/organizations`;

    list(): Observable<OrganizationResponse[]> {
        return this.http.get<OrganizationResponse[]>(this.base);
    }

    get(id: string): Observable<OrganizationResponse> {
        return this.http.get<OrganizationResponse>(`${this.base}/${id}`);
    }

    create(body: CreateOrganizationRequest): Observable<OrganizationResponse> {
        return this.http.post<OrganizationResponse>(this.base, body);
    }

    update(id: string, body: Partial<CreateOrganizationRequest>): Observable<OrganizationResponse> {
        return this.http.put<OrganizationResponse>(`${this.base}/${id}`, body);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    // Areas
    createArea(orgId: string, body: CreateAreaRequest): Observable<OrganizationResponse> {
        return this.http.post<OrganizationResponse>(`${this.base}/${orgId}/areas`, body);
    }

    deleteArea(orgId: string, areaId: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/${orgId}/areas/${areaId}`);
    }

    updateArea(orgId: string, areaId: string, body: CreateAreaRequest): Observable<AreaResponse> {
        return this.http.put<AreaResponse>(`${this.base}/${orgId}/areas/${areaId}`, body);
    }
}
