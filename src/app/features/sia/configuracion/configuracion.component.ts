import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InstitucionService } from '@/core/services/institucion.service';
import { StorageService } from '@/core/services/storage.service';
import { AuthService } from '@/core/services/auth.service';
import { FileUploadComponent } from '@/shared/components/file-upload/file-upload.component';
import {
    ConfiguracionInstitucionRequest,
    ConfiguracionInstitucionResponse
} from '@/core/models/sia.models';

/** Configuraciones predefinidas con etiquetas amigables */
const CONFIGS_CONOCIDAS: Record<string, { label: string; descripcion: string; esBooleano: boolean }> = {
    NOMBRE_CORTO:         { label: 'Nombre corto',               descripcion: 'Nombre abreviado de la institución', esBooleano: false },
    DESCRIPCION:          { label: 'Descripción',                 descripcion: 'Descripción breve de la institución',esBooleano: false },
    TELEFONO_CONTACTO:    { label: 'Teléfono de contacto',        descripcion: 'Número de teléfono principal',       esBooleano: false },
    CORREO_CONTACTO:      { label: 'Correo de contacto',          descripcion: 'Correo electrónico institucional',   esBooleano: false },
    SITIO_WEB:            { label: 'Sitio web',                   descripcion: 'URL del sitio web',                  esBooleano: false },
    COLOR_PRIMARIO:       { label: 'Color primario',              descripcion: 'Código hexadecimal (#RRGGBB)',        esBooleano: false },
    MATRICULA_HABILITADA: { label: 'Matrícula habilitada',        descripcion: 'Permite inscripciones actualmente',  esBooleano: true  },
    MAX_ALUMNOS_AULA:     { label: 'Máximo de alumnos por aula',  descripcion: 'Capacidad máxima por paralelo',      esBooleano: false },
    ESCALA_CALIFICACION:  { label: 'Escala de calificación',      descripcion: 'Nota máxima (ej: 100)',              esBooleano: false },
    NOTA_MINIMA_APROBACION:    { label: 'Nota mínima de aprobación',   descripcion: 'Puntaje mínimo para aprobar',       esBooleano: false },
    NOTA_MINIMA_RECUPERACION:  { label: 'Nota mínima de recuperación', descripcion: 'Puntaje mínimo para recuperación',  esBooleano: false },
};

