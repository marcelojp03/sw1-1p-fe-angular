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
import { SiaService } from '@/core/services/sia.service';
import { StorageService } from '@/core/services/storage.service';
import { FileUploadComponent } from '@/shared/components/file-upload/file-upload.component';
import { EstudianteResponse, EstudianteRequest } from '@/core/models/sia.models';

@Component({
    selector: 'app-estudiantes',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, SelectModule, FileUploadComponent],
    providers: [MessageService, ConfirmationService],
    templateUrl: './estudiantes.component.html'
})
export class EstudiantesComponent implements OnInit {
    private service = inject(SiaService);
    private storageService = inject(StorageService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    estudiantes = signal<EstudianteResponse[]>([]);
    loading = true;
    dialogVisible = false;
    editMode = false;
    selectedId = '';

    // Foto de perfil
    fotoUrl = signal<string | null>(null);
    fotoArchivo: File | null = null;
    uploadingFoto = false;

    sexoOpts = [{ label: 'Masculino', value: 'M' }, { label: 'Femenino', value: 'F' }, { label: 'Otro', value: 'O' }];

    form: EstudianteRequest = { codigoEstudiante: '', documentoIdentidad: '', nombres: '', apellidos: '', fechaNacimiento: '', sexo: '', telefono: '', correo: '' };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.listarEstudiantes().subscribe({
            next: (r) => { this.loading = false; if (r.codigo === 200) this.estudiantes.set(r.data ?? []); },
            error: () => { this.loading = false; this.error('No se pudieron cargar los estudiantes'); }
        });
    }

    nuevo(): void {
        this.form = { codigoEstudiante: '', documentoIdentidad: '', nombres: '', apellidos: '', fechaNacimiento: '', sexo: '', telefono: '', correo: '' };
        this.fotoUrl.set(null);
        this.fotoArchivo = null;
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(e: EstudianteResponse): void {
        this.form = { codigoEstudiante: e.codigoEstudiante, documentoIdentidad: e.documentoIdentidad, nombres: e.nombres, apellidos: e.apellidos, fechaNacimiento: e.fechaNacimiento ?? '', sexo: e.sexo ?? '', telefono: e.telefono ?? '', correo: e.correo ?? '' };
        this.selectedId = e.id;
        this.fotoArchivo = null;
        this.fotoUrl.set(null);
        this.editMode = true;
        this.dialogVisible = true;
        this.loadFoto(e.id);
    }

    private loadFoto(id: string): void {
        this.storageService.getPrincipal('ESTUDIANTE', 'estudiante', id, 'FOTO_PERFIL').subscribe({
            next: r => { if (r.codigo === 200 && r.data?.url) this.fotoUrl.set(r.data.url); },
            error: () => { /* Sin foto previa */ }
        });
    }

    onFotoSeleccionada(file: File): void { this.fotoArchivo = file; }

    guardar(): void {
        if (!this.form.codigoEstudiante || !this.form.nombres || !this.form.apellidos || !this.form.documentoIdentidad) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos requeridos', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizarEstudiante(this.selectedId, this.form)
            : this.service.crearEstudiante(this.form);
        obs.subscribe({
            next: (r) => {
                const id = this.editMode ? this.selectedId : r.data?.id;
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Estudiante actualizado' : 'Estudiante registrado', life: 3000 });
                if (id && this.fotoArchivo) this.subirFoto(id, this.fotoArchivo);
                this.load();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar el estudiante')
        });
    }

    private subirFoto(id: string, file: File): void {
        this.uploadingFoto = true;
        this.storageService.upload(file, { modulo: 'ESTUDIANTE', entidad: 'estudiante', idEntidad: id, tipoReferencia: 'FOTO_PERFIL' }).subscribe({
            next: () => { this.uploadingFoto = false; },
            error: () => { this.uploadingFoto = false; this.error('Estudiante guardado, pero hubo un error al subir la foto'); }
        });
    }

    confirmarEliminar(e: EstudianteResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar al estudiante "${e.nombres} ${e.apellidos}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarEstudiante(e.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Estudiante eliminado', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar el estudiante')
            })
        });
    }

    sexoLabel(s?: string): string {
        return s === 'M' ? 'Masculino' : s === 'F' ? 'Femenino' : s === 'O' ? 'Otro' : '—';
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
