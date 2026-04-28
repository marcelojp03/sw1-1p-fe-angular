import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TaskService } from './tareas.service';
import { TaskResponse, FormField } from './tarea.model';

@Component({
    selector: 'app-officer-completar-tarea',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ToastModule, ButtonModule,
        InputTextModule, InputNumberModule, TextareaModule, SelectModule, DatePickerModule,
        CheckboxModule, CardModule, ProgressSpinnerModule, TagModule, DividerModule,
    ],
    providers: [MessageService],
    templateUrl: './officer-completar-tarea.component.html',
})
export class OfficerCompletarTareaComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private taskService = inject(TaskService);
    private message = inject(MessageService);
    router = inject(Router);

    loading = signal(true);
    submitting = signal(false);
    tarea = signal<TaskResponse | null>(null);
    fields = signal<FormField[]>([]);

    formResponse: Record<string, unknown> = {};
    notes = '';
    selectedFiles: Record<string, File[]> = {};
    generarObservacion = false;
    observacionTexto = '';

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.taskService.get(id).subscribe({
            next: (t) => {
                this.tarea.set(t);
                const form = t.form as { fields?: FormField[] } | null;
                if (form?.fields) {
                    // Normalizar: el backend puede usar 'fieldId' en lugar de 'name'
                    const normalized: FormField[] = (form.fields as any[]).map((f: any) => ({
                        ...f,
                        name: (f.name && f.name.trim()) ? f.name : (f.fieldId ?? ''),
                    }));
                    this.fields.set(normalized);
                    // Inicializar formResponse con valores neutros para evitar NaN en p-inputnumber
                    const initial: Record<string, unknown> = {};
                    normalized.forEach((f: FormField) => {
                        if (f.type === 'NUMBER') initial[f.name] = null;
                        else if (f.type === 'BOOLEAN') initial[f.name] = false;
                        else initial[f.name] = '';
                    });
                    this.formResponse = initial;
                }
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la tarea' });
            },
        });
    }

    onFileChange(event: Event, fieldName: string): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.selectedFiles[fieldName] = Array.from(input.files);
        }
    }

    submit(): void {
        const id = this.tarea()!.id;
        this.submitting.set(true);

        let finalNotes = this.notes;
        if (this.generarObservacion && this.observacionTexto.trim()) {
            finalNotes = (finalNotes ? finalNotes + '\n' : '') + `[OBSERVACIÓN CLIENTE] ${this.observacionTexto.trim()}`;
        }

        this.taskService.complete(id, { formResponse: this.formResponse, notes: finalNotes }).subscribe({
            next: () => {
                const allFiles = Object.values(this.selectedFiles).flat();
                if (allFiles.length > 0) {
                    this.taskService.uploadAttachments(id, allFiles).subscribe({
                        next: () => this.onSuccess(),
                        error: () => {
                            this.submitting.set(false);
                            this.message.add({ severity: 'warn', summary: 'Advertencia', detail: 'Tarea completada pero los archivos no se subieron' });
                            setTimeout(() => this.router.navigate(['/officer/tareas']), 2000);
                        },
                    });
                } else {
                    this.onSuccess();
                }
            },
            error: () => {
                this.submitting.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la tarea' });
            },
        });
    }

    private onSuccess(): void {
        this.submitting.set(false);
        this.message.add({ severity: 'success', summary: 'Listo', detail: 'Tarea completada exitosamente' });
        setTimeout(() => this.router.navigate(['/officer/tareas']), 1500);
    }

    statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            PENDING: 'warn',
            IN_PROGRESS: 'info',
            COMPLETED: 'success',
            CANCELLED: 'danger',
        };
        return map[status] ?? 'secondary';
    }
}
