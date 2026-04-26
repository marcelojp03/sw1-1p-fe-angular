import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ProcedureService } from '../../../core/services/procedure.service';
import { PolicyService } from '../../../core/services/policy.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { PolicySummaryResponse, ClientResponse } from '../../../core/models/wf.models';

@Component({
    selector: 'app-officer-nuevo-tramite',
    standalone: true,
    imports: [FormsModule, ToastModule, ButtonModule, SelectModule, CardModule, InputTextModule],
    providers: [MessageService],
    templateUrl: './officer-nuevo-tramite.component.html',
})
export class OfficerNuevoTramiteComponent implements OnInit {
    private router = inject(Router);
    private procedureService = inject(ProcedureService);
    private policyService = inject(PolicyService);
    private clientService = inject(ClientService);
    private auth = inject(AuthService);
    private message = inject(MessageService);

    policies = signal<PolicySummaryResponse[]>([]);
    clients = signal<ClientResponse[]>([]);
    loadingPolicies = true;
    loadingClients = true;
    saving = false;

    selectedPolicyId: number | null = null;
    selectedClientId: number | null = null;

    ngOnInit(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId ?? 0;
        this.policyService.listPublished(orgId).subscribe({
            next: (p) => { this.policies.set(p); this.loadingPolicies = false; },
            error: () => { this.loadingPolicies = false; }
        });
        this.clientService.list(orgId).subscribe({
            next: (c) => { this.clients.set(c); this.loadingClients = false; },
            error: () => { this.loadingClients = false; }
        });
    }

    get canSubmit(): boolean {
        return !!this.selectedPolicyId && !!this.selectedClientId && !this.saving;
    }

    iniciar(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId ?? 0;
        this.saving = true;
        this.procedureService.start({
            policyId: this.selectedPolicyId!,
            clientId: this.selectedClientId!,
            organizationId: orgId,
        }).subscribe({
            next: () => {
                this.saving = false;
                this.message.add({ severity: 'success', summary: 'Trámite iniciado', detail: 'El trámite fue creado correctamente' });
                setTimeout(() => this.router.navigate(['/officer/tramites']), 1500);
            },
            error: () => {
                this.saving = false;
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar el trámite' });
            }
        });
    }

    volver(): void { this.router.navigate(['/officer/tramites']); }
}
