import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TimelineModule } from 'primeng/timeline';
import { ProcedureService } from '../../officer/tramites/tramites.service';
import { ProcedureSummaryResponse } from '../../officer/tramites/tramite.model';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { TaskOverdueItem } from '../dashboard/dashboard.model';
import { ChatPanelComponent } from '../../../shared/components/chat-panel/chat-panel.component';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-admin-monitoreo',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ToastModule, ButtonModule, TagModule,
        TableModule, ProgressSpinnerModule, CardModule,
        DialogModule, TooltipModule, SelectModule, InputTextModule, TimelineModule,
        ChatPanelComponent,
    ],
    providers: [MessageService],
    templateUrl: './admin-monitoreo.component.html',
})
export class AdminMonitoreoComponent implements OnInit {
    private procedureService = inject(ProcedureService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private dashboardService = inject(DashboardService);
    private http = inject(HttpClient);
    router = inject(Router);

    tramites = signal<ProcedureSummaryResponse[]>([]);
    loading = signal(true);
    selectedStatus = signal<string>('');
    overdueTasks = signal<TaskOverdueItem[]>([]);
    overdueLoading = signal(false);
    chatVisible = signal(false);
    selectedProcedureId = signal<string | null>(null);

    // Filtros
    statusOptions = [
        { label: 'En curso', value: 'IN_PROGRESS' },
        { label: 'Esperando cliente', value: 'WAITING_CLIENT' },
        { label: 'Completado', value: 'COMPLETED' },
        { label: 'Cancelado', value: 'CANCELLED' },
        { label: 'Creado', value: 'CREATED' },
    ];
    statusModel = '';
    searchTextModel = '';
    searchText = signal<string>('');

    // Recorrido
    recorridoVisible = signal(false);
    recorridoLoading = signal(false);
    historialSeleccionado = signal<any[]>([]);

    get tramitesFiltrados(): ProcedureSummaryResponse[] {
        const status = this.selectedStatus();
        const text = this.searchText().toLowerCase();
        return this.tramites().filter(t => {
            const matchStatus = !status || t.status === status;
            const matchText = !text || t.code?.toLowerCase().includes(text);
            return matchStatus && matchText;
        });
    }

    limpiarFiltros(): void {
        this.statusModel = '';
        this.searchTextModel = '';
        this.selectedStatus.set('');
        this.searchText.set('');
    }

    verRecorrido(procedureId: string | number): void {
        this.recorridoLoading.set(true);
        this.recorridoVisible.set(true);
        this.http.get<any[]>(`${environment.api.baseUrl}/procedures/${procedureId}/history`).subscribe({
            next: (data) => { this.historialSeleccionado.set(data); this.recorridoLoading.set(false); },
            error: () => this.recorridoLoading.set(false),
        });
    }

    abrirChat(id: number | string): void {
        this.selectedProcedureId.set(String(id));
        this.chatVisible.set(true);
    }

    ngOnInit(): void {
        this.cargar();
        this.cargarVencidas();
    }

    cargarVencidas(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId;
        if (!orgId) return;
        this.overdueLoading.set(true);
        this.dashboardService.tasksOverdue(orgId).subscribe({
            next: (page) => { this.overdueTasks.set(page.content); this.overdueLoading.set(false); },
            error: () => this.overdueLoading.set(false),
        });
    }

    cargar(): void {
        this.loading.set(true);
        const orgId = this.auth.currentUserSignal()?.organizationId;
        if (!orgId) { this.loading.set(false); return; }

        this.procedureService.list(orgId, undefined).subscribe({
            next: (data) => { this.tramites.set(data); this.loading.set(false); },
            error: () => {
                this.loading.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los trámites' });
            },
        });
    }

    filtrar(status: string): void {
        this.selectedStatus.set(status);
        this.statusModel = status;
    }

    irDetalle(id: number): void {
        this.router.navigate(['/officer/tramites', id]);
    }

    statusSeverity(status: string): 'info' | 'success' | 'danger' | 'warn' | 'secondary' {
        const map: Record<string, 'info' | 'success' | 'danger' | 'warn' | 'secondary'> = {
            IN_PROGRESS: 'info',
            COMPLETED: 'success',
            CANCELLED: 'danger',
            WAITING_CLIENT: 'warn',
        };
        return map[status] ?? 'secondary';
    }

    statusLabel(status: string): string {
        const map: Record<string, string> = {
            IN_PROGRESS: 'En curso',
            COMPLETED: 'Completado',
            CANCELLED: 'Cancelado',
            WAITING_CLIENT: 'Esperando cliente',
        };
        return map[status] ?? status;
    }
}
