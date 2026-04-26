import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ClientService } from './clientes.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClientResponse, CreateClientRequest, UpdateClientRequest } from './cliente.model';

const DOCUMENT_TYPES = ['CI', 'NIT', 'PASAPORTE', 'CARNET_EXTRANJERIA'];

@Component({
    selector: 'app-officer-clientes',
    standalone: true,
    imports: [
        FormsModule, ToastModule, ConfirmDialogModule, ButtonModule, InputTextModule,
        TableModule, DialogModule, SelectModule, IconFieldModule, InputIconModule,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './officer-clientes.component.html',
})
export class OfficerClientesComponent implements OnInit {
    private clientService = inject(ClientService);
    private auth = inject(AuthService);
    private message = inject(MessageService);

    clientes = signal<ClientResponse[]>([]);
    loading = true;

    dialogVisible = false;
    editMode = false;
    saving = false;
    editId: number | null = null;

    docTypes = DOCUMENT_TYPES;
    form: CreateClientRequest = this.emptyForm();

    ngOnInit(): void { this.load(); }

    private get orgId(): number {
        return this.auth.currentUserSignal()?.organizationId ?? 0;
    }

    private emptyForm(): CreateClientRequest {
        return { organizationId: 0, fullName: '', documentType: 'CI', documentNumber: '', phone: '', email: '', address: '' };
    }

    load(): void {
        this.loading = true;
        this.clientService.list(this.orgId).subscribe({
            next: (list) => { this.clientes.set(list); this.loading = false; },
            error: () => { this.loading = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar los clientes' }); }
        });
    }

    nuevo(): void {
        this.editMode = false;
        this.editId = null;
        this.form = this.emptyForm();
        this.form.organizationId = this.orgId;
        this.dialogVisible = true;
    }

    editar(c: ClientResponse): void {
        this.editMode = true;
        this.editId = c.id;
        this.form = {
            organizationId: c.organizationId,
            fullName: c.fullName,
            documentType: c.documentType,
            documentNumber: c.documentNumber,
            phone: c.phone ?? '',
            email: c.email ?? '',
            address: c.address ?? '',
        };
        this.dialogVisible = true;
    }

    guardar(): void {
        this.saving = true;
        if (this.editMode && this.editId) {
            const upd: UpdateClientRequest = { fullName: this.form.fullName, phone: this.form.phone, email: this.form.email, address: this.form.address };
            this.clientService.update(this.editId, upd).subscribe({
                next: () => { this.saving = false; this.dialogVisible = false; this.message.add({ severity: 'success', summary: 'Guardado', detail: 'Cliente actualizado' }); this.load(); },
                error: () => { this.saving = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar' }); }
            });
        } else {
            this.clientService.create(this.form).subscribe({
                next: () => { this.saving = false; this.dialogVisible = false; this.message.add({ severity: 'success', summary: 'Guardado', detail: 'Cliente creado' }); this.load(); },
                error: () => { this.saving = false; this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el cliente' }); }
            });
        }
    }
}
