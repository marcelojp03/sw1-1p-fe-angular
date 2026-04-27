import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ProcedureService } from './tramites.service';
import { PoliticaService } from '../../admin/politicas/politicas.service';
import { ClientService } from '../clientes/clientes.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProcedureSummaryResponse } from './tramite.model';
import { PolicySummaryResponse } from '../../admin/politicas/politica.model';
import { ClientResponse } from '../clientes/cliente.model';

@Component({
    selector: 'app-officer-tramites',
    standalone: true,
    imports: [
        RouterModule, FormsModule, DatePipe,
        TableModule, ButtonModule, TagModule, ToastModule,
        DialogModule, SelectModule,
        IconFieldModule, InputIconModule, InputTextModule,
    ],
    providers: [MessageService],
    templateUrl: './officer-tramites.component.html',
})
export class OfficerTramitesComponent implements OnInit {
    private procedureService = inject(ProcedureService);
    private policyService = inject(PoliticaService);
    private clientService = inject(ClientService);
    private auth = inject(AuthService);
    private message = inject(MessageService);

    tramites = signal<ProcedureSummaryResponse[]>([]);
    loading = true;

    // Dialog nuevo trámite
    dialogVisible = false;
    policies = signal<PolicySummaryResponse[]>([]);
    clients = signal<ClientResponse[]>([]);
    loadingPolicies = false;
    loadingClients = false;
    selectedPolicyId: string | null = null;
    selectedClientId: string | null = null;
    saving = false;

    get canSubmit(): boolean {
        return !!this.selectedPolicyId && !!this.selectedClientId && !this.saving;
    }

    ngOnInit(): void { this.load(); }

    load(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId ?? '';
        this.procedureService.list(orgId).subscribe({
            next: (list) => { this.tramites.set(list); this.loading = false; },
            error: () => { this.loading = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los trámites' }); }
        });
    }

    abrirDialog(): void {
        this.selectedPolicyId = null;
        this.selectedClientId = null;
        const orgId = this.auth.currentUserSignal()?.organizationId ?? '';
        this.loadingPolicies = true;
        this.loadingClients = true;
        this.policyService.listPublished(orgId).subscribe({
            next: (p) => { this.policies.set(p); this.loadingPolicies = false; },
            error: () => { this.loadingPolicies = false; }
        });
        this.clientService.list(orgId).subscribe({
            next: (c) => { this.clients.set(c); this.loadingClients = false; },
            error: () => { this.loadingClients = false; }
        });
        this.dialogVisible = true;
    }

    iniciar(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId ?? '';
        this.saving = true;
        this.procedureService.start({
            policyId: this.selectedPolicyId!,
            clientId: this.selectedClientId!,
            organizationId: orgId,
        }).subscribe({
            next: () => {
                this.saving = false;
                this.dialogVisible = false;
                this.message.add({ severity: 'success', summary: 'Trámite iniciado', detail: 'El trámite fue creado correctamente' });
                this.load();
            },
            error: () => {
                this.saving = false;
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar el trámite' });
            }
        });
    }

    statusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'info' | 'success' | 'warn' | 'danger' | 'secondary'> = {
            IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'danger', PENDING: 'warn',
        };
        return map[status] ?? 'secondary';
    }

    statusLabel(status: string): string {
        const map: Record<string, string> = {
            CREATED: 'Creado', IN_PROGRESS: 'En curso', WAITING_CLIENT: 'Esperando cliente',
            OBSERVED: 'Observado', APPROVED: 'Aprobado', REJECTED: 'Rechazado',
            COMPLETED: 'Completado', CANCELLED: 'Cancelado',
        };
        return map[status] ?? status;
    }
}
