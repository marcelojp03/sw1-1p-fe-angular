import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TaskService } from '../../../core/services/task.service';
import { TaskResponse, FormField } from '../../../core/models/wf.models';

@Component({
    selector: 'app-officer-completar-tarea',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ToastModule, ButtonModule,
        InputTextModule, TextareaModule, SelectModule, DatePickerModule,
        CheckboxModule, CardModule, ProgressSpinnerModule, TagModule, DividerModule,
    ],
    providers: [MessageService],
    template: `
    <div class="p-4 max-w-3xl mx-auto">
      <p-toast />

      @if (loading()) {
        <div class="flex justify-center items-center h-48">
          <p-progressspinner />
        </div>
      }

      @if (!loading() && tarea()) {
        <div class="mb-4 flex items-center gap-2">
          <p-button
            icon="pi pi-arrow-left"
            label="Volver"
            severity="secondary"
            [text]="true"
            (onClick)="router.navigate(['/officer/tareas'])"
          />
          <h2 class="text-xl font-semibold m-0">Completar Tarea</h2>
        </div>

        <p-card>
          <ng-template pTemplate="header">
            <div class="p-4 pb-0">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-sm text-surface-400 m-0">Trámite {{ tarea()!.procedureCode }}</p>
                  <h3 class="text-lg font-semibold mt-1 mb-0">{{ tarea()!.label }}</h3>
                </div>
                <p-tag [value]="tarea()!.status" [severity]="statusSeverity(tarea()!.status)" />
              </div>
            </div>
          </ng-template>

          @if (fields().length > 0) {
            <p-divider>
              <span class="text-sm font-medium text-surface-500">Formulario</span>
            </p-divider>

            <div class="flex flex-col gap-4">
              @for (field of fields(); track field.name) {
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">
                    {{ field.label }}
                    @if (field.required) { <span class="text-red-500">*</span> }
                  </label>

                  @switch (field.type) {
                    @case ('TEXT') {
                      <input
                        pInputText
                        [(ngModel)]="formResponse[field.name]"
                        [placeholder]="field.placeholder ?? ''"
                        class="w-full"
                      />
                    }
                    @case ('NUMBER') {
                      <input
                        pInputText
                        type="number"
                        [(ngModel)]="formResponse[field.name]"
                        [placeholder]="field.placeholder ?? ''"
                        class="w-full"
                      />
                    }
                    @case ('TEXTAREA') {
                      <textarea
                        pTextarea
                        [(ngModel)]="formResponse[field.name]"
                        rows="3"
                        class="w-full"
                        [placeholder]="field.placeholder ?? ''"
                      ></textarea>
                    }
                    @case ('DATE') {
                      <p-datepicker
                        [(ngModel)]="formResponse[field.name]"
                        dateFormat="dd/mm/yy"
                        [showIcon]="true"
                        class="w-full"
                      />
                    }
                    @case ('SELECT') {
                      <p-select
                        [(ngModel)]="formResponse[field.name]"
                        [options]="field.options ?? []"
                        [placeholder]="'Seleccionar...'"
                        class="w-full"
                      />
                    }
                    @case ('BOOLEAN') {
                      <div class="flex items-center gap-2">
                        <p-checkbox
                          [(ngModel)]="formResponse[field.name]"
                          [binary]="true"
                          [inputId]="'cb_' + field.name"
                        />
                        <label [for]="'cb_' + field.name" class="text-sm">{{ field.label }}</label>
                      </div>
                    }
                    @case ('FILE') {
                      <div class="flex flex-col gap-2">
                        <input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                          (change)="onFileChange($event, field.name)"
                          class="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4
                                 file:rounded file:border-0 file:text-sm file:font-medium
                                 file:bg-primary file:text-white hover:file:bg-primary-600 cursor-pointer"
                        />
                        @if (selectedFiles[field.name]?.length) {
                          <div class="flex flex-wrap gap-1 mt-1">
                            @for (f of selectedFiles[field.name]; track f.name) {
                              <span class="inline-flex items-center gap-1 bg-surface-100 text-surface-700 text-xs px-2 py-1 rounded">
                                <i class="pi pi-file text-xs"></i> {{ f.name }}
                              </span>
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }

          <p-divider>
            <span class="text-sm font-medium text-surface-500">Observaciones</span>
          </p-divider>

          <textarea
            pTextarea
            [(ngModel)]="notes"
            rows="3"
            class="w-full"
            placeholder="Notas o comentarios adicionales (opcional)..."
          ></textarea>

          <div class="flex justify-end gap-2 mt-4">
            <p-button
              label="Cancelar"
              severity="secondary"
              [outlined]="true"
              (onClick)="router.navigate(['/officer/tareas'])"
            />
            <p-button
              label="Completar Tarea"
              icon="pi pi-check"
              [loading]="submitting()"
              (onClick)="submit()"
            />
          </div>
        </p-card>
      }
    </div>
    `,
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

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.taskService.get(id).subscribe({
            next: (t) => {
                this.tarea.set(t);
                const form = t.form as { fields?: FormField[] } | null;
                if (form?.fields) {
                    this.fields.set(form.fields);
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

        this.taskService.complete(id, { formResponse: this.formResponse, notes: this.notes }).subscribe({
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
