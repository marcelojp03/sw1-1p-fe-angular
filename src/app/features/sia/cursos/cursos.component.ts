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
import { SiaService } from '@/core/services/sia.service';
import { CursoResponse, CursoRequest } from '@/core/models/sia.models';

@Component({
    selector: 'app-cursos',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './cursos.component.html'
})
export class CursosComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    cursos = signal<CursoResponse[]>([]);
    loading = true;
    dialogVisible = false;
    editMode = false;
    selectedId = '';

    form: CursoRequest = { codigo: '', nombre: '', nivel: '' };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.listarCursos().subscribe({
            next: (r) => { this.loading = false; if (r.codigo === 200) this.cursos.set(r.data ?? []); },
            error: () => { this.loading = false; this.error('No se pudieron cargar los cursos'); }
        });
    }

    nuevo(): void {
        this.form = { codigo: '', nombre: '', nivel: '' };
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(c: CursoResponse): void {
        this.form = { codigo: c.codigo, nombre: c.nombre, nivel: c.nivel ?? '' };
        this.selectedId = c.id;
        this.editMode = true;
        this.dialogVisible = true;
    }

    guardar(): void {
        if (!this.form.codigo || !this.form.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El código y el nombre son requeridos', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizarCurso(this.selectedId, this.form)
            : this.service.crearCurso(this.form);
        obs.subscribe({
            next: () => { this.dialogVisible = false; this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Curso actualizado' : 'Curso creado', life: 3000 }); this.load(); },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar el curso')
        });
    }

    confirmarEliminar(c: CursoResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar el curso "${c.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarCurso(c.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Curso eliminado', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar el curso')
            })
        });
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
