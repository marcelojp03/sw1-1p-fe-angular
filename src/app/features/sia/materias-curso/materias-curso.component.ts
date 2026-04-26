import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { forkJoin } from 'rxjs';
import { SiaService } from '@/core/services/sia.service';
import { CursoResponse, MateriaResponse, CursoMateriaResponse } from '@/core/models/sia.models';

@Component({
    selector: 'app-materias-curso',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        DialogModule, TooltipModule, ConfirmDialogModule, SelectModule, DividerModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './materias-curso.component.html'
})
export class MateriasCursoComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    cursos = signal<CursoResponse[]>([]);
    todasMaterias = signal<MateriaResponse[]>([]);
    materiasCurso = signal<CursoMateriaResponse[]>([]);

    cursoSeleccionado: CursoResponse | null = null;
    idCursoSeleccionado = '';
    idMateriaAgregar = '';
    loadingMaterias = false;
    dialogVisible = false;

    ngOnInit(): void {
        forkJoin({
            cursos: this.service.listarCursos(),
            materias: this.service.listarMaterias()
        }).subscribe({
            next: ({ cursos, materias }) => {
                if (cursos.codigo === 200) this.cursos.set(cursos.data ?? []);
                if (materias.codigo === 200) this.todasMaterias.set(materias.data ?? []);
            },
            error: () => this.error('Error al cargar datos')
        });
    }

    seleccionarCurso(): void {
        if (!this.idCursoSeleccionado) return;
        this.cursoSeleccionado = this.cursos().find(c => c.id === this.idCursoSeleccionado) ?? null;
        this.cargarMateriasCurso();
    }

    cargarMateriasCurso(): void {
        if (!this.idCursoSeleccionado) return;
        this.loadingMaterias = true;
        this.service.listarMateriasCurso(this.idCursoSeleccionado).subscribe({
            next: r => {
                this.loadingMaterias = false;
                if (r.codigo === 200) this.materiasCurso.set(r.data ?? []);
            },
            error: () => { this.loadingMaterias = false; this.error('Error al cargar materias del curso'); }
        });
    }

    get materiasDisponibles() {
        const asignadas = new Set(this.materiasCurso().map(mc => mc.idMateria));
        return this.todasMaterias()
            .filter(m => !asignadas.has(m.id) && m.estado === 'ACTIVO')
            .map(m => ({ label: `${m.codigo} — ${m.nombre}`, value: m.id }));
    }

    asignarMateria(): void {
        if (!this.idMateriaAgregar || !this.idCursoSeleccionado) return;
        this.service.asignarMateriaCurso(this.idCursoSeleccionado, { idMateria: this.idMateriaAgregar }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Materia asignada al curso', life: 3000 });
                this.idMateriaAgregar = '';
                this.dialogVisible = false;
                this.cargarMateriasCurso();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al asignar materia')
        });
    }

    confirmarDesasignar(mc: CursoMateriaResponse): void {
        const nombre = this.getNombreMateria(mc.idMateria);
        this.confirmationService.confirm({
            message: `¿Quitar la materia "${nombre}" del curso ${this.cursoSeleccionado?.nombre}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.desasignarMateriaCurso(mc.idCurso, mc.idMateria).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Materia desasignada', life: 3000 }); this.cargarMateriasCurso(); },
                error: () => this.error('No se pudo desasignar la materia')
            })
        });
    }

    getNombreMateria(id: string): string { return this.todasMaterias().find(m => m.id === id)?.nombre ?? id; }
    getCodigoMateria(id: string): string { return this.todasMaterias().find(m => m.id === id)?.codigo ?? ''; }

    get cursosOptions() { return this.cursos().map(c => ({ label: c.nombre, value: c.id })); }

    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
