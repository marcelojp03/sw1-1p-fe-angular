import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ProcedureService } from '../../officer/tramites/tramites.service';
import { ProcedureSummaryResponse } from '../../officer/tramites/tramite.model';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { TaskOverdueItem } from '../dashboard/dashboard.model';

@Component({
    selector: 'app-admin-monitoreo',
    standalone: true,
    imports: [
        CommonModule, ToastModule, ButtonModule, TagModule,
        TableModule, ProgressSpinnerModule, CardModule,
    ],
    providers: [MessageService],
    templateUrl: './admin-monitoreo.component.html',
})
export class AdminMonitoreoComponent implements OnInit {
    private procedureService = inject(ProcedureService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private dashboardService = inject(DashboardService);
    router = inject(Router);

    tramites = signal<ProcedureSummaryResponse[]>([]);
    loading = signal(true);
    selectedStatus = signal<string>('');
    overdueTasks = signal<TaskOverdueItem[]>([]);
    overdueLoading = signal(false);

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

        const status = this.selectedStatus() || undefined;
        this.procedureService.list(orgId, status).subscribe({
            next: (data) => { this.tramites.set(data); this.loading.set(false); },
            error: () => {
                this.loading.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los trámites' });
            },
        });
    }

    filtrar(status: string): void {
        this.selectedStatus.set(status);
        this.cargar();
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
