import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ProcedureService } from './tramites.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProcedureSummaryResponse } from './tramite.model';

@Component({
    selector: 'app-officer-tramites',
    standalone: true,
    imports: [RouterModule, DatePipe, TableModule, ButtonModule, TagModule, ToastModule, IconFieldModule, InputIconModule, InputTextModule],
    providers: [MessageService],
    templateUrl: './officer-tramites.component.html',
})
export class OfficerTramitesComponent implements OnInit {
    private procedureService = inject(ProcedureService);
    private auth = inject(AuthService);
    private message = inject(MessageService);

    tramites = signal<ProcedureSummaryResponse[]>([]);
    loading = true;

    ngOnInit(): void { this.load(); }

    load(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId ?? 0;
        this.procedureService.list(orgId).subscribe({
            next: (list) => { this.tramites.set(list); this.loading = false; },
            error: () => { this.loading = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los trámites' }); }
        });
    }

    statusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'info' | 'success' | 'warn' | 'danger' | 'secondary'> = {
            IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'danger', PENDING: 'warn',
        };
        return map[status] ?? 'secondary';
    }
}
