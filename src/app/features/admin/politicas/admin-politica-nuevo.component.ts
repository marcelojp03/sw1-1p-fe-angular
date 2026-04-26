import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { MultiSelectModule } from 'primeng/multiselect';
import { PoliticaService } from './politicas.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreatePolicyRequest } from './politica.model';

@Component({
    selector: 'app-admin-politica-nuevo',
    standalone: true,
    imports: [
        FormsModule, ToastModule, ButtonModule, InputTextModule,
        TextareaModule, CardModule, MultiSelectModule,
    ],
    providers: [MessageService],
    templateUrl: './admin-politica-nuevo.component.html',
})
export class AdminPoliticaNuevoComponent {
    private politicaService = inject(PoliticaService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    router = inject(Router);

    saving = signal(false);

    form: Partial<CreatePolicyRequest> = {
        policyKey: '',
        name: '',
        description: '',
        allowedStartChannels: [],
    };

    channels = [
        { label: 'Web', value: 'WEB' },
        { label: 'Móvil', value: 'MOBILE' },
        { label: 'API', value: 'API' },
        { label: 'Presencial', value: 'IN_PERSON' },
    ];

    crear(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId;
        if (!orgId) return;

        const body: CreatePolicyRequest = {
            organizationId: orgId,
            policyKey: this.form.policyKey!,
            name: this.form.name!,
            description: this.form.description,
            allowedStartChannels: this.form.allowedStartChannels,
        };

        this.saving.set(true);
        this.politicaService.create(body).subscribe({
            next: (p) => {
                this.saving.set(false);
                this.router.navigate(['/admin/politicas', p.id, 'editar']);
            },
            error: () => {
                this.saving.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la política' });
            },
        });
    }
}
