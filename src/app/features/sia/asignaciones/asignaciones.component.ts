import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
import { SiaService } from '@/core/services/sia.service';
import {
    AsignacionDocenteRequest, AsignacionDocenteResponse,
    DocenteResponse, MateriaResponse, ParaleloResponse, GestionAcademicaResponse
} from '@/core/models/sia.models';

@Component({
    selector: 'app-asignaciones',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, SelectModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './asignaciones.component.html'
})
export class AsignacionesComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    asignaciones = signal<AsignacionDocenteResponse[]>([]);
    docentes = signal<DocenteResponse[]>([]);
    materias = signal<MateriaResponse[]>([]);
    paralelos = signal<ParaleloResponse[]>([]);
    gestiones = signal<GestionAcademicaResponse[]>([]);
    paralelosFiltrados = signal<ParaleloResponse[]>([]);

    loading = true;
    dialogVisible = false;
    form: AsignacionDocenteRequest = { idDocente: '', idMateria: '', idParalelo: '', idGestion: '' };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        forkJoin({
            asignaciones: this.service.listarAsignaciones(),
            docentes: this.service.listarDocentes(),
            materias: this.service.listarMaterias(),
            paralelos: this.service.listarParalelos(),
            gestiones: this.service.listarGestiones()
        }).subscribe({
            next: ({ asignaciones, docentes, materias, paralelos, gestiones }) => {
                this.loading = false;
                if (asignaciones.codigo === 200) this.asignaciones.set(asignaciones.data ?? []);
                if (docentes.codigo === 200) this.docentes.set(docentes.data ?? []);
                if (materias.codigo === 200) this.materias.set(materias.data ?? []);
                if (paralelos.codigo === 200) this.paralelos.set(paralelos.data ?? []);
                if (gestiones.codigo === 200) this.gestiones.set(gestiones.data ?? []);
            },
            error: () => { this.loading = false; this.error('No se pudo cargar la información'); }
        });
    }

    nueva(): void {
        this.form = { idDocente: '', idMateria: '', idParalelo: '', idGestion: '' };
        this.paralelosFiltrados.set([]);
        this.dialogVisible = true;
    }

    onGestionChange(): void {
        this.form.idParalelo = '';
        if (this.form.idGestion) {
            this.paralelosFiltrados.set(this.paralelos().filter(p => p.idGestion === this.form.idGestion));
        } else {
            this.paralelosFiltrados.set([]);
        }
    }

    guardar(): void {
        if (!this.form.idDocente || !this.form.idMateria || !this.form.idParalelo || !this.form.idGestion) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos', life: 3000 });
            return;
        }
        this.service.crearAsignacion(this.form).subscribe({
            next: () => {
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Asignación creada', life: 3000 });
                this.load();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al crear la asignación. Verifique que no exista una duplicada.')
        });
    }

    confirmarEliminar(a: AsignacionDocenteResponse): void {
        const docente = this.getNombreDocente(a.idDocente);
        const materia = this.getNombreMateria(a.idMateria);
        this.confirmationService.confirm({
            message: `¿Eliminar la asignación de "${docente}" en "${materia}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarAsignacion(a.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Asignación eliminada', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar la asignación')
            })
        });
    }

    getNombreDocente(id: string): string {
        const d = this.docentes().find(x => x.id === id);
        return d ? `${d.apellidos}, ${d.nombres}` : id;
    }
    getNombreMateria(id: string): string { return this.materias().find(x => x.id === id)?.nombre ?? id; }
    getNombreParalelo(id: string): string { return this.paralelos().find(x => x.id === id)?.nombre ?? id; }
    getNombreGestion(id: string): string { return this.gestiones().find(x => x.id === id)?.nombre ?? id; }

    get docentesOptions() {
        return this.docentes().map(d => ({ label: `${d.apellidos}, ${d.nombres}`, value: d.id }));
    }
    get materiasOptions() {
        return this.materias().map(m => ({ label: m.nombre, value: m.id }));
    }
    get gestionesOptions() {
        return this.gestiones().map(g => ({ label: g.nombre, value: g.id }));
    }
    get paralelosOptions() {
        return this.paralelosFiltrados().map(p => ({ label: p.nombre, value: p.id }));
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 }); }
}
