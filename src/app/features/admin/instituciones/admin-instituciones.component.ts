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
import { InstitucionService } from '@/core/services/institucion.service';
import { InstitucionResponse, InstitucionRequest } from '@/core/models/sia.models';

@Component({
    selector: 'app-admin-instituciones',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, SelectModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './admin-instituciones.component.html'
})
export class AdminInstitucionesComponent implements OnInit {
    private service = inject(InstitucionService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    readonly tiposInstitucion = [
        { label: 'Fiscal', value: 'FISCAL' },
        { label: 'Convenio', value: 'CONVENIO' },
        { label: 'Privado', value: 'PRIVADO' },
    ];

    instituciones = signal<InstitucionResponse[]>([]);
    loading = true;
    dialogVisible = false;
    editMode = false;
    selectedId = '';

    form: InstitucionRequest = { nombre: '', codigo: '', tipoInstitucion: '', direccion: '', telefono: '', correo: '' };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.listar().subscribe({
            next: (r) => { this.loading = false; if (r.codigo === 200) this.instituciones.set(r.data ?? []); },
            error: () => { this.loading = false; this.error('No se pudieron cargar las instituciones'); }
        });
    }

    nuevo(): void {
        this.form = { nombre: '', codigo: '', tipoInstitucion: '', direccion: '', telefono: '', correo: '' };
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(inst: InstitucionResponse): void {
        this.form = { nombre: inst.nombre, codigo: inst.codigo ?? '', tipoInstitucion: inst.tipoInstitucion ?? '', direccion: inst.direccion ?? '', telefono: inst.telefono ?? '', correo: inst.correo ?? '' };
        this.selectedId = inst.id;
        this.editMode = true;
        this.dialogVisible = true;
    }

    guardar(): void {
        if (!this.form.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre es requerido', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizar(this.selectedId, this.form)
            : this.service.crear(this.form);
        obs.subscribe({
            next: () => { this.dialogVisible = false; this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Institución actualizada' : 'Institución creada', life: 3000 }); this.load(); },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar la institución')
        });
    }

    confirmarEliminar(inst: InstitucionResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la institución "${inst.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminar(inst.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Institución eliminada', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar la institución')
            })
        });
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
