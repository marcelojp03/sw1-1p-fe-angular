import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TaskResponse, CompleteTaskRequest } from './tarea.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
    private http = inject(HttpClient);
    private base = `${environment.api.baseUrl}/tasks`;

    listByArea(areaId: string): Observable<TaskResponse[]> {
        const params = new HttpParams().set('areaId', areaId);
        return this.http.get<TaskResponse[]>(this.base, { params });
    }

    listMine(): Observable<TaskResponse[]> {
        return this.http.get<TaskResponse[]>(`${this.base}/mine`);
    }

    get(id: string): Observable<TaskResponse> {
        return this.http.get<TaskResponse>(`${this.base}/${id}`);
    }

    claim(id: string): Observable<TaskResponse> {
        return this.http.post<TaskResponse>(`${this.base}/${id}/claim`, {});
    }

    complete(id: string, body: CompleteTaskRequest): Observable<TaskResponse> {
        return this.http.post<TaskResponse>(`${this.base}/${id}/complete`, body);
    }

    uploadAttachments(id: string, files: File[]): Observable<TaskResponse> {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        return this.http.post<TaskResponse>(`${this.base}/${id}/attachments`, formData);
    }
}
