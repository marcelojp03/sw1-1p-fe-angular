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
    template: `
    <div class="p-4 max-w-4xl mx-auto">
      <p-toast />

      <div class="mb-4 flex items-center gap-2">
        <p-button
          icon="pi pi-arrow-left"
          label="Volver"
          severity="secondary"
          [text]="true"
          (onClick)="router.navigate(['/officer/tramites'])"
        />
        <h2 class="text-xl font-semibold m-0">Detalle del Trámite</h2>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center h-48">
          <p-progressspinner />
        </div>
      }

      @if (!loading() && tramite()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Info del trámite -->
          <div class="md:col-span-1">
            <p-card header="Información">
              <div class="flex flex-col gap-3">
                <div>
                  <p class="text-xs text-surface-400 m-0 uppercase font-medium">Código</p>
                  <p class="font-mono font-semibold mt-1 mb-0">{{ tramite()!.code }}</p>
                </div>
                <div>
                  <p class="text-xs text-surface-400 m-0 uppercase font-medium">Estado</p>
                  <p-tag class="mt-1" [value]="tramite()!.status" [severity]="statusSeverity(tramite()!.status)" />
                </div>
                <div>
                  <p class="text-xs text-surface-400 m-0 uppercase font-medium">Canal de Inicio</p>
                  <p class="mt-1 mb-0">{{ tramite()!.startChannel }}</p>
                </div>
                <div>
                  <p class="text-xs text-surface-400 m-0 uppercase font-medium">Iniciado</p>
                  <p class="mt-1 mb-0">{{ tramite()!.startedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                @if (tramite()!.completedAt) {
                  <div>
                    <p class="text-xs text-surface-400 m-0 uppercase font-medium">Completado</p>
                    <p class="mt-1 mb-0">{{ tramite()!.completedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                }
                <div>
                  <p class="text-xs text-surface-400 m-0 uppercase font-medium">Nodos activos</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    @for (n of tramite()!.currentNodeIds; track n) {
                      <span class="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded font-mono">{{ n }}</span>
                    }
                  </div>
                </div>
              </div>
            </p-card>
          </div>

          <!-- Historial -->
          <div class="md:col-span-2">
            <p-card header="Historial de Eventos">
              @if (loadingHistory()) {
                <div class="flex justify-center py-4">
                  <p-progressspinner [style]="{width:'30px',height:'30px'}" />
                </div>
              } @else if (historial().length === 0) {
                <p class="text-surface-400 text-center py-4">No hay eventos registrados.</p>
              } @else {
                <p-timeline [value]="historial()" align="left">
                  <ng-template pTemplate="marker" let-event>
                    <span
                      class="flex w-8 h-8 items-center justify-center rounded-full text-white text-xs font-bold"
                      [class]="markerClass(event.eventType)"
                    >
                      <i [class]="markerIcon(event.eventType)"></i>
                    </span>
                  </ng-template>
                  <ng-template pTemplate="content" let-event>
                    <div class="mb-4">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-sm">{{ formatEventType(event.eventType) }}</span>
                        <span class="text-xs text-surface-400">{{ event.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                      @if (event.description) {
                        <p class="text-sm text-surface-600 dark:text-surface-300 m-0">{{ event.description }}</p>
                      }
                      @if (event.performedBy) {
                        <p class="text-xs text-surface-400 mt-1 m-0">Por: {{ event.performedBy }}</p>
                      }
                    </div>
                  </ng-template>
                </p-timeline>
              }
            </p-card>
          </div>
        </div>
      }
    </div>
    `,
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
