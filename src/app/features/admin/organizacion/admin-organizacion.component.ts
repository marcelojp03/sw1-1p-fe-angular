import { Component, OnInit, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { OrganizationService } from './organizacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationResponse, AreaResponse, CreateAreaRequest } from './organizacion.model';

@Component({
    selector: 'app-admin-organizacion',
    standalone: true,
    imports: [
        NgIf, FormsModule, ToastModule, ConfirmDialogModule, ButtonModule, InputTextModule,
        CardModule, TableModule, DialogModule, TagModule, ProgressSpinnerModule,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-organizacion.component.html',
})
export class AdminOrganizacionComponent implements OnInit {
    private orgService = inject(OrganizationService);
    private auth = inject(AuthService);
    private message = inject(MessageService);
    private confirm = inject(ConfirmationService);

    org = signal<OrganizationResponse | null>(null);
    loading = true;
    editMode = false;

    editNombre = '';
    editBusinessType = '';
    editRuc = '';
    editLogoUrl = '';

    // Áreas
    areaDialogVisible = false;
    areaEdit = false;
    areaId: number | null = null;
    areaNombre = '';
    areaDescripcion = '';
    areaSaving = false;

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        const orgId = this.auth.currentUserSignal()?.organizationId;
        if (!orgId) { this.loading = false; return; }
        this.orgService.get(orgId).subscribe({
            next: (o) => { this.org.set(o); this.loading = false; },
            error: () => { this.loading = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la organización' }); }
        });
    }

    iniciarEdicion(): void {
        const o = this.org();
        if (!o) return;
        this.editNombre = o.name;
        this.editBusinessType = o.businessType;
        this.editRuc = o.ruc ?? '';
        this.editLogoUrl = o.logoUrl ?? '';
        this.editMode = true;
    }

    cancelarEdicion(): void { this.editMode = false; }

    guardarOrg(): void {
        const orgId = this.org()?.id;
        if (!orgId) return;
        this.orgService.update(orgId, {
            name: this.editNombre,
            businessType: this.editBusinessType,
            ruc: this.editRuc || undefined,
            logoUrl: this.editLogoUrl || undefined,
        }).subscribe({
            next: (o) => {
                this.org.set(o);
                this.editMode = false;
                this.message.add({ severity: 'success', summary: 'Guardado', detail: 'Organización actualizada' });
            },
            error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }),
        });
    }

    // ── Áreas ─────────────────────────────────────────────────────────────────

    nuevaArea(): void {
        this.areaEdit = false;
        this.areaId = null;
        this.areaNombre = '';
        this.areaDescripcion = '';
        this.areaDialogVisible = true;
    }

    editarArea(area: AreaResponse): void {
        this.areaEdit = true;
        this.areaId = area.id;
        this.areaNombre = area.name;
        this.areaDescripcion = area.description ?? '';
        this.areaDialogVisible = true;
    }

    guardarArea(): void {
        const orgId = this.org()?.id;
        if (!orgId) return;
        const body: CreateAreaRequest = { name: this.areaNombre, description: this.areaDescripcion || undefined };
        this.areaSaving = true;
        const obs$ = this.areaEdit && this.areaId
            ? this.orgService.updateArea(orgId, this.areaId, body)
            : this.orgService.createArea(orgId, body);
        (obs$ as any).subscribe({
            next: () => {
                this.areaSaving = false;
                this.areaDialogVisible = false;
                this.message.add({ severity: 'success', summary: 'Guardado', detail: this.areaEdit ? 'Área actualizada' : 'Área creada' });
                this.load();
            },
            error: () => {
                this.areaSaving = false;
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el área' });
            },
        });
    }

    eliminarArea(area: AreaResponse): void {
        const orgId = this.org()?.id;
        if (!orgId) return;
        this.confirm.confirm({
            message: `¿Eliminar el área "${area.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.orgService.deleteArea(orgId, area.id).subscribe({
                    next: () => {
                        this.message.add({ severity: 'success', summary: 'Eliminado', detail: 'Área eliminada' });
                        this.load();
                    },
                    error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el área' }),
                });
            }
        });
    }
}
