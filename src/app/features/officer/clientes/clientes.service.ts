import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientResponse, CreateClientRequest, UpdateClientRequest } from './cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/clients`;

    list(organizationId: number): Observable<ClientResponse[]> {
        const params = new HttpParams().set('organizationId', organizationId);
        return this.http.get<ClientResponse[]>(this.base, { params });
    }

    get(id: number): Observable<ClientResponse> {
        return this.http.get<ClientResponse>(`${this.base}/${id}`);
    }

    search(documentNumber: string, organizationId: number): Observable<ClientResponse> {
        const params = new HttpParams()
            .set('documentNumber', documentNumber)
            .set('organizationId', organizationId);
        return this.http.get<ClientResponse>(`${this.base}/search`, { params });
    }

    create(body: CreateClientRequest): Observable<ClientResponse> {
        return this.http.post<ClientResponse>(this.base, body);
    }

    update(id: number, body: UpdateClientRequest): Observable<ClientResponse> {
        return this.http.put<ClientResponse>(`${this.base}/${id}`, body);
    }
}
