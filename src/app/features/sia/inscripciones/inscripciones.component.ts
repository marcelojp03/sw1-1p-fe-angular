import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { SiaService } from '@/core/services/sia.service';
import {
    InscripcionRequest, InscripcionResponse,
    EstudianteResponse, GestionAcademicaResponse, CursoResponse, ParaleloResponse
} from '@/core/models/sia.models';

@Component({
    selector: 'app-inscripciones',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, SelectModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './inscripciones.component.html'
})
export class InscripcionesComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    inscripciones = signal<InscripcionResponse[]>([]);
    estudiantes = signal<EstudianteResponse[]>([]);
    gestiones = signal<GestionAcademicaResponse[]>([]);
    cursos = signal<CursoResponse[]>([]);
    paralelos = signal<ParaleloResponse[]>([]);
    paralelosFiltrados = signal<ParaleloResponse[]>([]);

    loading = true;
    dialogVisible = false;
    form: InscripcionRequest = { idEstudiante: '', idGestion: '', idCurso: '', idParalelo: '' };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        forkJoin({
            inscripciones: this.service.listarInscripciones(),
            estudiantes: this.service.listarEstudiantes(),
            gestiones: this.service.listarGestiones(),
            cursos: this.service.listarCursos(),
            paralelos: this.service.listarParalelos()
        }).subscribe({
            next: ({ inscripciones, estudiantes, gestiones, cursos, paralelos }) => {
                this.loading = false;
                if (inscripciones.codigo === 200) this.inscripciones.set(inscripciones.data ?? []);
                if (estudiantes.codigo === 200) this.estudiantes.set(estudiantes.data ?? []);
                if (gestiones.codigo === 200) this.gestiones.set(gestiones.data ?? []);
                if (cursos.codigo === 200) this.cursos.set(cursos.data ?? []);
                if (paralelos.codigo === 200) this.paralelos.set(paralelos.data ?? []);
            },
            error: () => { this.loading = false; this.error('No se pudo cargar la información'); }
        });
    }

    nueva(): void {
        this.form = { idEstudiante: '', idGestion: '', idCurso: '', idParalelo: '' };
        this.paralelosFiltrados.set([]);
        this.dialogVisible = true;
    }

    onCursoChange(): void {
        this.form.idParalelo = '';
        if (this.form.idCurso && this.form.idGestion) {
            const filtrados = this.paralelos().filter(p =>
                p.idCurso === this.form.idCurso && p.idGestion === this.form.idGestion
            );
            this.paralelosFiltrados.set(filtrados);
        } else {
            this.paralelosFiltrados.set([]);
        }
    }

    guardar(): void {
        if (!this.form.idEstudiante || !this.form.idGestion || !this.form.idCurso || !this.form.idParalelo) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos', life: 3000 });
            return;
        }
        this.service.crearInscripcion(this.form).subscribe({
            next: () => {
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Inscripción registrada', life: 3000 });
                this.load();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al registrar la inscripción. Verifique que no exista una duplicada.')
        });
    }

    confirmarEliminar(i: InscripcionResponse): void {
        const nombre = this.getNombreEstudiante(i.idEstudiante);
        this.confirmationService.confirm({
            message: `¿Eliminar la inscripción de "${nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarInscripcion(i.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Inscripción eliminada', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar la inscripción')
            })
        });
    }

    getNombreEstudiante(id: string): string {
        const e = this.estudiantes().find(x => x.id === id);
        return e ? `${e.apellidos}, ${e.nombres}` : id;
    }
    getNombreGestion(id: string): string { return this.gestiones().find(x => x.id === id)?.nombre ?? id; }
    getNombreCurso(id: string): string { return this.cursos().find(x => x.id === id)?.nombre ?? id; }
    getNombreParalelo(id: string): string { return this.paralelos().find(x => x.id === id)?.nombre ?? id; }

    get estudiantesOptions() {
        return this.estudiantes().map(e => ({ label: `${e.apellidos}, ${e.nombres} (${e.codigoEstudiante})`, value: e.id }));
    }
    get gestionesOptions() {
        return this.gestiones().map(g => ({ label: g.nombre, value: g.id }));
    }
    get cursosOptions() {
        return this.cursos().map(c => ({ label: c.nombre, value: c.id }));
    }
    get paralelosOptions() {
        return this.paralelosFiltrados().map(p => ({ label: p.nombre, value: p.id }));
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 }); }
}
