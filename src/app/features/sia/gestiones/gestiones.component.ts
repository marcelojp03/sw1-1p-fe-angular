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
import { CheckboxModule } from 'primeng/checkbox';
import { SiaService } from '@/core/services/sia.service';
import { GestionAcademicaResponse, GestionAcademicaRequest } from '@/core/models/sia.models';

@Component({
    selector: 'app-gestiones',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, InputIconModule, IconFieldModule, DialogModule, TooltipModule,
        ConfirmDialogModule, CheckboxModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './gestiones.component.html'
})
export class GestionesComponent implements OnInit {
    private service = inject(SiaService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    gestiones = signal<GestionAcademicaResponse[]>([]);
    loading = true;
    dialogVisible = false;
    editMode = false;
    selectedId = '';

    form: GestionAcademicaRequest = { nombre: '', fechaInicio: '', fechaFin: '', activa: false };

    @ViewChild('dt') dt!: Table;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.service.listarGestiones().subscribe({
            next: (r) => { this.loading = false; if (r.codigo === 200) this.gestiones.set(r.data ?? []); },
            error: () => { this.loading = false; this.error('No se pudieron cargar las gestiones'); }
        });
    }

    nuevo(): void {
        this.form = { nombre: '', fechaInicio: '', fechaFin: '', activa: false };
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(g: GestionAcademicaResponse): void {
        this.form = { nombre: g.nombre, fechaInicio: g.fechaInicio, fechaFin: g.fechaFin, activa: g.activa };
        this.selectedId = g.id;
        this.editMode = true;
        this.dialogVisible = true;
    }

    guardar(): void {
        if (!this.form.nombre || !this.form.fechaInicio || !this.form.fechaFin) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos requeridos', life: 3000 });
            return;
        }
        const obs = this.editMode
            ? this.service.actualizarGestion(this.selectedId, this.form)
            : this.service.crearGestion(this.form);
        obs.subscribe({
            next: () => { this.dialogVisible = false; this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editMode ? 'Gestión actualizada' : 'Gestión creada', life: 3000 }); this.load(); },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar la gestión')
        });
    }

    confirmarEliminar(g: GestionAcademicaResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la gestión "${g.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.service.eliminarGestion(g.id).subscribe({
                next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Gestión eliminada', life: 3000 }); this.load(); },
                error: () => this.error('No se pudo eliminar la gestión')
            })
        });
    }

    onGlobalFilter(t: Table, e: Event): void { t.filterGlobal((e.target as HTMLInputElement).value, 'contains'); }
    private error(msg: string): void { this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }); }
}
