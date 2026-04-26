import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { PoliticaService } from './politicas.service';
import { AuthService } from '../../../core/services/auth.service';
import { PolicySummaryResponse, CreatePolicyRequest } from './politica.model';

@Component({
    selector: 'app-admin-politicas',
    standalone: true,
    imports: [
        RouterModule, DatePipe, FormsModule, ToastModule, ButtonModule,
        TableModule, TagModule, ConfirmDialogModule,
        IconFieldModule, InputIconModule, InputTextModule,
        DialogModule, TextareaModule, MultiSelectModule,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-politicas.component.html',
})
export class AdminPoliticasComponent implements OnInit {
    private politicaService = inject(PoliticaService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private confirm = inject(ConfirmationService);
    private router = inject(Router);

    politicas = signal<PolicySummaryResponse[]>([]);
    loading = true;

    // Dialog nueva política
    nuevoDialogVisible = false;
    saving = signal(false);
    nuevoForm: Partial<CreatePolicyRequest> = { policyKey: '', name: '', description: '', allowedStartChannels: [] };

    channels = [
        { label: 'Web', value: 'WEB' },
        { label: 'Móvil', value: 'MOBILE' },
        { label: 'API', value: 'API' },
        { label: 'Presencial', value: 'IN_PERSON' },
    ];

    ngOnInit(): void { this.load(); }

    abrirNuevoDialog(): void {
        this.nuevoForm = { policyKey: '', name: '', description: '', allowedStartChannels: [] };
        this.nuevoDialogVisible = true;
    }

    crearPolitica(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId;
        if (!orgId) return;
        const body: CreatePolicyRequest = {
            organizationId: orgId,
            policyKey: this.nuevoForm.policyKey!,
            name: this.nuevoForm.name!,
            description: this.nuevoForm.description,
            allowedStartChannels: this.nuevoForm.allowedStartChannels,
        };
        this.saving.set(true);
        this.politicaService.create(body).subscribe({
            next: (p) => {
                this.saving.set(false);
                this.nuevoDialogVisible = false;
                this.router.navigate(['/admin/politicas', p.id, 'editar']);
            },
            error: () => {
                this.saving.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la política' });
            },
        });
    }

    load(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId;
        if (!orgId) { this.loading = false; return; }
        this.loading = true;
        this.politicaService.list(orgId).subscribe({
            next: (list) => { this.politicas.set(list); this.loading = false; },
            error: () => { this.loading = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las políticas' }); },
        });
    }

    confirmarPublicar(p: PolicySummaryResponse): void {
        this.confirm.confirm({
            message: `¿Publicar la política "${p.name}" v${p.version}?`,
            header: 'Publicar Política',
            icon: 'pi pi-send',
            accept: () => this.publicar(p.id),
        });
    }

    publicar(id: string): void {
        this.politicaService.publish(id).subscribe({
            next: () => { this.message.add({ severity: 'success', summary: 'Publicada', detail: 'Política publicada' }); this.load(); },
            error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo publicar' }),
        });
    }

    confirmarArchivar(p: PolicySummaryResponse): void {
        this.confirm.confirm({
            message: `¿Archivar la política "${p.name}"?`,
            header: 'Archivar Política',
            icon: 'pi pi-archive',
            accept: () => this.archivar(p.id),
        });
    }

    archivar(id: string): void {
        this.politicaService.archive(id).subscribe({
            next: () => { this.message.add({ severity: 'success', summary: 'Archivada', detail: 'Política archivada' }); this.load(); },
            error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo archivar' }),
        });
    }

    statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            DRAFT: 'warn',
            PUBLISHED: 'success',
            ARCHIVED: 'secondary',
        };
        return map[status] ?? 'info';
    }
}
