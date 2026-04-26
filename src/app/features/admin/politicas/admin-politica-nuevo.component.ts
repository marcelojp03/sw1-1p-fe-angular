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
    template: `
    <div class="p-4 max-w-2xl mx-auto">
      <p-toast />

      <div class="mb-4 flex items-center gap-2">
        <p-button
          icon="pi pi-arrow-left"
          label="Volver"
          severity="secondary"
          [text]="true"
          (onClick)="router.navigate(['/admin/politicas'])"
        />
        <h2 class="text-xl font-semibold m-0">Nueva Política</h2>
      </div>

      <p-card>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium">Clave única <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="form.policyKey"
              placeholder="ej: solicitud_credito" class="w-full" />
            <small class="text-surface-400">Solo letras, números y guiones bajos. No se puede cambiar.</small>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-medium">Nombre <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="form.name"
              placeholder="ej: Solicitud de Crédito" class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-medium">Descripción</label>
            <textarea pTextarea [(ngModel)]="form.description"
              rows="3" class="w-full" placeholder="Descripción de la política..."></textarea>
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-medium">Canales de inicio</label>
            <p-multiselect
              [(ngModel)]="form.allowedStartChannels"
              [options]="channels"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar canales"
              class="w-full"
            />
          </div>

          <div class="flex justify-end gap-2 mt-2">
            <p-button
              label="Cancelar"
              severity="secondary"
              [outlined]="true"
              (onClick)="router.navigate(['/admin/politicas'])"
            />
            <p-button
              label="Crear y Diseñar"
              icon="pi pi-sitemap"
              [loading]="saving()"
              [disabled]="!form.policyKey || !form.name"
              (onClick)="crear()"
            />
          </div>
        </div>
      </p-card>
    </div>
    `,
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
