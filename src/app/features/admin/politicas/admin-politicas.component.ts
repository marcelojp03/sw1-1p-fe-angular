import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
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
import { PoliticaService } from '../../../core/services/politica.service';
import { AuthService } from '../../../core/services/auth.service';
import { PolicySummaryResponse } from '../../../core/models/wf.models';

@Component({
    selector: 'app-admin-politicas',
    standalone: true,
    imports: [
        RouterModule, DatePipe, FormsModule, ToastModule, ButtonModule,
        TableModule, TagModule, ConfirmDialogModule,
        IconFieldModule, InputIconModule, InputTextModule,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-politicas.component.html',
})
export class AdminPoliticasComponent implements OnInit {
    private politicaService = inject(PoliticaService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private confirm = inject(ConfirmationService);

    politicas = signal<PolicySummaryResponse[]>([]);
    loading = true;

    ngOnInit(): void { this.load(); }

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

    publicar(id: number): void {
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

    archivar(id: number): void {
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
