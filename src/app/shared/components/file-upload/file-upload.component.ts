import {
    Component, Input, Output, EventEmitter, HostListener, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-file-upload',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressSpinnerModule],
    templateUrl: './file-upload.component.html'
})
export class FileUploadComponent {
    /** URL de la imagen ya guardada (para mostrar preview actual) */
    @Input() previewUrl: string | null = null;

    /** Texto de la etiqueta de la zona de carga */
    @Input() label = 'Imagen o PDF';

    /** Tipos MIME aceptados (string para <input accept>) */
    @Input() accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

    /** Tamaño máximo en MB */
    @Input() maxSizeMb = 10;

    /** Si true, muestra el spinner de carga (lo controla el padre) */
    @Input() uploading = false;

    /** Emite el File seleccionado o arrastrado */
    @Output() fileSelected = new EventEmitter<File>();

    /** Emite cuando el usuario quiere eliminar el archivo actual */
    @Output() removeFile = new EventEmitter<void>();

    isDragging = signal(false);
    localPreview = signal<string | null>(null);
    localFileName = signal<string | null>(null);
    errorMsg = signal<string | null>(null);

    get effectivePreview(): string | null {
        return this.localPreview() ?? this.previewUrl ?? null;
    }

    get isImage(): boolean {
        const p = this.effectivePreview;
        return !!p && !p.endsWith('.pdf') && (
            p.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(p)
        );
    }

    @HostListener('dragover', ['$event'])
    onDragOver(e: DragEvent): void {
        e.preventDefault();
        this.isDragging.set(true);
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave(e: DragEvent): void {
        e.preventDefault();
        this.isDragging.set(false);
    }

    @HostListener('drop', ['$event'])
    onDrop(e: DragEvent): void {
        e.preventDefault();
        this.isDragging.set(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) this.processFile(file);
    }

    onInputChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) this.processFile(file);
        (event.target as HTMLInputElement).value = '';
    }

    private processFile(file: File): void {
        this.errorMsg.set(null);

        const allowedMimes = this.accept.split(',').map(m => m.trim());
        if (!allowedMimes.includes(file.type)) {
            this.errorMsg.set(`Tipo de archivo no permitido. Acepta: ${this.accept}`);
            return;
        }
        if (file.size > this.maxSizeMb * 1024 * 1024) {
            this.errorMsg.set(`El archivo no debe superar ${this.maxSizeMb} MB`);
            return;
        }

        this.localFileName.set(file.name);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => this.localPreview.set(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            this.localPreview.set(null);
        }

        this.fileSelected.emit(file);
    }

    onRemove(): void {
        this.localPreview.set(null);
        this.localFileName.set(null);
        this.errorMsg.set(null);
        this.removeFile.emit();
    }
}
