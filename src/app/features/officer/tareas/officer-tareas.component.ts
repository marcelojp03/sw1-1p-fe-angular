import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe } from '@angular/common';
import { TaskService } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskResponse, CompleteTaskRequest } from '../../../core/models/wf.models';

@Component({
    selector: 'app-officer-tareas',
    standalone: true,
    imports: [
        FormsModule, ToastModule, ButtonModule, TableModule, TagModule,
        TabsModule, DialogModule, TextareaModule, IconFieldModule, InputIconModule,
        InputTextModule, DatePipe,
    ],
    providers: [MessageService],
    templateUrl: './officer-tareas.component.html',
})
export class OfficerTareasComponent implements OnInit {
    private taskService = inject(TaskService);
    private auth = inject(AuthService);
    private message = inject(MessageService);

    tareasArea = signal<TaskResponse[]>([]);
    tareasMias = signal<TaskResponse[]>([]);
    loading = false;

    // Dialog completar
    dialogVisible = false;
    selectedTask: TaskResponse | null = null;
    notes = '';
    completing = false;

    ngOnInit(): void { this.loadAll(); }

    loadAll(): void {
        this.loading = true;
        const user = this.auth.currentUserSignal();

        this.taskService.listMine().subscribe({
            next: (list) => { this.tareasMias.set(list); this.checkDone(); },
            error: () => { this.checkDone(); this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar tus tareas' }); }
        });

        if (user?.areaId) {
            this.taskService.listByArea(user.areaId).subscribe({
                next: (list) => { this.tareasArea.set(list); this.checkDone(); },
                error: () => { this.checkDone(); }
            });
        } else {
            this.loading = false;
        }
    }

    private _doneCount = 0;
    private checkDone(): void {
        this._doneCount++;
        if (this._doneCount >= 2) { this.loading = false; this._doneCount = 0; }
    }

    claim(task: TaskResponse): void {
        this.taskService.claim(task.id).subscribe({
            next: () => {
                this.message.add({ severity: 'success', summary: 'Reclamada', detail: `Tarea "${task.label}" asignada a ti` });
                this.loadAll();
            },
            error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reclamar la tarea' })
        });
    }

    abrirCompletar(task: TaskResponse): void {
        this.selectedTask = task;
        this.notes = '';
        this.dialogVisible = true;
    }

    completar(): void {
        if (!this.selectedTask) return;
        this.completing = true;
        const body: CompleteTaskRequest = { notes: this.notes };
        this.taskService.complete(this.selectedTask.id, body).subscribe({
            next: () => {
                this.completing = false;
                this.dialogVisible = false;
                this.message.add({ severity: 'success', summary: 'Completada', detail: 'Tarea completada exitosamente' });
                this.loadAll();
            },
            error: () => {
                this.completing = false;
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la tarea' });
            }
        });
    }

    statusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'info' | 'success' | 'warn' | 'danger' | 'secondary'> = {
            PENDING: 'warn', IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'danger',
        };
        return map[status] ?? 'secondary';
    }
}