@Component({
    selector: 'app-configuracion',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, TagModule,
        InputTextModule, DialogModule, TooltipModule, TextareaModule,
        ToggleSwitchModule, ProgressSpinnerModule, FileUploadComponent, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent implements OnInit {
    private institucionService  = inject(InstitucionService);
    private storageService      = inject(StorageService);
    private authService         = inject(AuthService);
    private messageService      = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    configuraciones = signal<ConfiguracionInstitucionResponse[]>([]);
    loading   = true;
    uploading = false;
    dialogVisible = false;
    editMode  = false;

    // Logo de la institución (sección separada)
    logoUrl   = signal<string | null>(null);
    logoId    = signal<string | null>(null);
    logoLoading = false;

    // Usados solo en el dialog
    claveSeleccionada = '';
    valorTexto    = '';
    valorBooleano = false;
    descripcion   = '';

    get configActual() { return CONFIGS_CONOCIDAS[this.claveSeleccionada]; }
    get esBooleano()  { return this.configActual?.esBooleano ?? false; }
    get labelClave()  { return this.configActual?.label ?? this.claveSeleccionada; }

    opcionesNuevas = Object.entries(CONFIGS_CONOCIDAS)
        .map(([clave, meta]) => ({ clave, label: meta.label }));

    private get idInstitucion(): string {
        return String(this.authService.getCurrentUser()?.organizationId ?? '');
    }

    ngOnInit(): void {
        this.load();
        this.loadLogo();
    }

    load(): void {
        if (!this.idInstitucion) { this.loading = false; return; }
        this.loading = true;
        this.institucionService.listarConfiguraciones(this.idInstitucion).subscribe({
            next: r => {
                this.loading = false;
                if (r.codigo === 200) this.configuraciones.set(r.data ?? []);
            },
            error: () => { this.loading = false; this.error('No se pudieron cargar las configuraciones'); }
        });
    }

    loadLogo(): void {
        if (!this.idInstitucion) return;
        this.storageService.getPrincipal('INSTITUCION', 'institucion', this.idInstitucion, 'LOGO').subscribe({
            next: r => {
                if (r.codigo === 200 && r.data?.url) {
                    this.logoUrl.set(r.data.url);
                    this.logoId.set(r.data.id ?? null);
                }
            },
            error: () => { /* Sin logo previo — no es error */ }
        });
    }

    onLogoSeleccionado(file: File): void {
        if (!this.idInstitucion) return;
        this.uploading = true;
        this.storageService.upload(file, {
            modulo: 'INSTITUCION',
            entidad: 'institucion',
            idEntidad: this.idInstitucion,
            tipoReferencia: 'LOGO',
            esPrincipal: true
        }).subscribe({
            next: r => {
                this.uploading = false;
                if (r.codigo === 200 && r.data?.url) {
                    this.logoUrl.set(r.data.url);
                    this.logoId.set(r.data.id ?? null);
                    this.messageService.add({ severity: 'success', summary: 'Logo actualizado', detail: 'El logo se subió correctamente', life: 3000 });
                }
            },
            error: () => { this.uploading = false; this.error('Error al subir el logo'); }
        });
    }

    onQuitarLogo(): void {
        const id = this.logoId();
        if (!id) { this.logoUrl.set(null); this.logoId.set(null); return; }
        this.storageService.eliminar(id).subscribe({
            next: () => {
                this.logoUrl.set(null);
                this.logoId.set(null);
                this.messageService.add({ severity: 'success', summary: 'Logo eliminado', detail: 'El logo fue quitado correctamente', life: 3000 });
            },
            error: () => this.error('No se pudo eliminar el logo')
        });
    }

    nueva(): void {
        this.claveSeleccionada = Object.keys(CONFIGS_CONOCIDAS)[0];
        this.valorTexto    = '';
        this.valorBooleano = false;
        this.descripcion   = CONFIGS_CONOCIDAS[this.claveSeleccionada]?.descripcion ?? '';
        this.editMode = false;
        this.dialogVisible = true;
    }

    editar(c: ConfiguracionInstitucionResponse): void {
        this.claveSeleccionada = c.clave;
        if (this.esBooleano) {
            this.valorBooleano = c.valor.toLowerCase() === 'true';
            this.valorTexto    = '';
        } else {
            this.valorTexto    = c.valor;
            this.valorBooleano = false;
        }
        this.descripcion = c.descripcion ?? this.configActual?.descripcion ?? '';
        this.editMode = true;
        this.dialogVisible = true;
    }

    seleccionarOpcion(clave: string): void {
        this.claveSeleccionada = clave;
        this.valorTexto    = '';
        this.valorBooleano = false;
        this.descripcion   = CONFIGS_CONOCIDAS[clave]?.descripcion ?? '';
    }

    guardar(): void {
        const valor = this.esBooleano ? String(this.valorBooleano) : this.valorTexto.trim();
        if (!this.claveSeleccionada || !valor) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Completa todos los campos requeridos', life: 3000 });
            return;
        }

        let tipoValor = 'TEXTO';
        if (this.esBooleano) tipoValor = 'BOOLEANO';
        else if (/^\d+(\.\d+)?$/.test(valor)) tipoValor = 'NUMERO';

        const request: ConfiguracionInstitucionRequest = {
            clave: this.claveSeleccionada,
            valor,
            tipoValor,
            descripcion: this.descripcion
        };

        this.institucionService.actualizarConfiguracion(this.idInstitucion, request).subscribe({
            next: () => {
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: `"${this.labelClave}" guardado correctamente`, life: 3000 });
                this.load();
            },
            error: (e) => this.error(e.error?.mensaje ?? 'Error al guardar')
        });
    }

    eliminar(c: ConfiguracionInstitucionResponse): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la configuración "${this.etiqueta(c.clave)}"? Esta acción no se puede deshacer.`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonProps: { label: 'Eliminar', severity: 'danger', icon: 'pi pi-trash' },
            rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
            accept: () => {
                this.institucionService.eliminarConfiguracion(this.idInstitucion, c.clave).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `"${this.etiqueta(c.clave)}" eliminado`, life: 3000 });
                        this.configuraciones.update(list => list.filter(x => x.clave !== c.clave));
                    },
                    error: (e) => this.error(e.error?.mensaje ?? 'No se pudo eliminar la configuración')
                });
            }
        });
    }

    etiqueta(clave: string): string {
        return CONFIGS_CONOCIDAS[clave]?.label ?? clave;
    }

    private error(msg: string): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
    }
}



