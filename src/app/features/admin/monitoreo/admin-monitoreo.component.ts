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
    template: `
    <p-toast />
    <div class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold m-0">Monitoreo de Trámites</h2>
      </div>

      <!-- Filtros por estado -->
      <div class="flex flex-wrap gap-2 mb-4">
        <p-button label="Todos" icon="pi pi-list" severity="secondary"
          [outlined]="selectedStatus() !== ''"
          (onClick)="filtrar('')" />
        <p-button label="En curso" icon="pi pi-spin pi-spinner" severity="info"
          [outlined]="selectedStatus() !== 'IN_PROGRESS'"
          (onClick)="filtrar('IN_PROGRESS')" />
        <p-button label="Completados" icon="pi pi-check-circle" severity="success"
          [outlined]="selectedStatus() !== 'COMPLETED'"
          (onClick)="filtrar('COMPLETED')" />
        <p-button label="Cancelados" icon="pi pi-times-circle" severity="danger"
          [outlined]="selectedStatus() !== 'CANCELLED'"
          (onClick)="filtrar('CANCELLED')" />
        <p-button label="Esperando cliente" icon="pi pi-clock" severity="warn"
          [outlined]="selectedStatus() !== 'WAITING_CLIENT'"
          (onClick)="filtrar('WAITING_CLIENT')" />
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center h-48">
          <p-progressspinner />
        </div>
      } @else {
        <p-table [value]="tramites()" [paginator]="true" [rows]="15"
          [rowsPerPageOptions]="[15, 30, 50]" styleClass="p-datatable-sm"
          [globalFilterFields]="['code', 'policyName']">

          <ng-template pTemplate="header">
            <tr>
              <th>Código</th>
              <th>Política</th>
              <th>Estado</th>
              <th>Nodos activos</th>
              <th>Fecha inicio</th>
              <th class="w-28">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-t>
            <tr>
              <td class="font-mono text-sm">{{ t.code }}</td>
              <td>{{ t.policyName }} <span class="text-xs text-surface-400">v{{ t.policyVersion }}</span></td>
              <td>
                <p-tag [value]="statusLabel(t.status)" [severity]="statusSeverity(t.status)" />
              </td>
              <td class="text-sm">{{ t.currentNodeIds?.length ?? 0 }}</td>
              <td class="text-sm text-surface-500">{{ t.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <p-button label="Ver" icon="pi pi-eye" size="small" [outlined]="true"
                  (onClick)="irDetalle(t.id)" />
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center text-surface-400 py-8">
                No hay trámites con el filtro seleccionado.
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Tareas vencidas -->
      <div class="mt-6">
        <p-card>
          <ng-template pTemplate="header">
            <div class="flex items-center gap-2 p-4 pb-0">
              <i class="pi pi-exclamation-triangle text-red-500"></i>
              <span class="font-semibold text-base">Tareas Vencidas</span>
            </div>
          </ng-template>
          @if (overdueLoading()) {
            <div class="flex justify-center items-center h-24"><p-progressspinner /></div>
          } @else {
            <p-table [value]="overdueTasks()" [paginator]="true" [rows]="10"
              styleClass="p-datatable-sm" [showCurrentPageReport]="true">
              <ng-template pTemplate="header">
                <tr>
                  <th>Código trámite</th>
                  <th>Nodo</th>
                  <th>Área</th>
                  <th>Vencimiento</th>
                  <th>Días vencida</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-t>
                <tr>
                  <td class="font-mono text-sm">{{ t.procedureCode }}</td>
                  <td>{{ t.nodeLabel }}</td>
                  <td class="text-sm">{{ t.assignedAreaId }}</td>
                  <td class="text-sm text-surface-500">{{ t.dueAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <p-tag [value]="t.overdueDays + ' días'" severity="danger" />
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center text-surface-400 py-6">Sin tareas vencidas.</td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>
      </div>
    </div>
    `,
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
