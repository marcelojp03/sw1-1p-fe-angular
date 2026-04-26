import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { UsuarioService } from './usuarios.service';
import { AuthService } from '@/core/services/auth.service';
import { UserResponse, RegisterRequest, UpdateUserRequest } from './usuario.model';

const ROLES_DISPONIBLES = [
    { label: 'Administrador', value: 'ADMIN' },
    { label: 'Oficial', value: 'OFFICER' },
];

@Component({
    selector: 'app-admin-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, SelectModule, MultiSelectModule, PasswordModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-usuarios.component.html'
})
export class AdminUsuariosComponent implements OnInit {
    private usuarioService = inject(UsuarioService);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    usuarios = signal<UserResponse[]>([]);
    loading = true;

    readonly roles = ROLES_DISPONIBLES;

    dialogVisible = false;
    form: RegisterRequest = { email: '', password: '', fullName: '', roles: [] };

    editarVisible = false;
    editForm: UpdateUserRequest = { fullName: '', email: '', roles: [] };
    editId = '';

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.usuarioService.listar().subscribe({
            next: (res: any) => {
                this.loading = false;
                if (Array.isArray(res)) {
                    this.usuarios.set(res);
                } else if (res?.content) {
                    this.usuarios.set(res.content);
                } else {
                    this.usuarios.set([]);
                }
            },
            error: () => { this.loading = false; this.error('No se pudo cargar la información'); }
        });
    }

    nuevo(): void {
        this.form = { email: '', password: '', fullName: '', roles: [] };
        this.dialogVisible = true;
    }

    guardar(): void {
        if (!this.form.email || !this.form.fullName) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Correo y nombre completo son requeridos', life: 3000 });
            return;
        }
        if (!this.form.password) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La contraseña es requerida', life: 3000 });
            return;
        }
        const body: RegisterRequest = {
            ...this.form,
            organizationId: this.authService.getCurrentUser()?.organizationId,
        };
        this.usuarioService.crear(body).subscribe({
            next: () => {
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente', life: 3000 });
                this.load();
            },
            error: (e: any) => this.error(e.error?.message ?? 'Error al crear el usuario')
        });
    }

    abrirEditar(u: UserResponse): void {
        this.editId = u.id;
        this.editForm = {
            fullName: u.fullName,
            email: u.email,
            phone: u.phone ?? '',
            positionName: u.positionName ?? '',
            roles: [...u.roles],
        };
        this.editarVisible = true;
    }

    guardarEdicion(): void {
        if (!this.editForm.fullName || !this.editForm.email) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Nombre y correo son requeridos', life: 3000 });
            return;
        }
        this.usuarioService.actualizar(this.editId, this.editForm).subscribe({
            next: () => {
                this.editarVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente', life: 3000 });
                this.load();
            },
            error: (e: any) => this.error(e.error?.message ?? 'Error al actualizar el usuario')
        });
    }

    confirmarEliminar(u: UserResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar al usuario "${u.fullName}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.usuarioService.eliminar(u.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar el usuario')
            })
        });
    }

    toggleEstado(u: UserResponse): void {
        this.usuarioService.cambiarEstado(u.id, !u.active).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Usuario ${!u.active ? 'activado' : 'desactivado'}`, life: 3000 });
                this.load();
            },
            error: () => this.error('No se pudo cambiar el estado del usuario')
        });
    }

    get rolesOptions() { return this.roles; }

    rolSeverity(rol: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (rol) {
            case 'ADMIN': return 'success';
            case 'OFFICER': return 'info';
            default: return 'secondary';
        }
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
