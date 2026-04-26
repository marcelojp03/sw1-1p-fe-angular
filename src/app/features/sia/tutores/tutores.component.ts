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
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { SiaService } from '@/core/services/sia.service';
import { StorageService } from '@/core/services/storage.service';
import { FileUploadComponent } from '@/shared/components/file-upload/file-upload.component';
import {
    TutorRequest, TutorResponse,
    TutorEstudianteRequest, TutorEstudianteResponse,
    EstudianteResponse
} from '@/core/models/sia.models';

@Component({
    selector: 'app-tutores',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, CheckboxModule, SelectModule, FileUploadComponent],
    providers: [MessageService, ConfirmationService],
    templateUrl: './tutores.component.html'
})
export class TutoresComponent implements OnInit {
    private service = inject(SiaService);
    private storageService = inject(StorageService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    tutores = signal<TutorResponse[]>([]);
    estudiantes = signal<EstudianteResponse[]>([]);
    loading = true;

    // Dialog CRUD
    dialogVisible = false;
    editMode = false;
    selectedId = '';
    form: TutorRequest = { documentoIdentidad: '', nombres: '', apellidos: '', telefono: '', correo: '', direccion: '' };

    // Foto de perfil
    fotoUrl = signal<string | null>(null);
    fotoArchivo: File | null = null;
    uploadingFoto = false;

    // Dialog vínculo
    vinculoVisible = false;
    tutorSeleccionado: TutorResponse | null = null;
    idEstudianteVinculo = '';
    vinculoForm: TutorEstudianteRequest = { idTutor: '', parentesco: '', esPrincipal: false };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        forkJoin({
            tutores: this.service.listarTutores(),
            estudiantes: this.service.listarEstudiantes()
        }).subscribe({
            next: ({ tutores, estudiantes }) => {
                this.loading = false;
                if (tutores.codigo === 200) this.tutores.set(tutores.data ?? []);
                if (estudiantes.codigo === 200) this.estudiantes.set(estudiantes.data ?? []);
            },
            error: () => { this.loading = false; this.error('No se pudo cargar la información'); }
        });
    }

    nuevo(): void {
        this.form = { documentoIdentidad: '', nombres: '', apellidos: '', telefono: '', correo: '', direccion: '' };
        this.fotoUrl.set(null);
        this.fotoArchivo = null;
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(t: TutorResponse): void {
        this.form = {
            documentoIdentidad: t.documentoIdentidad,
            nombres: t.nombres,
            apellidos: t.apellidos,
            telefono: t.telefono ?? '',
            correo: t.correo ?? '',
            direccion: t.direccion ?? ''
        };
        this.selectedId = t.id;
        this.fotoArchivo = null;
        this.fotoUrl.set(null);
        this.editMode = true;
        this.dialogVisible = true;
        this.loadFoto(t.id);
    }

    private loadFoto(id: string): void {
        this.storageService.getPrincipal('TUTOR', 'tutor', id, 'FOTO_PERFIL').subscribe({
            next: r => { if (r.codigo === 200 && r.data?.url) this.fotoUrl.set(r.data.url); },
            error: () => { /* Sin foto previa */ }
        });
    }

    onFotoSeleccionada(file: File): void { this.fotoArchivo = file; }

    guardar(): void {
        if (!this.form.documentoIdentidad || !this.form.nombres || !this.form.apellidos) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizarTutor(this.selectedId, this.form)
            : this.service.crearTutor(this.form);
        obs.subscribe({
            next: (r) => {
                const id = this.editMode ? this.selectedId : r.data?.id;
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Tutor actualizado' : 'Tutor registrado', life: 3000 });
                if (id && this.fotoArchivo) this.subirFoto(id, this.fotoArchivo);
                this.load();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar el tutor')
        });
    }

    private subirFoto(id: string, file: File): void {
        this.uploadingFoto = true;
        this.storageService.upload(file, { modulo: 'TUTOR', entidad: 'tutor', idEntidad: id, tipoReferencia: 'FOTO_PERFIL' }).subscribe({
            next: () => { this.uploadingFoto = false; },
            error: () => { this.uploadingFoto = false; this.error('Tutor guardado, pero hubo un error al subir la foto'); }
        });
    }

    confirmarEliminar(t: TutorResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar al tutor "${t.nombres} ${t.apellidos}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarTutor(t.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Tutor eliminado', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar el tutor')
            })
        });
    }

    abrirVinculos(t: TutorResponse): void {
        this.tutorSeleccionado = t;
        this.idEstudianteVinculo = '';
        this.vinculoForm = { idTutor: t.id, parentesco: '', esPrincipal: false };
        this.vinculoVisible = true;
    }

    vincular(): void {
        if (!this.idEstudianteVinculo) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione un estudiante', life: 3000 });
            return;
        }
        this.service.vincularTutorEstudiante(this.idEstudianteVinculo, this.vinculoForm).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Vinculado', detail: 'Estudiante vinculado al tutor', life: 3000 });
                this.idEstudianteVinculo = '';
                this.vinculoForm.esPrincipal = false;
                this.vinculoForm.parentesco = '';
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al vincular')
        });
    }

    get estudiantesOptions() {
        return this.estudiantes().map(e => ({ label: `${e.nombres} ${e.apellidos} (${e.codigoEstudiante})`, value: e.id }));
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
