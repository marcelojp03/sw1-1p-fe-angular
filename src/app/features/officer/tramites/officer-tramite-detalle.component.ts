import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { ProcedureService } from './tramites.service';
import { ProcedureResponse, ProcedureHistory } from './tramite.model';

@Component({
    selector: 'app-officer-tramite-detalle',
    standalone: true,
    imports: [
        CommonModule, ToastModule, ButtonModule, CardModule, TagModule,
        TimelineModule, ProgressSpinnerModule, DividerModule, DatePipe,
    ],
    providers: [MessageService],
    templateUrl: './officer-tramite-detalle.component.html',
})
export class OfficerTramiteDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private procedureService = inject(ProcedureService);
    private message = inject(MessageService);
    router = inject(Router);

    loading = signal(true);
    loadingHistory = signal(true);
    tramite = signal<ProcedureResponse | null>(null);
    historial = signal<ProcedureHistory[]>([]);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));

        this.procedureService.get(id).subscribe({
            next: (p) => { this.tramite.set(p); this.loading.set(false); },
            error: () => {
                this.loading.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el trámite' });
            },
        });

        this.procedureService.getHistory(id).subscribe({
            next: (h) => { this.historial.set(h); this.loadingHistory.set(false); },
            error: () => { this.loadingHistory.set(false); },
        });
    }

    statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            IN_PROGRESS: 'info',
            COMPLETED: 'success',
            CANCELLED: 'danger',
            PENDING: 'warn',
        };
        return map[status] ?? 'secondary';
    }

    markerClass(eventType: string): string {
        const map: Record<string, string> = {
            STARTED: 'bg-green-500',
            COMPLETED: 'bg-blue-500',
            TASK_CREATED: 'bg-yellow-500',
            TASK_CLAIMED: 'bg-purple-500',
            TASK_COMPLETED: 'bg-blue-600',
            CANCELLED: 'bg-red-500',
            NOTIFICATION_SENT: 'bg-indigo-500',
        };
        return map[eventType] ?? 'bg-surface-400';
    }

    markerIcon(eventType: string): string {
        const map: Record<string, string> = {
            STARTED: 'pi pi-play',
            COMPLETED: 'pi pi-check',
            TASK_CREATED: 'pi pi-plus',
            TASK_CLAIMED: 'pi pi-user',
            TASK_COMPLETED: 'pi pi-check-circle',
            CANCELLED: 'pi pi-times',
            NOTIFICATION_SENT: 'pi pi-bell',
        };
        return map[eventType] ?? 'pi pi-circle';
    }

    formatEventType(eventType: string): string {
        return eventType.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
    }
}
