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
import { InputNumberModule } from 'primeng/inputnumber';
import { forkJoin } from 'rxjs';
import { SiaService } from '@/core/services/sia.service';
import {
    ParaleloRequest, ParaleloResponse,
    CursoResponse, GestionAcademicaResponse
} from '@/core/models/sia.models';

@Component({
    selector: 'app-paralelos',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, SelectModule, InputNumberModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './paralelos.component.html'
})
export class ParalelosComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    paralelos = signal<ParaleloResponse[]>([]);
    cursos = signal<CursoResponse[]>([]);
    gestiones = signal<GestionAcademicaResponse[]>([]);
    loading = true;
    dialogVisible = false;
    editMode = false;
    selectedId = '';

    form: ParaleloRequest = { idCurso: '', idGestion: '', nombre: '', capacidad: undefined };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        forkJoin({
            paralelos: this.service.listarParalelos(),
            cursos: this.service.listarCursos(),
            gestiones: this.service.listarGestiones()
        }).subscribe({
            next: ({ paralelos, cursos, gestiones }) => {
                this.loading = false;
                if (paralelos.codigo === 200) this.paralelos.set(paralelos.data ?? []);
                if (cursos.codigo === 200) this.cursos.set(cursos.data ?? []);
                if (gestiones.codigo === 200) this.gestiones.set(gestiones.data ?? []);
            },
            error: () => { this.loading = false; this.error('No se pudieron cargar los datos'); }
        });
    }

    nuevo(): void {
        this.form = { idCurso: '', idGestion: '', nombre: '', capacidad: undefined };
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(p: ParaleloResponse): void {
        this.form = { idCurso: p.idCurso, idGestion: p.idGestion, nombre: p.nombre, capacidad: p.capacidad };
        this.selectedId = p.id;
        this.editMode = true;
        this.dialogVisible = true;
    }

    guardar(): void {
        if (!this.form.idCurso || !this.form.idGestion || !this.form.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Curso, gestión y nombre son requeridos', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizarParalelo(this.selectedId, this.form)
            : this.service.crearParalelo(this.form);
        obs.subscribe({
            next: () => {
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Paralelo actualizado' : 'Paralelo creado', life: 3000 });
                this.load();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar el paralelo')
        });
    }

    confirmarEliminar(p: ParaleloResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar el paralelo "${p.nombre}" del curso ${this.getNombreCurso(p.idCurso)}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarParalelo(p.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Paralelo eliminado', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar el paralelo')
            })
        });
    }

    getNombreCurso(id: string): string { return this.cursos().find(c => c.id === id)?.nombre ?? id; }
    getNombreGestion(id: string): string { return this.gestiones().find(g => g.id === id)?.nombre ?? id; }

    get cursosOptions() { return this.cursos().map(c => ({ label: c.nombre, value: c.id })); }
    get gestionesOptions() { return this.gestiones().map(g => ({ label: g.nombre, value: g.id })); }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
