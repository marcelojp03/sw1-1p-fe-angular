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
import { InputNumberModule } from 'primeng/inputnumber';
import { SiaService } from '@/core/services/sia.service';
import { MateriaResponse, MateriaRequest } from '@/core/models/sia.models';

@Component({
    selector: 'app-materias',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, InputNumberModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './materias.component.html'
})
export class MateriasComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    materias = signal<MateriaResponse[]>([]);
    loading = true;
    dialogVisible = false;
    editMode = false;
    selectedId = '';

    form: MateriaRequest = { codigo: '', nombre: '', area: '', cargaHoraria: undefined };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.listarMaterias().subscribe({
            next: (r) => { this.loading = false; if (r.codigo === 200) this.materias.set(r.data ?? []); },
            error: () => { this.loading = false; this.error('No se pudieron cargar las materias'); }
        });
    }

    nuevo(): void {
        this.form = { codigo: '', nombre: '', area: '', cargaHoraria: undefined };
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(m: MateriaResponse): void {
        this.form = { codigo: m.codigo, nombre: m.nombre, area: m.area ?? '', cargaHoraria: m.cargaHoraria };
        this.selectedId = m.id;
        this.editMode = true;
        this.dialogVisible = true;
    }

    guardar(): void {
        if (!this.form.codigo || !this.form.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Código y nombre son requeridos', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizarMateria(this.selectedId, this.form)
            : this.service.crearMateria(this.form);
        obs.subscribe({
            next: () => { this.dialogVisible = false; this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Materia actualizada' : 'Materia creada', life: 3000 }); this.load(); },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar la materia')
        });
    }

    confirmarEliminar(m: MateriaResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la materia "${m.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarMateria(m.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Materia eliminada', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar la materia')
            })
        });
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
